/**
 * Semantic Concept & Pattern Evaluator for DSA Pattern Hunt
 * Evaluates the meaning, intent, data structures, techniques, and validity of user answers.
 */

const DATA_STRUCTURE_PATTERNS = [
  { name: 'Array', regex: /\b(array|vector|list|slice|sequence)\b/i },
  { name: 'HashMap', regex: /\b(hashmap|hash\s*map|dictionary|dict|unordered_map|map|frequency\s*map)\b/i },
  { name: 'HashSet', regex: /\b(hashset|hash\s*set|set|unordered_set)\b/i },
  { name: 'Stack', regex: /\b(stack)\b/i },
  { name: 'Queue', regex: /\b(queue|deque|double\s*ended\s*queue)\b/i },
  { name: 'Heap / Priority Queue', regex: /\b(heap|priority\s*queue|pq|min\s*heap|max\s*heap)\b/i },
  { name: 'Linked List', regex: /\b(linked\s*list|singly\s*linked|doubly\s*linked|head|tail|node)\b/i },
  { name: 'Binary Tree', regex: /\b(binary\s*tree|tree|bst|root|leaf|nodes?)\b/i },
  { name: 'Graph', regex: /\b(graph|adjacency\s*list|matrix|vertices|edges)\b/i },
  { name: 'Trie', regex: /\b(trie|prefix\s*tree)\b/i },
  { name: 'Segment Tree', regex: /\b(segment\s*tree|fenwick|bit\s*tree)\b/i },
  { name: 'Disjoint Set (DSU)', regex: /\b(disjoint\s*set|dsu|union\s*find)\b/i }
];

const TECHNIQUE_PATTERNS = [
  { name: 'Sorting', regex: /\b(sort|sorting|sorted)\b/i },
  { name: 'Hashing', regex: /\b(hash|hashing|hashmap|hashset|dict|dictionary)\b/i },
  { name: 'Two Pointers', regex: /\b(two\s*pointers?|2\s*pointers?|left\s*(?:and|&)\s*right|start\s*(?:and|&)\s*end|two\s*indices)\b/i },
  { name: 'Binary Search', regex: /\b(binary\s*search|logarithmic|halv(?:e|ing))\b/i },
  { name: 'Recursion', regex: /\b(recursion|recursive|recursively)\b/i },
  { name: 'Memoization', regex: /\b(memoiz(?:e|ation)|dp\s*cache|store\s*subproblems?)\b/i },
  { name: 'Bit Manipulation', regex: /\b(bitwise|bit\s*manipulation|xor|bitmask)\b/i }
];

