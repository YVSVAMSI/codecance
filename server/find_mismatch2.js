import { PATTERN_HUNT_PROBLEMS } from './seedPatternHunt.js';
import { ROADMAP_SOURCE } from './seedRoadmap.js';

console.log("Total PATTERN_HUNT_PROBLEMS:", PATTERN_HUNT_PROBLEMS.length);

const roadmapMap = {};
Object.keys(ROADMAP_SOURCE).forEach(t => {
  ROADMAP_SOURCE[t].forEach(p => {
    roadmapMap[`${t} -> ${p}`] = 0;
  });
});

let matched = 0;
let unmatched = [];

PATTERN_HUNT_PROBLEMS.forEach((prob, idx) => {
  const key = `${prob.topicName} -> ${prob.patternName}`;
  if (roadmapMap[key] !== undefined) {
    roadmapMap[key]++;
    matched++;
  } else {
    unmatched.push({ idx, title: prob.title, topic: prob.topicName, pattern: prob.patternName });
  }
});

console.log(`Matched: ${matched} / ${PATTERN_HUNT_PROBLEMS.length}`);
console.log("Unmatched problems:", unmatched);
