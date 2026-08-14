import { PATTERN_HUNT_PROBLEMS } from './seedPatternHunt.js';
import { ROADMAP_SOURCE } from './seedRoadmap.js';

console.log("=== DETAILED DUPLICATE INSPECTION ===");

const titleMap = {};
PATTERN_HUNT_PROBLEMS.forEach((p, idx) => {
  const normTitle = p.title.trim().toLowerCase().replace(/\s*\(.*?\)\s*/g, '');
  if (!titleMap[normTitle]) titleMap[normTitle] = [];
  titleMap[normTitle].push({ idx, originalTitle: p.title, topic: p.topicName, pattern: p.patternName, link: p.problemLink });
});

let dupCount = 0;
Object.keys(titleMap).forEach(title => {
  if (titleMap[title].length > 1) {
    dupCount++;
    console.log(`\nDuplicate Group [${title}]:`);
    titleMap[title].forEach(item => {
      console.log(`  - Index ${item.idx}: "${item.originalTitle}" | Topic: ${item.topic} | Pattern: ${item.pattern}`);
    });
  }
});

console.log(`\nTotal duplicate groups: ${dupCount}`);
