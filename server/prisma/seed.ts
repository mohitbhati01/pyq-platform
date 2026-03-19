import { PrismaClient, Difficulty } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create badges
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { slug: 'beginner' },
      update: {},
      create: { slug: 'beginner', name: 'Beginner', description: 'Posted your first question', threshold: 1 },
    }),
    prisma.badge.upsert({
      where: { slug: 'contributor' },
      update: {},
      create: { slug: 'contributor', name: 'Contributor', description: 'Earned 100 reputation points', threshold: 100 },
    }),
    prisma.badge.upsert({
      where: { slug: 'expert' },
      update: {},
      create: { slug: 'expert', name: 'Expert', description: 'Earned 500 reputation points', threshold: 500 },
    }),
    prisma.badge.upsert({
      where: { slug: 'answer-machine' },
      update: {},
      create: { slug: 'answer-machine', name: 'Answer Machine', description: 'Posted 50 answers', threshold: 50 },
    }),
  ]);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pyqplatform.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@pyqplatform.com',
      passwordHash: adminPassword,
      name: 'Platform Admin',
      bio: 'Platform administrator',
      isAdmin: true,
      reputation: 9999,
      emailVerified: true,
    },
  });

  // Create sample users
  const userPassword = await bcrypt.hash('Test@1234', 10);
  const users = await Promise.all(
    [
      { username: 'rahul_sharma', name: 'Rahul Sharma', email: 'rahul@example.com', subjects: ['Mathematics', 'Physics'], reputation: 450 },
      { username: 'priya_patel', name: 'Priya Patel', email: 'priya@example.com', subjects: ['Chemistry', 'Biology'], reputation: 320 },
      { username: 'amit_kumar', name: 'Amit Kumar', email: 'amit@example.com', subjects: ['History', 'Geography'], reputation: 180 },
      { username: 'sneha_reddy', name: 'Sneha Reddy', email: 'sneha@example.com', subjects: ['English', 'Economics'], reputation: 95 },
      { username: 'vikram_singh', name: 'Vikram Singh', email: 'vikram@example.com', subjects: ['Computer Science', 'Mathematics'], reputation: 610 },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          ...u,
          passwordHash: userPassword,
          bio: `Passionate student preparing for competitive exams. Love sharing knowledge!`,
          emailVerified: true,
          skills: ['Problem Solving', 'Critical Thinking'],
        },
      }),
    ),
  );

  // Create sample questions
  const questionData = [
    {
      title: 'Find the integral of sin²(x)cos²(x)',
      description: '## Problem\n\nEvaluate the following integral:\n\n$$\\int \\sin^2(x)\\cos^2(x)\\, dx$$\n\n**Source**: JEE Advanced 2022, Paper 1\n\nThis is a classic trigonometric integration problem. Show all steps clearly.',
      tags: ['integration', 'trigonometry', 'calculus'],
      examName: 'JEE Advanced',
      examYear: 2022,
      difficulty: Difficulty.HARD,
    },
    {
      title: "Explain the mechanism of SN1 and SN2 reactions with examples",
      description: '## Question\n\nCompare and contrast SN1 and SN2 nucleophilic substitution reactions:\n\n1. Mechanism\n2. Stereochemistry\n3. Substrate preference\n4. Solvent effects\n\n**Source**: NEET 2023, Section B',
      tags: ['organic-chemistry', 'reactions', 'mechanism'],
      examName: 'NEET',
      examYear: 2023,
      difficulty: Difficulty.MEDIUM,
    },
    {
      title: 'Who was the first Governor-General of independent India?',
      description: '## History Question\n\nIdentify the first Governor-General of independent India and briefly describe his contributions to the newly independent nation.\n\n**Source**: UPSC Prelims 2021',
      tags: ['history', 'indian-independence', 'politics'],
      examName: 'UPSC',
      examYear: 2021,
      difficulty: Difficulty.EASY,
    },
    {
      title: 'Implement a Binary Search Tree with insert, delete, and search operations',
      description: '## Problem Statement\n\nImplement a Binary Search Tree (BST) class in Python with the following operations:\n\n```python\nclass BST:\n    def insert(self, val): pass\n    def delete(self, val): pass\n    def search(self, val): pass\n    def inorder(self): pass\n```\n\nAnalyze time and space complexity.\n\n**Source**: GATE CSE 2022',
      tags: ['data-structures', 'trees', 'algorithms', 'python'],
      examName: 'GATE',
      examYear: 2022,
      difficulty: Difficulty.HARD,
    },
    {
      title: 'Explain the photoelectric effect and Einsteins equation',
      description: '## Question\n\nDescribe the photoelectric effect experiment by Hertz and explain how Einstein\'s equation:\n\n$$E_k = h\\nu - \\phi$$\n\naccounts for observations that the wave theory of light could not explain.\n\n**Source**: JEE Main 2023',
      tags: ['quantum-physics', 'photoelectric-effect', 'modern-physics'],
      examName: 'JEE Main',
      examYear: 2023,
      difficulty: Difficulty.MEDIUM,
    },
  ];

  const questions = await Promise.all(
    questionData.map((q, i) =>
      prisma.question.create({
        data: {
          ...q,
          authorId: users[i % users.length].id,
          viewCount: Math.floor(Math.random() * 500) + 50,
          voteScore: Math.floor(Math.random() * 30),
        },
      }),
    ),
  );

  // Create sample answers
  await Promise.all([
    prisma.answer.create({
      data: {
        questionId: questions[0].id,
        authorId: users[4].id,
        body: '## Solution\n\nUsing the identity: $\\sin^2(x)\\cos^2(x) = \\frac{1}{4}\\sin^2(2x)$\n\nThen use $\\sin^2(2x) = \\frac{1 - \\cos(4x)}{2}$\n\n$$\\int \\frac{1}{8}(1 - \\cos(4x))\\,dx = \\frac{x}{8} - \\frac{\\sin(4x)}{32} + C$$',
        isAccepted: true,
        voteScore: 24,
      },
    }),
    prisma.answer.create({
      data: {
        questionId: questions[1].id,
        authorId: users[1].id,
        body: '## SN1 vs SN2 Reactions\n\n**SN1 (Unimolecular)**\n- Two-step mechanism via carbocation intermediate\n- Rate depends only on substrate concentration\n- Racemization occurs at chiral center\n- Favored by: tertiary substrates, polar protic solvents\n\n**SN2 (Bimolecular)**\n- One-step concerted mechanism\n- Rate depends on both substrate and nucleophile\n- Inversion of configuration (Walden inversion)\n- Favored by: primary substrates, polar aprotic solvents, strong nucleophiles',
        isAccepted: true,
        voteScore: 18,
      },
    }),
    prisma.answer.create({
      data: {
        questionId: questions[2].id,
        authorId: users[2].id,
        body: '**C. Rajagopalachari** (Chakravarti Rajagopalachari, known as Rajaji) was the first and last Indian Governor-General of independent India, serving from 1948 to 1950.\n\nKey contributions:\n- Advocated for Hindu-Muslim unity\n- Played crucial role in drafting the Indian Constitution\n- Founded the Swatantra Party in 1959',
        isAccepted: true,
        voteScore: 15,
      },
    }),
  ]);

  // Create follows
  await Promise.all([
    prisma.follow.create({ data: { followerId: users[0].id, followingId: users[4].id } }),
    prisma.follow.create({ data: { followerId: users[1].id, followingId: users[0].id } }),
    prisma.follow.create({ data: { followerId: users[2].id, followingId: users[4].id } }),
    prisma.follow.create({ data: { followerId: users[3].id, followingId: users[0].id } }),
    prisma.follow.create({ data: { followerId: users[4].id, followingId: users[1].id } }),
  ]);

  // Award badges
  await Promise.all([
    prisma.userBadge.create({ data: { userId: users[4].id, badgeId: badges[2].id } }),
    prisma.userBadge.create({ data: { userId: users[0].id, badgeId: badges[1].id } }),
    prisma.userBadge.create({ data: { userId: users[1].id, badgeId: badges[1].id } }),
    ...users.map((u) => prisma.userBadge.create({ data: { userId: u.id, badgeId: badges[0].id } })),
  ]);

  console.log('✅ Seeding complete!');
  console.log('Admin credentials: admin@pyqplatform.com / Admin@123');
  console.log('Sample user: rahul@example.com / Test@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
