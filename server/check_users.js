import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndResetAdminUsers() {
  console.log('=== CHECKING USERS IN DATABASE ===');
  const users = await prisma.user.findMany({ select: { id: true, email: true, createdAt: true } });
  console.log('Found total users:', users.length);
  users.forEach(u => console.log(` - ID: ${u.id} | Email: ${u.email} | Created: ${u.createdAt}`));

  const targetEmails = ['vamsikrishna.yelugoti@gmail.com', 'vamsikrishna.yelugoti'];
  const newPassword = 'password123';
  const newHash = await bcrypt.hash(newPassword, 10);

  for (const email of targetEmails) {
    const normEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: newHash }
      });
      console.log(`✓ Updated password for existing user: ${normEmail} -> password: "${newPassword}"`);
    } else {
      const newUser = await prisma.user.create({
        data: { email: normEmail, passwordHash: newHash }
      });
      console.log(`✓ Created user: ${normEmail} -> password: "${newPassword}"`);
    }
  }

  await prisma.$disconnect();
}

checkAndResetAdminUsers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
