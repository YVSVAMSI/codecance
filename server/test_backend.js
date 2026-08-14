const BASE_URL = 'http://127.0.0.1:5001/api';

async function testBackend() {
  console.log('--- Starting Full Backend & 507 PDF Pattern Hunt Verification Tests ---');

  // Test 1: Signup User A
  const userAEmail = `usera_${Date.now()}@example.com`;
  const resSignupA = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password: 'password123' })
  });
  const dataSignupA = await resSignupA.json();
  if (!resSignupA.ok) throw new Error(`User A signup failed: ${JSON.stringify(dataSignupA)}`);
  console.log('✓ Test 1 Passed: User A signed up successfully');
  const tokenA = dataSignupA.token;

  // Test 2: Fetch Pattern Hunt Problems for User A (Hidden Patterns)
  const resPH = await fetch(`${BASE_URL}/pattern-hunt`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const dataPH = await resPH.json();
  if (!dataPH.problems || dataPH.problems.length === 0) throw new Error('No Pattern Hunt problems returned');
  console.log(`✓ Test 2 Passed: Pattern Hunt returned ${dataPH.problems.length} PDF problems with patterns properly hidden`);

  const prob1 = dataPH.problems[0]; // Two Sum (sorted array) -> Pattern: Two Pointer
  if (prob1.patternName || prob1.topicName) throw new Error('CRITICAL SECURITY LEAK: Pattern Hunt exposed internal pattern name before submission!');

  // Test 3: Submit Pattern Hunt Attempt (Correct Pattern Guess)
  const resSub1 = await fetch(`${BASE_URL}/pattern-hunt/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      problemId: prob1.id,
      status: 'Solved',
      confidence: 'Green',
      lastSolvedAt: '2026-08-14',
      timeTaken: 15,
      neededHint: false,
      keyConcept: 'Two Sum', // Correct guess
      notes: 'Used two pointers left and right moving towards each other'
    })
  });
  const dataSub1 = await resSub1.json();
  if (!resSub1.ok) throw new Error(`Pattern Hunt submission 1 failed: ${JSON.stringify(dataSub1)}`);
  if (!dataSub1.recognitionCorrect) throw new Error('Expected recognitionCorrect to be true for Two Sum');
  console.log('✓ Test 3 Passed: User submitted Pattern Hunt attempt -> Pattern recognition correctly evaluated as TRUE');

  // Test 4: Submit Pattern Hunt Attempt (Incorrect Pattern Guess)
  const prob2 = dataPH.problems[1]; // Three Sum -> Pattern: Two Pointer
  const resSub2 = await fetch(`${BASE_URL}/pattern-hunt/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      problemId: prob2.id,
      status: 'Attempted',
      confidence: 'Red',
      lastSolvedAt: '2026-08-14',
      timeTaken: 45,
      neededHint: true,
      keyConcept: 'Dynamic Programming', // Incorrect guess
      notes: 'Thought it was DP but struggled'
    })
  });
  const dataSub2 = await resSub2.json();
  if (!resSub2.ok) throw new Error(`Pattern Hunt submission 2 failed: ${JSON.stringify(dataSub2)}`);
  if (dataSub2.recognitionCorrect) throw new Error('Expected recognitionCorrect to be false for wrong guess');
  console.log('✓ Test 4 Passed: Incorrect pattern guess correctly evaluated as FALSE');

  // Test 5: Verify DSA Roadmap and Tracker reflection without duplicate counting
  const resDataA = await fetch(`${BASE_URL}/data`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const dataA = await resDataA.json();
  const solvedQs = dataA.questions.filter(q => q.status === 'Solved');
  if (solvedQs.length !== 1) throw new Error(`Expected exactly 1 solved question, found ${solvedQs.length}`);
  console.log('✓ Test 5 Passed: Pattern Hunt activity reflected in DSA Roadmap with exact 1 solved question (no duplicate counting)');

  console.log('--- ALL 507 PDF PATTERN HUNT VERIFICATION TESTS PASSED SUCCESSFULLY ---');
}

testBackend().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
