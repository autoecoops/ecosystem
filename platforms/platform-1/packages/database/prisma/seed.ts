import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Ensure we're in a development environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    throw new Error('Seed script should not be run in production environment');
  }

  console.log(`Running seed in ${nodeEnv} environment...`);

  // Clean database
  await prisma.user.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.contractAnalysis.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.notification.deleteMany();

  // Create demo user with bcrypt hash
  // NOTE: Set SEED_PASSWORD env var to customize password for seeded users
  const seedPassword = process.env.SEED_PASSWORD || 'DevOnly_P@ssw0rd123!';
  const passwordHash = await bcrypt.hash(seedPassword, 10);
  
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@contracts-l1.com',
      name: 'Demo User',
      password: passwordHash,
      company: 'Demo Company',
      monthlyQuota: 100,
      usedQuota: 15,
      emailVerified: true
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@contracts-l1.com',
      name: 'Admin User',
      password: passwordHash,
      company: 'Contracts-L1 Team',
      monthlyQuota: 1000,
      usedQuota: 0,
      emailVerified: true
    }
  });

  console.log('Created users:', demoUser.id, adminUser.id);

  // Create sample contract
  const contract = await prisma.contract.create({
    data: {
      userId: demoUser.id,
      originalFileName: 'sample.pdf',
      fileSize: 245678,
      mimeType: 'application/pdf',
      s3Key: `contracts/${demoUser.id}/${randomUUID()}.pdf`,
      status: 'COMPLETED'
    }
  });

  console.log('Created contract:', contract.id);

  // Create analysis
  await prisma.contractAnalysis.create({
    data: {
      contractId: contract.id,
      overallRiskLevel: 'MEDIUM',
      confidence: 85,
      clauses: [],
      summary: 'Sample contract analysis.',
      keyFindings: ['No issues found'],
      recommendations: ['Review carefully'],
      modelUsed: 'gpt-4'
    }
  });

  console.log('Created analysis');

  console.log('Seed completed successfully!');
  console.log('Demo user: demo@contracts-l1.com');
  console.log('Admin user: admin@contracts-l1.com');
  if (!process.env.SEED_PASSWORD) {
    console.log('Note: Using default development password. Set SEED_PASSWORD env var to customize.');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });