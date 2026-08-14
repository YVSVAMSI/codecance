import { PATTERN_HUNT_PROBLEMS } from './seedPatternHunt.js';
import { ROADMAP_SOURCE } from './seedRoadmap.js';

let matchedCount = 0;
PATTERN_HUNT_PROBLEMS.forEach((prob, idx) => {
  const tPats = ROADMAP_SOURCE[prob.topicName];
  if (tPats && tPats.includes(prob.patternName)) {
    matchedCount++;
  } else {
    console.log(`Unmatched Problem [${idx}]: "${prob.title}" | Topic: "${prob.topicName}" | Pattern: "${prob.patternName}"`);
  }
});

console.log(`Matched: ${matchedCount} / ${PATTERN_HUNT_PROBLEMS.length}`);