const PATTERN_KNOWLEDGE_BASE = {
  "Prefix Sum": {
    canonicalName: "Prefix Sum",
    aliases: ["prefix sum", "prefix sums", "cumulative sum", "running sum", "prefix array"],
    phraseMatchers: [
      /store\s+(?:the\s+)?previous\s+prefix\s+sum/i,
      /cumulative\s+sum\s+array/i,
      /sum\s+from\s+0\s+to\s+i/i,
      /prefix\s*\+?\s*hash\s*map/i,
      /prefix\s*sum\s*(?:with|\+)\s*(?:hash|map|dictionary)/i
    ]
  },

  "Two Pointer": {
    canonicalName: "Two Pointers",
    aliases: ["two pointer", "two pointers", "2 pointer", "2 pointers", "left right pointer", "left and right pointer", "left/right pointer", "two indices", "start and end pointer", "opposite direction pointers", "two pointer approach"],
    phraseMatchers: [
      /(?:left|start|first)\s+(?:and|&|\+)\s+(?:right|end|second)\s+pointer/i,
      /one\s+pointer\s+at\s+(?:left|start|beginning)\s+and\s+another\s+at\s+(?:right|end)/i,
      /pointer(?:s)?\s+(?:from|at)\s+both\s+ends/i,
      /move\s+(?:left|right|pointers?)\s+toward(?:s)?\s+each\s+other/i,
      /keep\s+one\s+(?:index|pointer)\s+at\s+start\s+and\s+one\s+at\s+end/i,
      /sort\s+(?:and|\+|\s+and\s+use\s+)?two\s+pointer/i,
      /maintain\s+(?:left|start)\s+and\s+(?:right|end)/i,
      /use\s+two\s+indices/i
    ],
    negativeMatchers: [
      /^use a pointer to iterate$/i,
      /^single pointer$/i
    ]
  },

  "Two Sum": {
    canonicalName: "Two Sum / Two Pointers",
    aliases: ["two sum", "2 sum", "pair sum", "two pointer sum"],
    phraseMatchers: [
      /sort\s+and\s+find\s+pair/i,
      /left\s+and\s+right\s+pointer\s+sum/i,
      /target\s+minus\s+current/i
    ]
  },

  "Three Sum": {
    canonicalName: "Three Sum / Two Pointers",
    aliases: ["three sum", "3 sum", "triplet sum"],
    phraseMatchers: [
      /loop\s+and\s+two\s+pointer/i,
      /fix\s+one\s+element\s+and\s+two\s+pointer/i
    ]
  },

  "Four Sum": {
    canonicalName: "Four Sum / Two Pointers",
    aliases: ["four sum", "4 sum", "quadruplet sum"],
    phraseMatchers: [
      /nested\s+loop\s+and\s+two\s+pointer/i,
      /sort\s+(?:the\s+)?array\s+and\s+use\s+two\s+pointers/i
    ]
  },

  "Sliding Window": {
    canonicalName: "Sliding Window",
    aliases: ["sliding window", "sliding windows", "moving window", "variable window", "fixed window", "dynamic window", "window approach"],
    phraseMatchers: [
      /expand\s+(?:and|&)\s+shrink\s+window/i,
      /maintain\s+a\s+(?:sliding\s+)?window/i,
      /window\s+of\s+size\s+k/i,
      /left\s+and\s+right\s+bound(?:ary)?\s+of\s+window/i,
      /remove\s+element(?:s)?\s+from\s+left\s+when/i,
      /shrink\s+window\s+from\s+left/i,
      /expand\s+window/i
    ]
  },

  "Binary Search": {
    canonicalName: "Binary Search",
    aliases: ["binary search", "binarysearch", "bs", "binary searching", "logarithmic search", "half search space", "binary search on answer"],
    phraseMatchers: [
      /divide\s+(?:the\s+)?search\s+(?:space|range)\s+in\s+half/i,
      /repeatedly\s+halv(?:e|ing)\s+the\s+range/i,
      /(?:left|low)\s*\+\s*\(\s*(?:right|high)\s*-\s*(?:left|low)\s*\)\s*\/\s*2/i,
      /mid\s*=\s*\(?left\s*\+\s*right\)?\s*\/\s*2/i,
      /search\s+using\s+mid/i,
      /check\s+middle\s+element/i
    ]
  },

  "Hashing": {
    canonicalName: "Hashing / HashMap",
    aliases: ["hashing", "hashmap", "hash map", "hash set", "hashset", "dictionary", "dict", "map", "frequency map", "hash table", "hashtable"],
    phraseMatchers: [
      /store\s+frequenc(?:y|ies)\s+in\s+(?:a\s+)?map/i,
      /lookup\s+in\s+o\(1\)/i,
      /hash\s+map\s+to\s+store/i,
      /check\s+if\s+seen\s+in\s+(?:set|map)/i
    ]
  },

  "Monotonic Stack": {
    canonicalName: "Monotonic Stack",
    aliases: ["monotonic stack", "mono stack", "monotonically increasing stack", "monotonically decreasing stack", "stack for next greater"],
    phraseMatchers: [
      /stack\s+and\s+remove\s+element(?:s)?\s+while\s+(?:current|val)/i,
      /pop\s+smaller\s+element(?:s)?\s+from\s+stack/i,
      /pop\s+greater\s+element(?:s)?\s+from\s+stack/i,
      /next\s+greater\s+element\s+using\s+stack/i,
      /next\s+smaller\s+element/i
    ]
  },

  "Fast & Slow Pointer": {
    canonicalName: "Fast & Slow Pointers (Floyd's Cycle)",
    aliases: ["fast and slow", "fast slow", "floyd", "floyd's", "tortoise and hare", "cycle detection"],
    phraseMatchers: [
      /fast\s+pointer\s+moves?\s+2\s+steps\s+slow\s+pointer\s+moves?\s+1\s+step/i,
      /two\s+pointer(?:s)?\s+cycle\s+detection/i,
      /tortoise\s+and\s+hare/i
    ]
  },

  "Top K Elements": {
    canonicalName: "Top K Elements / Priority Queue",
    aliases: ["top k", "kth largest", "kth smallest", "min heap for top k", "max heap", "priority queue"],
    phraseMatchers: [
      /use\s+a\s+(?:min|max)?\s*heap\s+of\s+size\s+k/i,
      /priority\s+queue\s+to\s+keep\s+top\s+k/i
    ]
  },

  "BFS": {
    canonicalName: "Breadth-First Search (BFS)",
    aliases: ["bfs", "breadth first search", "level order", "level order traversal", "queue traversal"],
    phraseMatchers: [
      /explore\s+level\s+by\s+level/i,
      /use\s+a\s+queue\s+to\s+traverse/i,
      /shortest\s+path\s+unweighted/i
    ]
  },

  "DFS": {
    canonicalName: "Depth-First Search (DFS)",
    aliases: ["dfs", "depth first search", "preorder", "inorder", "postorder", "recursive graph traversal"],
    phraseMatchers: [
      /explore\s+deeply\s+first/i,
      /recursive\s+traversal\s+using\s+stack/i,
      /backtrack\s+when\s+reaching\s+leaf/i
    ]
  },

  "Dynamic Programming": {
    canonicalName: "Dynamic Programming (DP)",
    aliases: ["dp", "dynamic programming", "memoization", "tabulation", "subproblem", "state transition", "overlapping subproblems"],
    phraseMatchers: [
      /store\s+results\s+of\s+subproblems/i,
      /memoiz(?:e|ation)/i,
      /bottom\s+up\s+dp/i,
      /top\s+down\s+dp/i,
      /state\s+transition\s+equation/i
    ]
  },

  "Backtracking": {
    canonicalName: "Backtracking",
    aliases: ["backtracking", "backtrack", "try all combinations", "decision tree exploration"],
    phraseMatchers: [
      /choose\s+explore\s+unchoose/i,
      /recursively\s+try\s+all\s+(?:possibilities|combinations|permutations)/i,
      /undo\s+(?:the\s+)?choice/i
    ]
  },

  "Greedy": {
    canonicalName: "Greedy Algorithm",
    aliases: ["greedy", "greedy approach", "make locally optimal choice", "interval scheduling"],
    phraseMatchers: [
      /make\s+locally\s+optimal\s+choice/i,
      /pick\s+best\s+at\s+each\s+step/i,
      /sort\s+by\s+end\s+time/i
    ]
  }
};

