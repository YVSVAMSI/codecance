import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { logAudit } from '../audit.js';
import { sendOtpEmail } from '../email.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please try again later.' },
});

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['USER', 'ADMIN'];

function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
  };
}

function generateToken(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function setAuthCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, { path: '/' });
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function hashOtp(userId, code) {
  return crypto.createHash('sha256').update(`${userId}:${code}`).digest('hex');
}

export function createAuthRouter(prisma) {
  // Middleware to authenticate JWT from HttpOnly cookie (primary) or Bearer header (dev/curl).
  const authenticate = async (req, res, next) => {
    const fromCookie = req.cookies && req.cookies[config.cookieName];
    const fromHeader = req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;
    const token = fromCookie || fromHeader;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true, passwordHash: true },
      });
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists' });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is disabled' });
      }
      if (!user.emailVerified) {
        return res.status(403).json({ error: 'Please verify your email to continue', needsVerification: true, email: user.email });
      }
      req.user = user;
      req.user.id = user.id;
      req.user.role = user.role;
      req.user.email = user.email;
      req.user.name = user.name;
      req.user.isActive = user.isActive;
      req.user.emailVerified = user.emailVerified;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
    }
    next();
  };

  // Issue a fresh OTP for a user (signup + resend share this logic).
  async function issueOtp(user) {
    const code = generateOtpCode();
    const expires = new Date(Date.now() + config.otp.ttlMs);
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: hashOtp(user.id, code), otpExpiresAt: expires, otpAttempts: 0, otpSentAt: new Date() },
    });
    await sendOtpEmail({ email: user.email, code });
    return Math.ceil(config.otp.resendCooldownMs / 1000);
  }

  // POST /api/auth/signup - create a PENDING account and email an OTP
  router.post('/signup', authLimiter, async (req, res) => {
    try {
      const { email, password, name } = req.body || {};
      if (typeof email !== 'string' || !VALID_EMAIL.test(email.trim())) {
        return res.status(400).json({ error: 'A valid email is required' });
      }
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      if (typeof name !== 'string' || !name.trim() || name.trim().length < 2) {
        return res.status(400).json({ error: 'Full name is required' });
      }

      const normalized = email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalized } });
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      let user;
      try {
        user = await prisma.user.create({
          data: { email: normalized, name: name.trim(), passwordHash, role: 'USER', emailVerified: false },
          select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true },
        });
        const resendIn = await issueOtp(user);
        await logAudit(prisma, { actorId: user.id, action: 'AUTH.SIGNUP', ip: req.ip });
        res.status(201).json({ user: safeUser({ ...user, emailVerified: false }), otpSent: true, resendIn });
      } catch (err) {
        // If the email failed to send, roll the account back so the user isn't stuck.
        if (user && user.id) {
          await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
        }
        throw err;
      }
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Failed to create user account — the verification email could not be sent. Please try again.' });
    }
  });

  // POST /api/auth/verify - confirm the account with the emailed OTP
  router.post('/verify', verifyLimiter, async (req, res) => {
    try {
      const { email, otp } = req.body || {};
      if (typeof email !== 'string' || !VALID_EMAIL.test(email.trim())) {
        return res.status(400).json({ error: 'A valid email is required' });
      }
      if (typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
        return res.status(400).json({ error: 'Enter the 6-digit code from your email' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true, otpHash: true, otpExpiresAt: true, otpAttempts: true },
      });
      if (!user) {
        return res.status(401).json({ error: 'No account found for this email' });
      }
      if (user.emailVerified) {
        return res.status(400).json({ error: 'This email is already verified — just log in' });
      }
      if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
        return res.status(400).json({ error: 'This code has expired. Request a new one.', needsResend: true });
      }

      const submitted = otp.trim();
      const matches = crypto.timingSafeEqual(
        Buffer.from(hashOtp(user.id, submitted), 'hex'),
        Buffer.from(user.otpHash, 'hex')
      );

      if (!matches) {
        const remaining = config.otp.maxAttempts - (user.otpAttempts + 1);
        if (remaining <= 0) {
          await prisma.user.update({ where: { id: user.id }, data: { otpHash: null, otpExpiresAt: null } });
          return res.status(400).json({ error: 'Too many incorrect attempts. Request a new code.', needsResend: true });
        }
        await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
        await logAudit(prisma, { actorId: user.id, action: 'AUTH.VERIFY_FAIL', ip: req.ip });
        return res.status(400).json({ error: `Incorrect code. ${remaining} attempt(s) remaining.` });
      }

      const verified = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, otpHash: null, otpExpiresAt: null, otpAttempts: 0, otpSentAt: null, lastLoginAt: new Date() },
        select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true },
      });

      setAuthCookie(res, generateToken(verified));
      await logAudit(prisma, { actorId: user.id, action: 'AUTH.VERIFY', ip: req.ip });
      res.json({ user: safeUser(verified) });
    } catch (err) {
      console.error('Verify error:', err);
      res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
  });

  // POST /api/auth/resend-otp - send a new OTP for a pending account
  router.post('/resend-otp', authLimiter, async (req, res) => {
    try {
      const { email } = req.body || {};
      if (typeof email !== 'string' || !VALID_EMAIL.test(email.trim())) {
        return res.status(400).json({ error: 'A valid email is required' });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { id: true, email: true, emailVerified: true, otpSentAt: true },
      });
      if (!user) {
        // Don't reveal which emails have accounts.
        return res.status(200).json({ ok: true, resendIn: Math.ceil(config.otp.resendCooldownMs / 1000) });
      }
      if (user.emailVerified) {
        return res.status(400).json({ error: 'This email is already verified — just log in' });
      }

      const lastSent = user.otpSentAt ? user.otpSentAt.getTime() : 0;
      const cooldownLeft = Math.ceil((config.otp.resendCooldownMs - (Date.now() - lastSent)) / 1000);
      if (cooldownLeft > 0) {
        return res.status(429).json({ error: `Please wait ${cooldownLeft}s before requesting another code.`, resendIn: cooldownLeft });
      }

      const resendIn = await issueOtp(user);
      await logAudit(prisma, { actorId: user.id, action: 'AUTH.OTP_RESEND', ip: req.ip });
      res.json({ ok: true, resendIn });
    } catch (err) {
      console.error('Resend OTP error:', err);
      res.status(500).json({ error: 'Failed to send a new code. Please try again.' });
    }
  });

  // POST /api/auth/login
  router.post('/login', authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is disabled. Contact support.' });
      }
      if (!user.emailVerified) {
        return res.status(403).json({ error: 'Please verify your email to continue', needsVerification: true, email: user.email });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      setAuthCookie(res, generateToken(user));
      await logAudit(prisma, { actorId: user.id, action: 'AUTH.LOGIN', ip: req.ip });
      res.json({ user: safeUser(user) });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // POST /api/auth/logout - clear the HttpOnly cookie
  router.post('/logout', (req, res) => {
    clearAuthCookie(res);
    res.json({ success: true });
  });

  // GET /api/auth/me
  router.get('/me', authenticate, (req, res) => {
    res.json({ user: safeUser(req.user) });
  });

  // DELETE /api/auth/delete-account - delete the user and ALL of their user-specific data.
  // Global A2Z topics, patterns, and Pattern Hunt problems are NEVER touched.
  router.delete('/delete-account', authenticate, async (req, res) => {
    try {
      const userId = req.user.id;

      await prisma.revision.deleteMany({ where: { userId } });
      await prisma.attempt.deleteMany({ where: { userId } });
      await prisma.question.deleteMany({ where: { userId } });
      await prisma.settings.deleteMany({ where: { userId } });
      await prisma.topic.deleteMany({ where: { createdBy: userId } });
      await prisma.pattern.deleteMany({ where: { createdBy: userId } });
      await prisma.user.delete({ where: { id: userId } });

      clearAuthCookie(res);
      res.json({ success: true, message: 'User account and all data deleted successfully' });
    } catch (err) {
      console.error('Delete account error:', err);
      res.status(500).json({ error: 'Failed to delete user account' });
    }
  });

  return { router, authenticate, requireRole, VALID_ROLES };
}