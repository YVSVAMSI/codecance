export const ROADMAP_SOURCE = {
  "Arrays": ["Traversal","Hashing","Frequency Counting","Prefix Sum","Difference Array","Kadane's Algorithm","Two Sum","Three Sum","Four Sum","Sorting-Based Problems","Dutch National Flag","Majority Element","Stock Buy/Sell","Merge Intervals","Subarrays","Subsequences","Matrix Traversal","Spiral Matrix","Rotate Matrix","Set Matrix Zeroes","Pascal's Triangle","Cyclic Sort","Missing & Repeating Number","Range Queries"],
  "Strings": ["Character Frequency","Hashing","Two Pointer","Sliding Window","Palindrome","Anagram","Substrings","Subsequences","String Matching","Pattern Matching","Prefix Function","KMP","Z Algorithm","Rolling Hash","Trie-Based String Problems","String Transformation"],
  "Binary Search": ["Basic Binary Search","Lower Bound","Upper Bound","Search Insert Position","First Occurrence","Last Occurrence","Count Occurrences","Search in Rotated Sorted Array","Search in Rotated (Duplicates)","Find Minimum in Rotated Array","Peak Element","Single Element in Sorted Array","Binary Search on Answer","Koko Eating Bananas","Capacity to Ship Packages","Book Allocation","Aggressive Cows","Split Array","Median of Two Sorted Arrays"],
  "Linked List": ["Traversal","Reversal","Reverse in Groups","Middle of Linked List","Fast & Slow Pointer","Cycle Detection","Cycle Entry Point","Remove Nth Node","Merge Two Lists","Merge K Lists","Intersection","Palindrome","Reordering","Sorting","Flattening","Doubly Linked List","Random Pointer"],
  "Recursion": ["Basic Recursion","Subsequences","Subsets","Permutations","Combination Sum","Combinations","Generate Parentheses"],
  "Backtracking": ["Palindrome Partitioning","N-Queens","Sudoku Solver","Rat in a Maze","Word Search","Grid Backtracking","Subset Backtracking"],
  "Bit Manipulation": ["Basic Bit Operations","XOR Tricks","Single Number","Counting Bits","Power of Two","Subsets via Bitmask","Bit DP Basics"],
  "Stack": ["Stack Basics","Monotonic Stack","Next Greater Element","Next Smaller Element","Previous Greater/Smaller Element","Largest Rectangle in Histogram","Stock Span","Parentheses Matching","Min Stack","Expression Evaluation"],
  "Queue": ["Queue Basics","Monotonic Queue","Circular Queue","Queue Using Stack","Stack Using Queue","Sliding Window Maximum","Deque"],
  "Sliding Window": ["Fixed Size Window","Variable Size Window","Longest Substring Patterns","Minimum Window Substring","At Most K Distinct","Window with Frequency Map"],
  "Two Pointer": ["Opposite Direction","Same Direction","Sorted Array Two Pointer","Partitioning","Container With Most Water","Trapping Rain Water"],
  "Heap / Priority Queue": ["Min Heap","Max Heap","Kth Largest/Smallest","Top K Elements","K Closest Elements","Merge K Sorted Lists","Median from Data Stream","Two Heap Pattern","Task Scheduling","Greedy + Heap"],
  "Greedy": ["Activity Selection","Interval Scheduling","Fractional Knapsack","Job Sequencing","Gas Station","Jump Game","Greedy + Sorting"],
  "Binary Trees": ["DFS Traversals","BFS / Level Order","Height & Depth","Diameter","Balanced Tree Check","Maximum Path Sum","Lowest Common Ancestor","Tree Views","Boundary Traversal","Vertical Traversal","Zigzag Traversal","Serialize / Deserialize","Construct Tree from Traversals","Morris Traversal","Root to Leaf Paths"],
  "Binary Search Trees": ["Search","Insert","Delete","Validate BST","LCA in BST","Kth Smallest/Largest","Predecessor/Successor","Recover BST","Balanced BST Construction"],
  "Graphs": ["Graph Representation","BFS","DFS","Connected Components","Cycle Detection (Undirected)","Cycle Detection (Directed)","Bipartite Graph","Topological Sort (Kahn's)","Topological Sort (DFS)","Dijkstra","Bellman-Ford","Floyd-Warshall","0-1 BFS","Prim's MST","Kruskal's MST","Bridges","Articulation Points","Strongly Connected Components","Multi-source BFS","Grid Graphs","Word Ladder"],
  "Trie": ["Trie Construction","Word Search with Trie","Prefix Matching","Auto-complete","XOR Trie"],
  "Disjoint Set Union": ["DSU Basics","Union by Rank/Size","Path Compression","Kruskal's with DSU","Number of Components","Cycle Detection with DSU"],
  "Segment Tree": ["Segment Tree Construction","Range Sum Query","Range Min/Max Query","Point Update","Range Update (Lazy Propagation)","Merge Sort Tree"],
  "Fenwick Tree / BIT": ["BIT Construction","Point Update Range Query","Range Update Point Query","2D BIT","Inversion Count with BIT"],
  "Dynamic Programming": ["Fibonacci / 1D DP","Climbing Stairs","House Robber","Grid DP","2D DP","Longest Increasing Subsequence","Longest Common Subsequence","Longest Common Substring","Edit Distance","0/1 Knapsack","Unbounded Knapsack","Coin Change","Subset Sum","Partition DP","Target Sum","String DP","Interval DP","Matrix Chain Multiplication","Palindrome DP","Stock DP","State Machine DP","DP on Trees","DP on Graphs","Bitmask DP","Digit DP"],
  "Advanced Graphs": ["Tarjan's Algorithm","Euler Path / Circuit","Minimum Cost to Connect Points","Network Delay Time","Critical Connections","Traveling Salesman (Bitmask)"],
  "Advanced Dynamic Programming": ["DP with Bitmask + Graph","DP with Segment Tree Optimization","Convex Hull Trick","Divide and Conquer DP","Digit DP Advanced","Profile DP"],
  "Mathematical / Number Theory": ["Sieve of Eratosthenes","GCD / LCM","Modular Exponentiation","Modular Inverse","Prime Factorization","Combinatorics (nCr)","Euler's Totient Function"]
};

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24);
}

let isSeeding = false;

/**
 * Seeds the global A2Z roadmap (topics + patterns) exactly once.
 * Global rows have isCustom = false and createdBy = null. This replaces the old
 * per-user roadmap seeding so 250 patterns are no longer duplicated per account.
 */
export async function ensureGlobalContent(prisma) {
  const count = await prisma.topic.count();
  if (count > 0 || isSeeding) return;

  isSeeding = true;
  try {
    let topicOrder = 0;
    for (const topicName of Object.keys(ROADMAP_SOURCE)) {
      const topicId = `t-${topicOrder}-${slug(topicName)}`;
      await prisma.topic.create({
        data: {
          id: topicId,
          name: topicName,
          isCustom: false,
          order: topicOrder,
        },
      });

      let patternOrder = 0;
      for (const patName of ROADMAP_SOURCE[topicName]) {
        const patternId = `p-${topicOrder}-${patternOrder}-${slug(patName)}`;
        await prisma.pattern.create({
          data: {
            id: patternId,
            topicId,
            name: patName,
            seqCounter: 0,
            isCustom: false,
            order: patternOrder,
          },
        });
        patternOrder++;
      }
      topicOrder++;
    }
    console.log(`Global A2Z roadmap seeded: ${Object.keys(ROADMAP_SOURCE).length} topics.`);
  } finally {
    isSeeding = false;
  }
}
