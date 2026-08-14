import { PATTERN_HUNT_PROBLEMS } from './seedPatternHunt.js';
import { ROADMAP_SOURCE } from './seedRoadmap.js';

console.log("=== DEDUPING AND RE-MAPPING PATTERN HUNT PROBLEMS ===");

// 1. Deduplicate by title / link
const seenTitles = new Set();
const cleanProblems = [];

PATTERN_HUNT_PROBLEMS.forEach((p) => {
  let titleKey = p.title.trim().toLowerCase().replace(/\s*\(revisited.*?\)\s*/g, '').replace(/\s*\(.*?approach\)\s*/g, '');
  
  if (seenTitles.has(titleKey)) {
    return; // Skip duplicate
  }
  seenTitles.add(titleKey);

  // Fix known pattern mismatches against ROADMAP_SOURCE
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

console.log(`Original problem count: ${PATTERN_HUNT_PROBLEMS.length}`);
console.log(`Clean unique problem count: ${cleanProblems.length}`);

// Check if any problem still has an invalid topic or pattern
let invalidCount = 0;
cleanProblems.forEach((p, idx) => {
  if (!ROADMAP_SOURCE[p.topicName]) {
    console.log(`Invalid topic at ${idx}: ${p.topicName}`);
    invalidCount++;
  } else if (!ROADMAP_SOURCE[p.topicName].includes(p.patternName)) {
    console.log(`Invalid pattern at ${idx}: ${p.patternName} in topic ${p.topicName}`);
    invalidCount++;
  }
});

console.log(`Invalid mappings remaining: ${invalidCount}`);
