import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始播種測試數據...');

  // 清理現有數據
  console.log('🧹 清理現有數據...');
  await prisma.notification.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.semanticChunk.deleteMany();
  await prisma.contractAnalysis.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // 創建測試用戶
  console.log('👤 創建測試用戶...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@contracts-l1.com',
      name: 'Demo User',
      password: passwordHash,
      company: 'Demo Company Ltd.',
      subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
      monthlyQuota: 100,
      usedQuota: 15,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@contracts-l1.com',
      name: 'Admin User',
      password: passwordHash,
      company: 'Contracts-L1 Team',
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      monthlyQuota: 1000,
      usedQuota: 0,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  // 創建免費用戶
  const freeUsers = await Promise.all(
    Array.from({ length: 3 }, async (_, i) => {
      return prisma.user.create({
        data: {
          email: `user${i + 1}@example.com`,
          name: faker.person.fullName(),
          password: passwordHash,
          company: faker.company.name(),
          subscriptionPlan: SubscriptionPlan.FREE,
          monthlyQuota: 0,
          usedQuota: 0,
          emailVerified: faker.datatype.boolean()
        }
      });
    })
  );

  console.log(`✅ 創建了 ${2 + freeUsers.length} 個用戶`);

  // 創建測試契約
  console.log('📄 創建測試契約...');
  
  const contract1 = await prisma.contract.create({
    data: {
      userId: demoUser.id,
      originalFileName: 'sample-nda.pdf',
      fileSize: 245678,
      mimeType: 'application/pdf',
      s3Key: `contracts/${demoUser.id}/sample-nda-${Date.now()}.pdf`,
      extractedText: '保密協議範本內容...',
      status: 'COMPLETED'
    }
  });

  const contract2 = await prisma.contract.create({
    data: {
      userId: demoUser.id,
      originalFileName: 'employment-contract.pdf',
      fileSize: 189432,
      mimeType: 'application/pdf',
      s3Key: `contracts/${demoUser.id}/employment-${Date.now()}.pdf`,
      extractedText: '僱傭合約範本內容...',
      status: 'COMPLETED'
    }
  });

  console.log(`✅ 創建了 2 個契約`);

  // 創建分析結果
  console.log('🤖 創建 AI 分析結果...');
  
  await prisma.contractAnalysis.create({
    data: {
      contractId: contract1.id,
      overallRiskLevel: 'MEDIUM',
      confidence: 85,
      clauses: [
        {
          type: 'confidentiality',
          text: '雙方應對商業機密資訊保密...',
          riskLevel: 'medium',
          position: { page: 1, paragraph: 3 }
        },
        {
          type: 'termination',
          text: '任一方可提前30天書面通知終止...',
          riskLevel: 'low',
          position: { page: 2, paragraph: 5 }
        }
      ],
      summary: '這是一份標準的保密協議,包含基本的保密條款與終止條件。',
      keyFindings: [
        '保密期限為協議終止後2年',
        '違約金條款較為寬鬆',
        '缺少爭議解決機制'
      ],
      recommendations: [
        '建議加入仲裁條款',
        '考慮延長保密期限至3年',
        '明確定義商業機密範圍'
      ],
      modelUsed: 'gpt-4-turbo-preview',
      modelVersion: '0125',
      tokensUsed: 2450,
      processingTimeMs: 3200
    }
  });

  await prisma.contractAnalysis.create({
    data: {
      contractId: contract2.id,
      overallRiskLevel: 'LOW',
      confidence: 92,
      clauses: [
        {
          type: 'payment',
          text: '月薪為新台幣80,000元...',
          riskLevel: 'low',
          position: { page: 1, paragraph: 2 }
        },
        {
          type: 'liability',
          text: '員工應對工作疏失負責...',
          riskLevel: 'low',
          position: { page: 3, paragraph: 1 }
        }
      ],
      summary: '標準的僱傭合約,條款清晰合理。',
      keyFindings: [
        '薪資與福利條款明確',
        '工作職責定義清楚',
        '包含完整的離職程序'
      ],
      recommendations: [
        '條款整體合理,無重大問題',
        '建議保留此範本供未來使用'
      ],
      modelUsed: 'gpt-4-turbo-preview',
      tokensUsed: 1800,
      processingTimeMs: 2400
    }
  });

  console.log(`✅ 創建了 2 個分析結果`);

  // 創建使用量記錄
  console.log('📊 創建使用量記錄...');
  
  await prisma.usageRecord.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'CONTRACT_UPLOAD',
        contractId: contract1.id,
        apiCalls: 1
      },
      {
        userId: demoUser.id,
        type: 'AI_ANALYSIS',
        contractId: contract1.id,
        tokensUsed: 2450,
        costUsd: 0.0049
      },
      {
        userId: demoUser.id,
        type: 'SEMANTIC_SEARCH',
        apiCalls: 3
      }
    ]
  });

  console.log(`✅ 創建了使用量記錄`);

  // 創建通知
  console.log('🔔 創建通知...');
  
  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'ANALYSIS_COMPLETE',
        title: '契約分析完成',
        message: 'sample-nda.pdf 的分析已完成,整體風險等級為中等。',
        link: `/contracts/${contract1.id}`
      },
      {
        userId: demoUser.id,
        type: 'QUOTA_WARNING',
        title: '配額提醒',
        message: '您已使用本月 15% 的配額。',
        read: false
      }
    ]
  });

  console.log(`✅ 創建了通知`);

  console.log('\n🎉 測試數據播種完成!');
  console.log('登入資訊:');
  console.log(`  Demo 用戶: demo@contracts-l1.com / password123`);
  console.log(`  Admin 用戶: admin@contracts-l1.com / password123`);
}

main()
  .catch((e) => {
    console.error('❌ 播種失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
