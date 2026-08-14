import { evaluateSemanticAnswer } from './semanticEvaluator.js';

const testCases = [
  { answer: "sort the array and use two pointers", expected: "Four Sum", name: "4Sum with sorting + two pointers" },
  { answer: "two pointer", expected: "Two Sum", name: "Two pointer shorthand" },
  { answer: "2 pointer", expected: "Two Sum", name: "2 pointer number notation" },
  { answer: "left and right pointers", expected: "Two Pointer", name: "Left and right pointers phrase" },
  { answer: "start and end pointers", expected: "Two Pointer", name: "Start and end pointers phrase" },
  { answer: "Keep one pointer at beginning and another at end and move them based on sum", expected: "Two Pointer", name: "Detailed Two Pointer description" },
  { answer: "I'll keep expanding window and remove elements from left when condition breaks", expected: "Sliding Window", name: "Detailed Sliding Window description" },
  { answer: "Store previous prefix sums in a map", expected: "Prefix Sum", name: "Prefix Sum + HashMap phrase" },
  { answer: "Keep dividing search range in half", expected: "Binary Search", name: "Binary Search description" },
  { answer: "Use a stack and remove elements while current value is greater", expected: "Monotonic Stack", name: "Monotonic Stack description" },
  { answer: "I can store pairs and use a hash map to find complementary pairs", expected: "Four Sum", name: "4Sum Alternative HashMap Approach" },
  { answer: "Use an array", expected: "Two Pointer", name: "Partial answer (array only)" },
  { answer: "Use BFS because we need to explore all possibilities", expected: "Four Sum", name: "Incorrect BFS approach for 4Sum" }
];

console.log("=== RUNNING SEMANTIC EVALUATOR TESTS ===");

testCases.forEach((tc, idx) => {
  const result = evaluateSemanticAnswer(tc.answer, tc.expected);
  console.log(`\nTest [${idx + 1}] ${tc.name}:`);
  console.log(`  User Answer: "${tc.answer}"`);
  console.log(`  Expected Pattern: "${tc.expected}"`);
  console.log(`  Recognized Pattern: ${result.recognizedPattern}`);
  console.log(`  Techniques: ${JSON.stringify(result.techniques)}`);
  console.log(`  Valid Approach: ${result.validApproach ? '✅ YES' : '❌ NO'} (Alt: ${result.isAlternativeApproach})`);
  console.log(`  Confidence: ${result.confidence}`);
  console.log(`  Feedback: ${result.feedbackExplanation}`);
});
