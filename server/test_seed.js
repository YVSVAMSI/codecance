import { PrismaClient } from '@prisma/client';
import { ensurePatternHuntSeed } from './seedPatternHunt.js';

const prisma = new PrismaClient();

async function run() {
  console.log("Before seed count:", await prisma.patternHuntProblem.count());
  await ensurePatternHuntSeed(prisma);
  console.log("After seed count:", await prisma.patternHuntProblem.count());
  const sample = await prisma.patternHuntProblem.findFirst();
  console.log("Sample:", sample);
}

run().catch(console.error).finally(() => prisma.$disconnect());