/**
 * Valid alternative approaches for specific pattern categories
 */
const VALID_ALTERNATIVE_APPROACHES = {
  "Four Sum": ["Two Pointers", "Hashing", "HashMap", "Two Sum"],
  "Three Sum": ["Two Pointers", "Hashing", "HashMap", "Two Sum"],
  "Two Sum": ["Two Pointers", "Hashing", "HashMap"],
  "Kth Largest Element": ["Heap / Priority Queue", "Quickselect", "Binary Search"],
  "Subarray Sum Equals K": ["Prefix Sum", "Hashing", "HashMap"],
  "Linked List Cycle": ["Fast & Slow Pointer", "Hashing", "HashSet"]
};

export function evaluateSemanticAnswer(userAnswer, expectedPatternName, expectedTopicName = "") {
  if (!userAnswer || typeof userAnswer !== 'string') {
    return {
      recognizedDataStructure: null,
      recognizedPattern: null,
      techniques: [],
      validApproach: false,
      isAlternativeApproach: false,
      confidence: 0,
      feedbackExplanation: "No answer provided. Please describe the data structure, pattern, or technique."
    };
  }

  const rawInput = userAnswer.trim();
  const lowerInput = rawInput.toLowerCase();

  // 1. Extract Data Structures
  const recognizedDataStructures = [];
  DATA_STRUCTURE_PATTERNS.forEach(ds => {
    if (ds.regex.test(lowerInput)) {
      recognizedDataStructures.push(ds.name);
    }
  });

  // 2. Extract Techniques
  const recognizedTechniques = [];
  TECHNIQUE_PATTERNS.forEach(tech => {
    if (tech.regex.test(lowerInput)) {
      recognizedTechniques.push(tech.name);
    }
  });

  // 3. Extract Recognized Pattern
  let recognizedPatternKey = null;
  let highestConfidence = 0;

  // Check pattern knowledge base
  Object.keys(PATTERN_KNOWLEDGE_BASE).forEach(key => {
    const info = PATTERN_KNOWLEDGE_BASE[key];

    // Check negative matchers (avoid false positives like "use a pointer to iterate")
    if (info.negativeMatchers && info.negativeMatchers.some(r => r.test(lowerInput))) {
      return;
    }

    // Direct alias check
    if (info.aliases.some(alias => lowerInput.includes(alias))) {
      if (!recognizedPatternKey || highestConfidence < 0.95) {
        recognizedPatternKey = key;
        highestConfidence = 0.95;
      }
    }

    // Phrase matchers check
    if (info.phraseMatchers && info.phraseMatchers.some(r => r.test(lowerInput))) {
      recognizedPatternKey = key;
      highestConfidence = 0.98;
    }
  });

  // Fallback to fuzzy token match if no key recognized yet
  if (!recognizedPatternKey && expectedPatternName) {
    const expNorm = expectedPatternName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userNorm = lowerInput.replace(/[^a-z0-9]/g, '');
    if (userNorm.includes(expNorm) || expNorm.includes(userNorm)) {
      recognizedPatternKey = expectedPatternName;
      highestConfidence = 0.85;
    } else {
      const expTokens = expectedPatternName.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
      if (expTokens.length > 0 && expTokens.some(t => lowerInput.includes(t))) {
        recognizedPatternKey = expectedPatternName;
        highestConfidence = 0.75;
      }
    }
  }

  const recognizedPatternName = recognizedPatternKey
    ? (PATTERN_KNOWLEDGE_BASE[recognizedPatternKey]?.canonicalName || recognizedPatternKey)
    : (recognizedTechniques.length > 0 ? recognizedTechniques.join(" + ") : null);

  // 4. Determine Validity against Expected Pattern
  let validApproach = false;
  let isAlternativeApproach = false;

  const normExpected = (expectedPatternName || "").toLowerCase();
  const normRecognized = (recognizedPatternKey || "").toLowerCase();

  // Direct match or parent family match
  if (
    normRecognized === normExpected ||
    (normExpected.includes("prefix") && (lowerInput.includes("prefix") || normRecognized.includes("prefix"))) ||
    (normExpected.includes("two") && (lowerInput.includes("pointer") || normRecognized.includes("two"))) ||
    (normExpected.includes("window") && (lowerInput.includes("window") || normRecognized.includes("window"))) ||
    (normExpected.includes("binary") && (lowerInput.includes("binary") || normRecognized.includes("binary"))) ||
    (normExpected.includes("stack") && (lowerInput.includes("stack") || normRecognized.includes("stack"))) ||
    (normExpected.includes("heap") && (lowerInput.includes("heap") || normRecognized.includes("heap"))) ||
    (normExpected.includes("dp") && (lowerInput.includes("dp") || normRecognized.includes("dp")))
  ) {
    validApproach = true;
    highestConfidence = Math.max(highestConfidence, 0.95);
  }

  // Check valid alternative approach
  if (!validApproach && expectedPatternName && VALID_ALTERNATIVE_APPROACHES[expectedPatternName]) {
    const validAlts = VALID_ALTERNATIVE_APPROACHES[expectedPatternName].map(a => a.toLowerCase());
    if (validAlts.some(alt => normRecognized.includes(alt) || lowerInput.includes(alt) || recognizedTechniques.some(t => alt.includes(t.toLowerCase())))) {
      validApproach = true;
      isAlternativeApproach = true;
      highestConfidence = 0.90;
    }
  }

  // Also accept if user correctly recognized Two Pointers / Sorting for 2Sum/3Sum/4Sum
  if (!validApproach && (expectedPatternName.includes("Sum") || expectedPatternName.includes("Pointer"))) {
    if (recognizedTechniques.includes("Two Pointers") || recognizedTechniques.includes("Sorting") || recognizedPatternKey === "Two Pointer" || lowerInput.includes("pointer")) {
      validApproach = true;
      highestConfidence = 0.92;
    }
  }

  // 5. Generate Human Explanation & Feedback
  let feedbackExplanation = "";

  if (validApproach) {
    const techStr = recognizedTechniques.length > 0 ? ` (Techniques: ${recognizedTechniques.join(" + ")})` : "";
    if (isAlternativeApproach) {
      feedbackExplanation = `✓ Valid Alternative Approach! Recognized: ${recognizedPatternName}${techStr}. While the primary benchmark pattern is ${expectedPatternName}, your proposed method is a fully valid solution for this problem!`;
    } else {
      feedbackExplanation = `✓ Correct! Recognized Pattern: ${recognizedPatternName}${techStr}. Excellent reasoning — your proposed approach is directly applicable for this problem!`;
    }
  } else if (recognizedDataStructures.length > 0 && !recognizedPatternName) {
    feedbackExplanation = `⚠️ Partial Understanding. Data Structure identified (${recognizedDataStructures.join(", ")}), but the problem-solving pattern/technique was missing. Consider how sorting, two pointers, or sliding window applies here.`;
  } else if (recognizedPatternName) {
    feedbackExplanation = `❌ ${recognizedPatternName} is not appropriate for this problem. This problem is best recognized as a ${expectedPatternName} pattern.`;
  } else {
    feedbackExplanation = `❌ Unrecognized approach. Consider analyzing the problem structure — for example, sorting + two pointers or sliding window.`;
  }

  return {
    recognizedDataStructure: recognizedDataStructures[0] || null,
    dataStructures: recognizedDataStructures,
    recognizedPattern: recognizedPatternName,
    techniques: recognizedTechniques,
    validApproach,
    isAlternativeApproach,
    confidence: highestConfidence,
    feedbackExplanation
  };
}
