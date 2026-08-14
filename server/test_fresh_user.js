const BASE_URL = 'http://127.0.0.1:5001/api';

async function verifyFreshUserAndStatsConsistency() {
  console.log('--- STARTING FRESH USER & CONSISTENCY VERIFICATION TEST ---');

  // 1. Signup fresh user
  const email = `fresh_${Date.now()}@example.com`;
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' })
  });
  const signupData = await signupRes.json();
  if (!signupRes.ok) throw new Error('Fresh user signup failed');
  const token = signupData.token;
  console.log('✓ Step 1 Passed: Fresh user signed up successfully');

  // 2. Fetch /api/data for fresh user
  const dataRes = await fetch(`${BASE_URL}/data`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await dataRes.json();
  if (!dataRes.ok) throw new Error('Fetch /api/data failed');

  console.log('✓ Step 2 Passed: Fetched /api/data for fresh user');

  // 3. Verify Fresh User Stats Assertions
  const { topics, patterns, questions, revisions } = data;

  const totalPatterns = patterns.length;
  const totalQuestionsInDataset = patterns.reduce((sum, p) => sum + (p.phCount || 0), 0);
  const userSolvedQuestions = questions.filter(q => q.status === 'Solved').length;
  const userCoveredPatterns = patterns.filter(p => {
    const pQs = questions.filter(q => q.patternId === p.id && q.status === 'Solved');
    return pQs.length > 0;
  }).length;

  console.log(`\n=== FRESH USER VERIFICATION STATS ===`);
  console.log(`Total Topics: ${topics.length}`);
  console.log(`Total Patterns: ${totalPatterns}`);
  console.log(`Total Unique Dataset Questions: ${totalQuestionsInDataset}`);
  console.log(`Fresh User Solved Questions: ${userSolvedQuestions}`);
  console.log(`Fresh User Covered Patterns: ${userCoveredPatterns}`);
  console.log(`Fresh User Questions Logged: ${questions.length}`);
  console.log(`Fresh User Revisions Logged: ${revisions.length}`);

  // Assertions
  if (userSolvedQuestions !== 0) throw new Error(`FAILED: Expected 0 solved questions, got ${userSolvedQuestions}`);
  if (userCoveredPatterns !== 0) throw new Error(`FAILED: Expected 0 covered patterns, got ${userCoveredPatterns}`);
  if (questions.length !== 0) throw new Error(`FAILED: Expected 0 questions, got ${questions.length}`);
  if (revisions.length !== 0) throw new Error(`FAILED: Expected 0 revisions, got ${revisions.length}`);
  if (totalQuestionsInDataset !== 500) throw new Error(`FAILED: Expected 500 total unique questions, got ${totalQuestionsInDataset}`);

  console.log('\n✓ STEP 3 PASSED: All Fresh User Assertions Verified (0 Solved, 0% Progress, 0 Covered Patterns, 500 Total Dataset Questions)');

  // 4. Test Solving 1 Question and verify consistency across views
  const phRes = await fetch(`${BASE_URL}/pattern-hunt`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const phData = await phRes.json();
  const targetProblem = phData.problems[0]; // Two Sum (sorted array)

  const subRes = await fetch(`${BASE_URL}/pattern-hunt/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      problemId: targetProblem.id,
      status: 'Solved',
      confidence: 'Green',
      lastSolvedAt: '2026-08-14',
      keyConcept: 'Two Sum'
    })
  });
  const subData = await subRes.json();
  if (!subRes.ok) throw new Error('Pattern hunt submit failed');

  // Re-fetch data
  const dataRes2 = await fetch(`${BASE_URL}/data`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data2 = await dataRes2.json();

  const solvedCountAfter = data2.questions.filter(q => q.status === 'Solved').length;
  const coveredCountAfter = data2.patterns.filter(p => {
    return data2.questions.some(q => q.patternId === p.id && q.status === 'Solved');
  }).length;

  console.log(`\n=== AFTER SOLVING 1 PROBLEM ===`);
  console.log(`Solved Questions: ${solvedCountAfter} (expected 1)`);
  console.log(`Covered Patterns: ${coveredCountAfter} (expected 1)`);

  if (solvedCountAfter !== 1) throw new Error(`FAILED: Expected 1 solved question, got ${solvedCountAfter}`);
  if (coveredCountAfter !== 1) throw new Error(`FAILED: Expected 1 covered pattern, got ${coveredCountAfter}`);

  console.log('\n🎉 ALL FRESH USER & CONSISTENCY VERIFICATION TESTS PASSED PERFECTLY!');
}

verifyFreshUserAndStatsConsistency().catch(console.error);
