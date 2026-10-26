import { describe, it, expect } from 'vitest';
import { evaluateSemanticAnswer } from '../server/semanticEvaluator.js';

describe('semanticEvaluator.js unit tests', () => {
  describe('1. Input validation & null/empty/whitespace handling', () => {
    it('handles null input gracefully', () => {
      const res = evaluateSemanticAnswer(null, 'Two Sum');
      expect(res.validApproach).toBe(false);
      expect(res.confidence).toBe(0);
      expect(res.feedbackExplanation).toContain('No answer provided');
    });

    it('handles undefined input gracefully', () => {
      const res = evaluateSemanticAnswer(undefined, 'Two Sum');
      expect(res.validApproach).toBe(false);
      expect(res.confidence).toBe(0);
      expect(res.feedbackExplanation).toContain('No answer provided');
    });

    it('handles non-string input type gracefully', () => {
      const res = evaluateSemanticAnswer(12345, 'Two Sum');
      expect(res.validApproach).toBe(false);
      expect(res.confidence).toBe(0);
    });

    it('handles empty string gracefully', () => {
      const res = evaluateSemanticAnswer('', 'Two Sum');
      expect(res.validApproach).toBe(false);
      expect(res.confidence).toBe(0);
      expect(res.feedbackExplanation).toContain('No answer provided');
    });

    it('handles whitespace-only input gracefully', () => {
      const res = evaluateSemanticAnswer('     \n\t   ', 'Two Sum');
      expect(res.recognizedDataStructure).toBeNull();
      expect(res.techniques).toEqual([]);
      expect(res.feedbackExplanation).toBeDefined();
    });
  });

  describe('2. Exact alias matches across knowledge base', () => {
    it('evaluates exact alias match for "prefix sum"', () => {
      const res = evaluateSemanticAnswer('prefix sum', 'Prefix Sum');
      expect(res.validApproach).toBe(true);
      expect(res.confidence).toBeGreaterThanOrEqual(0.95);
      expect(res.feedbackExplanation).toContain('Correct!');
    });

    it('evaluates alias "two pointer" for Two Sum', () => {
      const res = evaluateSemanticAnswer('two pointer', 'Two Sum');
      expect(res.validApproach).toBe(true);
      expect(res.isAlternativeApproach).toBe(false);
    });

    it('evaluates alias "2 pointer" for Two Sum', () => {
      const res = evaluateSemanticAnswer('2 pointer', 'Two Sum');
      expect(res.validApproach).toBe(true);
    });

    it('evaluates alias "sliding window" for Sliding Window pattern', () => {
      const res = evaluateSemanticAnswer('sliding window', 'Sliding Window');
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toBe('Sliding Window');
    });

    it('evaluates alias "monotonic stack" for Monotonic Stack pattern', () => {
      const res = evaluateSemanticAnswer('monotonic stack', 'Monotonic Stack');
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toBe('Monotonic Stack');
    });

    it('evaluates alias "tortoise and hare" for Fast & Slow Pointer', () => {
      const res = evaluateSemanticAnswer('tortoise and hare', 'Fast & Slow Pointer');
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toContain('Fast & Slow Pointers');
    });

    it('evaluates alias "binary search" for Binary Search pattern', () => {
      const res = evaluateSemanticAnswer('binary search', 'Binary Search');
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toBe('Binary Search');
    });
  });

  describe('3. Descriptive phrase matchers', () => {
    it('identifies Two Pointer via phrase "left and right pointers"', () => {
      const res = evaluateSemanticAnswer('left and right pointers', 'Two Pointer');
      expect(res.validApproach).toBe(true);
      expect(res.confidence).toBeGreaterThanOrEqual(0.98);
    });

    it('identifies Two Pointer via descriptive sentence', () => {
      const res = evaluateSemanticAnswer(
        'Keep one pointer at beginning and another at end and move them based on sum',
        'Two Pointer'
      );
      expect(res.validApproach).toBe(true);
      expect(res.confidence).toBeGreaterThanOrEqual(0.98);
    });

    it('identifies Sliding Window via window manipulation sentence', () => {
      const res = evaluateSemanticAnswer(
        'I will keep expanding window and remove elements from left when condition breaks',
        'Sliding Window'
      );
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toBe('Sliding Window');
    });

    it('identifies Prefix Sum with HashMap via description', () => {
      const res = evaluateSemanticAnswer('Store previous prefix sums in a map', 'Prefix Sum');
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toBe('Prefix Sum');
    });

    it('identifies Binary Search via space-halving description', () => {
      const res = evaluateSemanticAnswer('Keep dividing search range in half', 'Binary Search');
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toBe('Binary Search');
    });

    it('identifies Monotonic Stack via element popping description', () => {
      const res = evaluateSemanticAnswer(
        'Use a stack and remove elements while current value is greater',
        'Monotonic Stack'
      );
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toBe('Monotonic Stack');
    });

    it('identifies Dynamic Programming via memoization phrase', () => {
      const res = evaluateSemanticAnswer('store results of subproblems to avoid recomputation', 'Dynamic Programming');
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toContain('Dynamic Programming');
    });
  });

  describe('4. Negative matchers & false-positive prevention', () => {
    it('does not classify "single pointer" as Two Pointer pattern', () => {
      const res = evaluateSemanticAnswer('single pointer', 'Sliding Window');
      expect(res.recognizedPattern).not.toBe('Two Pointers');
      expect(res.validApproach).toBe(false);
    });

    it('does not classify "use a pointer to iterate" as Two Pointer pattern', () => {
      const res = evaluateSemanticAnswer('use a pointer to iterate', 'Sliding Window');
      expect(res.recognizedPattern).not.toBe('Two Pointers');
      expect(res.validApproach).toBe(false);
    });
  });

  describe('5. Valid alternative approaches', () => {
    it('accepts HashMap / Hashing as valid alternative for Four Sum', () => {
      const res = evaluateSemanticAnswer(
        'I can store pairs and use a hash map to find complementary pairs',
        'Four Sum'
      );
      expect(res.validApproach).toBe(true);
      expect(res.isAlternativeApproach).toBe(true);
      expect(res.feedbackExplanation).toContain('Valid Alternative Approach');
    });

    it('accepts Sorting + Two Pointers for Four Sum', () => {
      const res = evaluateSemanticAnswer('sort the array and use two pointers', 'Four Sum');
      expect(res.validApproach).toBe(true);
    });

    it('accepts Priority Queue for Top K Elements / Kth Largest', () => {
      const res = evaluateSemanticAnswer('use a min heap of size k', 'Top K Elements');
      expect(res.validApproach).toBe(true);
      expect(res.recognizedPattern).toContain('Top K Elements');
    });

    it('accepts Fast & Slow Pointer for Linked List Cycle', () => {
      const res = evaluateSemanticAnswer('tortoise and hare', 'Linked List Cycle');
      expect(res.validApproach).toBe(true);
      expect(res.isAlternativeApproach).toBe(true);
    });
  });

  describe('6. Case-insensitivity and formatting variations', () => {
    it('handles UPPERCASE input correctly', () => {
      const res = evaluateSemanticAnswer('BINARY SEARCH', 'Binary Search');
      expect(res.validApproach).toBe(true);
    });

    it('handles MixedCase input with leading/trailing spaces', () => {
      const res = evaluateSemanticAnswer('   TwO PoInTeR   ', 'Two Pointer');
      expect(res.validApproach).toBe(true);
    });
  });

  describe('7. Data structure detection & partial/incorrect understanding', () => {
    it('provides partial feedback when only a data structure is mentioned without a technique', () => {
      const res = evaluateSemanticAnswer('Use an array', 'Two Pointer');
      expect(res.validApproach).toBe(false);
      expect(res.feedbackExplanation).toContain('Partial Understanding');
    });

    it('identifies incorrect approach when user proposes BFS for 4Sum', () => {
      const res = evaluateSemanticAnswer('Use BFS because we need to explore all possibilities', 'Four Sum');
      expect(res.validApproach).toBe(false);
      expect(res.feedbackExplanation).toContain('is not appropriate for this problem');
    });
  });
});
