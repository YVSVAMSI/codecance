import express from 'express';
import { ensurePatternHuntSeed } from '../seedPatternHunt.js';
import { evaluateSemanticAnswer } from '../semanticEvaluator.js';
import { logAudit } from '../audit.js';

// Topics/patterns visible to a user = global curriculum (createdBy null) + their own custom rows.
function scopeTopics(prisma, userId) {
  return prisma.topic.findMany({
    where: { OR: [{ createdBy: null }, { createdBy: userId }] },
    orderBy: { order: 'asc' },
  });
}

function scopePatterns(prisma, userId) {
  return prisma.pattern.findMany({
    where: { OR: [{ createdBy: null }, { createdBy: userId }] },
    orderBy: { order: 'asc' },
  });
}

async function patternsWithPhCount(prisma, topics, patterns) {
  const allPhProblems = await prisma.patternHuntProblem.findMany();
  const topicById = Object.fromEntries(topics.map(t => [t.id, t]));
  return patterns.map(pat => {
    const topName = topicById[pat.topicId]?.name;
    const count = allPhProblems.filter(prob => prob.topicName === topName && prob.patternName === pat.name).length;
    return { ...pat, phCount: count };
  });
}

export function createTrackerRouter(prisma, authenticate, requireRole) {
  const router = express.Router();
  router.use(authenticate);

  // GET /api/data - global + custom curriculum, user questions/revisions/settings
  router.get('/data', async (req, res) => {
    try {
      const userId = req.user.id;
      const topics = await scopeTopics(prisma, userId);
      const patterns = await scopePatterns(prisma, userId);
      const questions = await prisma.question.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const revisions = await prisma.revision.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      let settingsRecord = await prisma.settings.findUnique({ where: { userId } });
      if (!settingsRecord) {
        settingsRecord = await prisma.settings.create({
          data: {
            userId,
            greenIntervals: '7,14,30,60',
            yellowIntervals: '3,7,14,30',
            redIntervals: '1,3,7,14',
            growthFactor: 1.6,
            masteryMinQuestions: 3,
            masteryGreenPct: 0.7,
            comfortableGreenPct: 0.5,
            weakYellowPct: 0.4,
          },
        });
      }

      const settings = {
        greenIntervals: settingsRecord.greenIntervals.split(',').map(n => parseInt(n.trim(), 10)),
        yellowIntervals: settingsRecord.yellowIntervals.split(',').map(n => parseInt(n.trim(), 10)),
        redIntervals: settingsRecord.redIntervals.split(',').map(n => parseInt(n.trim(), 10)),
        growthFactor: settingsRecord.growthFactor,
        masteryMinQuestions: settingsRecord.masteryMinQuestions,
        masteryGreenPct: settingsRecord.masteryGreenPct,
        comfortableGreenPct: settingsRecord.comfortableGreenPct,
        weakYellowPct: settingsRecord.weakYellowPct,
      };

      await ensurePatternHuntSeed(prisma);
      const patternsWithCount = await patternsWithPhCount(prisma, topics, patterns);

      res.json({ topics, patterns: patternsWithCount, questions, revisions, settings });
    } catch (err) {
      console.error('Fetch data error:', err);
      res.status(500).json({ error: 'Failed to fetch tracker data' });
    }
  });

  // GET /api/pattern-hunt - fetch mixed Pattern Hunt problems and user evaluations
  router.get('/pattern-hunt', async (req, res) => {
    try {
      const userId = req.user.id;
      await ensurePatternHuntSeed(prisma);

      const phProblems = await prisma.patternHuntProblem.findMany({ orderBy: { order: 'asc' } });
      const userQuestions = await prisma.question.findMany({ where: { userId } });

      const problems = phProblems.map(prob => {
        const matchingQ = userQuestions.find(q =>
          q.keyConcept === prob.title ||
          (q.notes && q.notes.includes(prob.title)) ||
          (q.problemLink && prob.problemLink && q.problemLink === prob.problemLink)
        );

        return {
          id: prob.id,
          title: prob.title,
          difficulty: prob.difficulty,
          problemLink: prob.problemLink,
          // Internal patternName is NOT exposed to enforce hidden pattern requirement!
          userProgress: matchingQ ? {
            questionId: matchingQ.id,
            status: matchingQ.status,
            confidence: matchingQ.confidence,
            lastSolvedAt: matchingQ.lastSolvedAt,
            timeTaken: matchingQ.timeTaken,
            neededHint: matchingQ.neededHint,
            userPatternInput: matchingQ.userPatternInput || matchingQ.keyConcept,
            recognitionCorrect: matchingQ.recognitionCorrect,
            notes: matchingQ.notes,
          } : null,
        };
      });

      // Analyze weak spots based on pattern recognition accuracy
      const patterns = await scopePatterns(prisma, userId);
      const weakSpots = [];

      for (const pat of patterns) {
        const patQs = userQuestions.filter(q => q.patternId === pat.id && q.userPatternInput);
        if (patQs.length > 0) {
          const totalAttempts = patQs.length;
          const correctAttempts = patQs.filter(q => q.recognitionCorrect === true).length;
          const accuracy = Math.round((correctAttempts / totalAttempts) * 100);
          const hintsCount = patQs.filter(q => q.neededHint).length;

          if (accuracy < 70 || hintsCount >= 2) {
            weakSpots.push({
              patternName: pat.name,
              accuracy,
              totalAttempts,
              hintsCount,
              insight: `Your pattern recognition for ${pat.name} may need more practice. Accuracy is ${accuracy}% across ${totalAttempts} problem(s).`,
            });
          }
        }
      }

      res.json({ problems, weakSpots });
    } catch (err) {
      console.error('Fetch pattern-hunt error:', err);
      res.status(500).json({ error: 'Failed to fetch pattern hunt problems' });
    }
  });

  // POST /api/pattern-hunt/submit - submit attempt/solve for a pattern hunt problem
  router.post('/pattern-hunt/submit', async (req, res) => {
    try {
      const userId = req.user.id;
      const { problemId, status, confidence, lastSolvedAt, timeTaken, neededHint, keyConcept, notes } = req.body;

      if (!confidence) {
        return res.status(400).json({ error: 'Confidence (Green/Yellow/Red) is required to log an attempt' });
      }

      const problem = await prisma.patternHuntProblem.findUnique({ where: { id: problemId } });
      if (!problem) {
        return res.status(404).json({ error: 'Pattern hunt problem not found' });
      }

      const evalResult = evaluateSemanticAnswer(keyConcept, problem.patternName, problem.topicName);
      const recognitionCorrect = evalResult.validApproach;

      // Resolve topic/pattern: user's custom first, then global curriculum.
      const userTopic = await prisma.topic.findFirst({ where: { createdBy: userId, name: problem.topicName } })
        || await prisma.topic.findFirst({ where: { createdBy: null, name: problem.topicName } })
        || await prisma.topic.findFirst({ where: { createdBy: null } });

      const userPattern = await prisma.pattern.findFirst({ where: { createdBy: userId, name: problem.patternName } })
        || await prisma.pattern.findFirst({ where: { createdBy: null, name: problem.patternName } })
        || await prisma.pattern.findFirst({ where: { createdBy: null } });

      if (!userTopic || !userPattern) {
        return res.status(500).json({ error: 'Pattern roadmap mapping error' });
      }

      const userQuestions = await prisma.question.findMany({ where: { userId } });
      const existingQ = userQuestions.find(q =>
        q.keyConcept === problem.title ||
        (q.notes && q.notes.includes(problem.title)) ||
        (q.problemLink && problem.problemLink && q.problemLink === problem.problemLink)
      );

      const incrementRevision = () => {
        if (!confidence || !lastSolvedAt) return null;
        const [y, m, d] = lastSolvedAt.split('-').map(Number);
        const baseUtc = Date.UTC(y, m - 1, d);
        const days = confidence === 'Green' ? 7 : confidence === 'Yellow' ? 3 : 1;
        const nd = new Date(baseUtc + days * 86400000);
        return `${nd.getUTCFullYear()}-${String(nd.getUTCMonth() + 1).padStart(2, '0')}-${String(nd.getUTCDate()).padStart(2, '0')}`;
      };

      let questionRecord;

      if (existingQ) {
        questionRecord = await prisma.question.update({
          where: { id: existingQ.id },
          data: {
            status,
            confidence: confidence || null,
            lastSolvedAt: lastSolvedAt || null,
            timeTaken: timeTaken === '' || timeTaken === undefined ? null : Number(timeTaken),
            neededHint: !!neededHint,
            keyConcept: problem.title,
            notes: notes ? `${notes}\n[Pattern Hunt Input: ${keyConcept || 'None'}]` : `[Pattern Hunt Input: ${keyConcept || 'None'}]`,
            userPatternInput: keyConcept || null,
            recognitionCorrect,
            isPatternHunt: true,
            nextRevision: incrementRevision() || existingQ.nextRevision,
          },
        });
      } else {
        // Per-user sequence counter avoids races on the shared global pattern's seqCounter.
        const existingCount = await prisma.question.count({ where: { userId, patternId: userPattern.id } });
        const seq = existingCount + 1;

        questionRecord = await prisma.question.create({
          data: {
            userId,
            topicId: userTopic.id,
            patternId: userPattern.id,
            seq,
            difficulty: problem.difficulty,
            status,
            confidence: confidence || null,
            lastSolvedAt: lastSolvedAt || null,
            timeTaken: timeTaken === '' || timeTaken === undefined ? null : Number(timeTaken),
            neededHint: !!neededHint,
            keyConcept: problem.title,
            notes: notes ? `${notes}\n[Pattern Hunt Input: ${keyConcept || 'None'}]` : `[Pattern Hunt Input: ${keyConcept || 'None'}]`,
            problemLink: problem.problemLink || null,
            userPatternInput: keyConcept || null,
            recognitionCorrect,
            isPatternHunt: true,
            nextRevision: incrementRevision(),
            revisionCount: 0,
          },
        });
      }

      const questions = await prisma.question.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
      const topics = await scopeTopics(prisma, userId);
      const patterns = await scopePatterns(prisma, userId);
      const patternsWithCount = await patternsWithPhCount(prisma, topics, patterns);

      res.json({
        success: true,
        recognitionCorrect,
        expectedPattern: problem.patternName,
        evaluation: evalResult,
        question: questionRecord,
        questions,
        patterns: patternsWithCount,
      });
    } catch (err) {
      console.error('Submit pattern hunt error:', err);
      res.status(500).json({ error: 'Failed to submit pattern hunt attempt' });
    }
  });

  // POST /api/topics - Add custom topic
  router.post('/topics', async (req, res) => {
    try {
      const userId = req.user.id;
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const last = await prisma.topic.findFirst({
        where: { createdBy: userId },
        orderBy: { order: 'desc' },
      });
      const order = last ? last.order + 1 : 0;
      const topicId = `t-c-${userId.slice(0, 8)}-${Date.now()}`;

      const topic = await prisma.topic.create({
        data: { id: topicId, createdBy: userId, name, isCustom: true, order },
      });
      res.json({ topic });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create topic' });
    }
  });

  // DELETE /api/topics/:id - only owns custom topics
  router.delete('/topics/:id', async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const topic = await prisma.topic.findFirst({ where: { id, createdBy: userId } });
      if (!topic) return res.status(404).json({ error: 'Topic not found or not yours to delete' });

      const patIds = await prisma.pattern.findMany({ where: { topicId: id, createdBy: userId } }).then(p => p.map(x => x.id));
      await prisma.question.deleteMany({ where: { patternId: { in: patIds }, userId } });
      await prisma.revision.deleteMany({ where: { question: { userId, patternId: { in: patIds } } } });
      await prisma.pattern.deleteMany({ where: { topicId: id, createdBy: userId } });
      await prisma.topic.delete({ where: { id } });

      await logAudit(prisma, { actorId: userId, action: 'CONTENT.TOPIC_DELETE', metadata: { topicId: id, name: topic.name } });
      res.json({ success: true });
    } catch (err) {
      console.error('Delete topic error:', err);
      res.status(500).json({ error: 'Failed to delete topic' });
    }
  });

  // POST /api/patterns - Add custom pattern
  router.post('/patterns', async (req, res) => {
    try {
      const userId = req.user.id;
      const { topicId, name } = req.body;
      if (!topicId || !name) return res.status(400).json({ error: 'Topic and Name required' });

      const topic = await prisma.topic.findFirst({
        where: { id: topicId, OR: [{ createdBy: userId }, { createdBy: null }] },
      });
      if (!topic) return res.status(404).json({ error: 'Topic not found' });

      const last = await prisma.pattern.findFirst({
        where: { topicId, createdBy: userId },
        orderBy: { order: 'desc' },
      });
      const order = last ? last.order + 1 : 0;
      const patternId = `p-c-${userId.slice(0, 8)}-${Date.now()}`;

      const pattern = await prisma.pattern.create({
        data: { id: patternId, createdBy: userId, topicId, name, seqCounter: 0, isCustom: true, order },
      });

      res.json({ pattern: { ...pattern, phCount: 0 } });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create pattern' });
    }
  });

  // DELETE /api/patterns/:id - only owns custom patterns
  router.delete('/patterns/:id', async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const pattern = await prisma.pattern.findFirst({ where: { id, createdBy: userId } });
      if (!pattern) return res.status(404).json({ error: 'Pattern not found or not yours to delete' });

      await prisma.question.deleteMany({ where: { patternId: id, userId } });
      await prisma.revision.deleteMany({ where: { question: { userId, patternId: id } } });
      await prisma.pattern.delete({ where: { id } });

      await logAudit(prisma, { actorId: userId, action: 'CONTENT.PATTERN_DELETE', metadata: { patternId: id, name: pattern.name } });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete pattern' });
    }
  });

  // PUT /api/questions/:id - Update Question
  router.put('/questions/:id', async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status, confidence, lastSolvedAt, timeTaken, neededHint, keyConcept, notes, nextRevision } = req.body;

      const q = await prisma.question.findFirst({ where: { id, userId } });
      if (!q) return res.status(404).json({ error: 'Question not found' });

      const question = await prisma.question.update({
        where: { id },
        data: {
          status: status || q.status,
          confidence: confidence !== undefined ? confidence : q.confidence,
          lastSolvedAt: lastSolvedAt !== undefined ? lastSolvedAt : q.lastSolvedAt,
          timeTaken: timeTaken !== undefined ? (timeTaken === '' ? null : Number(timeTaken)) : q.timeTaken,
          neededHint: neededHint !== undefined ? !!neededHint : q.neededHint,
          keyConcept: keyConcept !== undefined ? keyConcept : q.keyConcept,
          notes: notes !== undefined ? notes : q.notes,
          nextRevision: nextRevision !== undefined ? nextRevision : q.nextRevision,
        },
      });

      const topics = await scopeTopics(prisma, userId);
      const patterns = await scopePatterns(prisma, userId);
      const patternsWithCount = await patternsWithPhCount(prisma, topics, patterns);

      res.json({ question, patterns: patternsWithCount });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update question' });
    }
  });

  // DELETE /api/questions/:id
  router.delete('/questions/:id', async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const q = await prisma.question.findFirst({ where: { id, userId } });
      if (!q) return res.status(404).json({ error: 'Question not found' });

      await prisma.revision.deleteMany({ where: { questionId: id, userId } });
      await prisma.question.delete({ where: { id } });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete question' });
    }
  });

  // POST /api/revisions - Submit Revision
  router.post('/revisions', async (req, res) => {
    try {
      const userId = req.user.id;
      const { questionId, actualRevisionDate, confidence, result, previousIntervalDays, nextIntervalDays, nextRevision } = req.body;

      const q = await prisma.question.findFirst({ where: { id: questionId, userId } });
      if (!q) return res.status(404).json({ error: 'Question not found' });

      const revision = await prisma.revision.create({
        data: {
          userId,
          questionId,
          revisionNumber: q.revisionCount + 1,
          scheduledRevisionDate: q.nextRevision || actualRevisionDate,
          actualRevisionDate,
          confidence,
          result: result || 'Solved',
          previousIntervalDays: previousIntervalDays || 0,
          nextIntervalDays: nextIntervalDays || 0,
        },
      });

      const updatedQ = await prisma.question.update({
        where: { id: questionId },
        data: {
          confidence,
          lastRevisedAt: actualRevisionDate,
          nextRevision,
          revisionCount: q.revisionCount + 1,
        },
      });

      res.json({ revision, question: updatedQ });
    } catch (err) {
      console.error('Submit revision error:', err);
      res.status(500).json({ error: 'Failed to submit revision' });
    }
  });

  // PUT /api/settings
  router.put('/settings', async (req, res) => {
    try {
      const userId = req.user.id;
      const { greenIntervals, yellowIntervals, redIntervals, growthFactor, masteryMinQuestions, masteryGreenPct, comfortableGreenPct, weakYellowPct } = req.body;

      const record = await prisma.settings.upsert({
        where: { userId },
        update: {
          greenIntervals: Array.isArray(greenIntervals) ? greenIntervals.join(',') : greenIntervals,
          yellowIntervals: Array.isArray(yellowIntervals) ? yellowIntervals.join(',') : yellowIntervals,
          redIntervals: Array.isArray(redIntervals) ? redIntervals.join(',') : redIntervals,
          growthFactor: Number(growthFactor) || 1.6,
          masteryMinQuestions: Number(masteryMinQuestions) || 3,
          masteryGreenPct: Number(masteryGreenPct) || 0.7,
          comfortableGreenPct: Number(comfortableGreenPct) || 0.5,
          weakYellowPct: Number(weakYellowPct) || 0.4,
        },
        create: {
          userId,
          greenIntervals: Array.isArray(greenIntervals) ? greenIntervals.join(',') : greenIntervals,
          yellowIntervals: Array.isArray(yellowIntervals) ? yellowIntervals.join(',') : yellowIntervals,
          redIntervals: Array.isArray(redIntervals) ? redIntervals.join(',') : redIntervals,
          growthFactor: Number(growthFactor) || 1.6,
          masteryMinQuestions: Number(masteryMinQuestions) || 3,
          masteryGreenPct: Number(masteryGreenPct) || 0.7,
          comfortableGreenPct: Number(comfortableGreenPct) || 0.5,
          weakYellowPct: Number(weakYellowPct) || 0.4,
        },
      });

      const settings = {
        greenIntervals: record.greenIntervals.split(',').map(n => parseInt(n.trim(), 10)),
        yellowIntervals: record.yellowIntervals.split(',').map(n => parseInt(n.trim(), 10)),
        redIntervals: record.redIntervals.split(',').map(n => parseInt(n.trim(), 10)),
        growthFactor: record.growthFactor,
        masteryMinQuestions: record.masteryMinQuestions,
        masteryGreenPct: record.masteryGreenPct,
        comfortableGreenPct: record.comfortableGreenPct,
        weakYellowPct: record.weakYellowPct,
      };

      res.json({ settings });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // ---------- ADMIN endpoints (RBAC: requireRole('ADMIN')) ----------

  // GET /api/admin/users?q= - list users with counts. q filters by email fragment.
  router.get('/admin/users', requireRole('ADMIN'), async (req, res) => {
    try {
      const adminId = req.user.id;
      const q = (req.query.q || '').trim();
      const users = await prisma.user.findMany({
        where: q ? { email: { contains: q, mode: 'insensitive' } } : undefined,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true, createdAt: true, lastLoginAt: true },
      });

      const allQuestions = await prisma.question.findMany({
        where: { userId: { in: users.map(u => u.id) } },
        select: { userId: true, status: true },
      });

      const userList = users.map(u => {
        const userQs = allQuestions.filter(q => q.userId === u.id);
        const solved = userQs.filter(q => q.status === 'Solved').length;
        return {
          id: u.id,
          email: u.email,
          name: u.name || '',
          role: u.role,
          isActive: u.isActive,
          isVerified: u.emailVerified,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
          totalQuestionsLogged: userQs.length,
          questionsSolved: solved,
        };
      });

      await logAudit(prisma, { actorId: adminId, action: 'ADMIN.USER_LIST', metadata: { query: q, count: userList.length } });
      res.json({ users: userList });
    } catch (err) {
      console.error('Admin get users error:', err);
      res.status(500).json({ error: 'Failed to fetch user list' });
    }
  });

  // PATCH /api/admin/users/:userId - update role and/or active status
  router.patch('/admin/users/:userId', requireRole('ADMIN'), async (req, res) => {
    try {
      const adminId = req.user.id;
      const targetUserId = req.params.userId;
      const { role, isActive } = req.body;

      if (targetUserId === adminId) {
        return res.status(400).json({ error: 'You cannot modify your own account' });
      }

      const target = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!target) return res.status(404).json({ error: 'User not found' });

      const data = {};
      if (role !== undefined) {
        if (!['USER', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
        data.role = role;
        await logAudit(prisma, { actorId: adminId, action: 'ADMIN.ROLE_CHANGE', targetUserId, metadata: { email: target.email, role } });
      }
      if (isActive !== undefined) {
        data.isActive = !!isActive;
        await logAudit(prisma, { actorId: adminId, action: isActive ? 'ADMIN.USER_ENABLE' : 'ADMIN.USER_DISABLE', targetUserId, metadata: { email: target.email } });
      }

      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data,
        select: { id: true, email: true, role: true, isActive: true },
      });

      res.json({ user: updated });
    } catch (err) {
      console.error('Admin update user error:', err);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // DELETE /api/admin/users/:userId - admin delete user and all their data
  router.delete('/admin/users/:userId', requireRole('ADMIN'), async (req, res) => {
    try {
      const adminId = req.user.id;
      const targetUserId = req.params.userId;

      if (targetUserId === adminId) {
        return res.status(400).json({ error: 'You cannot delete your own account here' });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) return res.status(404).json({ error: 'User not found' });

      await prisma.revision.deleteMany({ where: { userId: targetUserId } });
      await prisma.attempt.deleteMany({ where: { userId: targetUserId } });
      await prisma.question.deleteMany({ where: { userId: targetUserId } });
      await prisma.settings.deleteMany({ where: { userId: targetUserId } });
      await prisma.topic.deleteMany({ where: { createdBy: targetUserId } });
      await prisma.pattern.deleteMany({ where: { createdBy: targetUserId } });
      await prisma.user.delete({ where: { id: targetUserId } });

      await logAudit(prisma, { actorId: adminId, action: 'ADMIN.USER_DELETE', targetUserId, metadata: { email: targetUser.email } });
      res.json({ success: true, message: `User ${targetUser.email} and all associated data deleted successfully` });
    } catch (err) {
      console.error('Admin delete user error:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  return router;
}