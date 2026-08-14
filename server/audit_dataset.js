import { PATTERN_HUNT_PROBLEMS } from './seedPatternHunt.js';
import { ROADMAP_SOURCE } from './seedRoadmap.js';

console.log("=== DATASET AUDIT ===");
console.log("Total PATTERN_HUNT_PROBLEMS count:", PATTERN_HUNT_PROBLEMS.length);

// Check unique titles and links
const titles = new Set();
const dupTitles = [];
const links = new Set();
const dupLinks = [];

PATTERN_HUNT_PROBLEMS.forEach((p, idx) => {
  if (!p.title) console.log(`Missing title at index ${idx}`);
  if (titles.has(p.title.trim().toLowerCase())) {
    dupTitles.push({ idx, title: p.title });
  } else {
    titles.add(p.title.trim().toLowerCase());
  }

  if (p.problemLink) {
    if (links.has(p.problemLink.trim())) {
      dupLinks.push({ idx, title: p.title, link: p.problemLink });
    } else {
      links.add(p.problemLink.trim());
    }
  }
});

console.log("Unique Titles Count:", titles.size);
console.log("Duplicate Titles Count:", dupTitles.length, dupTitles);
console.log("Unique Links Count:", links.size);
console.log("Duplicate Links Count:", dupLinks.length, dupLinks);

// Check topic and pattern mappings against ROADMAP_SOURCE
const roadmapTopics = Object.keys(ROADMAP_SOURCE);
console.log("\n=== ROADMAP TOPICS & PATTERNS ===");
let totalRoadmapPatterns = 0;
roadmapTopics.forEach(t => {
  totalRoadmapPatterns += ROADMAP_SOURCE[t].length;
});
console.log(`Roadmap Topics Count: ${roadmapTopics.length}, Total Patterns Count: ${totalRoadmapPatterns}`);

// Check topicName and patternName matches
const topicMismatch = [];
const patternMismatch = [];
const patternProblemCounts = {};

roadmapTopics.forEach(t => {
  ROADMAP_SOURCE[t].forEach(p => {
    patternProblemCounts[`${t} -> ${p}`] = 0;
  });
});

PATTERN_HUNT_PROBLEMS.forEach((p, idx) => {
  const tName = p.topicName;
  const pName = p.patternName;

  if (!ROADMAP_SOURCE[tName]) {
    topicMismatch.push({ idx, title: p.title, topicName: tName, patternName: pName });
  } else {
    const validPats = ROADMAP_SOURCE[tName];
    if (!validPats.includes(pName)) {
      patternMismatch.push({ idx, title: p.title, topicName: tName, patternName: pName, validInTopic: validPats });
    } else {
      patternProblemCounts[`${tName} -> ${pName}`] = (patternProblemCounts[`${tName} -> ${pName}`] || 0) + 1;
    }
  }
});

console.log("\nTopic Mismatches (topicName not in ROADMAP_SOURCE):", topicMismatch.length, topicMismatch);
console.log("\nPattern Mismatches (patternName not under topicName in ROADMAP_SOURCE):", patternMismatch.length, patternMismatch.slice(0, 15));
