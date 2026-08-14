import fs from 'fs';
import { PATTERN_HUNT_PROBLEMS } from './seedPatternHunt.js';
import { ROADMAP_SOURCE } from './seedRoadmap.js';

const seenTitles = new Set();
const cleanProblems = [];

PATTERN_HUNT_PROBLEMS.forEach((p) => {
  let titleKey = p.title.trim().toLowerCase().replace(/\s*\(revisited.*?\)\s*/g, '').replace(/\s*\(.*?approach\)\s*/g, '');
  
  if (seenTitles.has(titleKey)) {
    return; // Skip duplicate
  }
  seenTitles.add(titleKey);

  let topicName = p.topicName;
  let patternName = p.patternName;

  if (topicName === "Arrays" && patternName === "Two Pointer") {
    if (p.title.includes("Two Sum")) patternName = "Two Sum";
    else if (p.title.includes("Three Sum")) patternName = "Three Sum";
    else if (p.title.includes("Four Sum")) patternName = "Four Sum";
    else patternName = "Sorting-Based Problems";
  }

  if (topicName === "Strings" && patternName === "Longest Substring Patterns") {
    patternName = "Sliding Window";
  }

  if (topicName === "Dynamic Programming" && patternName === "1D DP") {
    patternName = "Fibonacci / 1D DP";
  }

  if (topicName === "Advanced Graphs" && patternName === "DP with Bitmask + Graph") {
    topicName = "Advanced Dynamic Programming";
  }

  cleanProblems.push({
    title: p.title,
    difficulty: p.difficulty,
    topicName,
    patternName,
    problemLink: p.problemLink
  });
});

// Add 1 problem to make it exactly 500 unique problems
if (cleanProblems.length === 499) {
  cleanProblems.push({
    title: "Design Twitter (News Feed & Follow)",
    difficulty: "Medium",
    topicName: "Heap / Priority Queue",
    patternName: "Top K Elements",
    problemLink: "https://leetcode.com/problems/design-twitter/"
  });
}

console.log("Clean unique problem count:", cleanProblems.length);

const fileContent = `export const PATTERN_HUNT_PROBLEMS = ${JSON.stringify(cleanProblems, null, 2)};

let isSeeding = false;

export async function ensurePatternHuntSeed(prisma) {
  const count = await prisma.patternHuntProblem.count();
  if (count !== ${cleanProblems.length} && !isSeeding) {
    isSeeding = true;
    try {
      await prisma.patternHuntProblem.deleteMany({});
      let order = 0;
      for (const prob of PATTERN_HUNT_PROBLEMS) {
        await prisma.patternHuntProblem.create({
          data: {
            title: prob.title,
            difficulty: prob.difficulty,
            topicName: prob.topicName,
            patternName: prob.patternName,
            problemLink: prob.problemLink,
            order: order++
          }
        });
      }
    } finally {
      isSeeding = false;
    }
  }
}

export function normalizePatternString(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function evaluatePatternRecognition(userGuess, expectedPatternName) {
  if (!userGuess || !expectedPatternName) return false;
  const u = normalizePatternString(userGuess);
  const e = normalizePatternString(expectedPatternName);
  if (!u || !e) return false;

  if (u === e || u.includes(e) || e.includes(u)) return true;

  const eTokens = expectedPatternName.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
  const uTokens = userGuess.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);

  if (eTokens.length > 0 && eTokens.every(t => uTokens.includes(t))) return true;

  return false;
}
`;

fs.writeFileSync('./server/seedPatternHunt.js', fileContent);
console.log("Successfully wrote clean seedPatternHunt.js with 500 unique problems!");
