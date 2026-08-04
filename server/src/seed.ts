import { db } from './prisma/db';
import bcrypt from 'bcryptjs';
import { defaultSeedTopics } from './services/aptitudeService';

async function seed() {
  console.log('[Seed] Starting seed process...');

  const existingAdmin = await db.user.findUnique({ where: { email: 'admin@college.edu' } });
  if (!existingAdmin) {
    const hash = await bcrypt.hash('AdminPassword2026!', 10);
    await db.user.create({
      data: {
        email: 'admin@college.edu',
        passwordHash: hash,
        fullName: 'Prof. Shastri',
        role: 'ADMIN',
        authProvider: 'local-password',
        profile: {
          create: {
            fullName: 'Prof. Shastri',
            email: 'admin@college.edu',
            college: 'AptiCode College',
            branch: 'Computer Science',
            graduationYear: 2026
          }
        }
      }
    });
    console.log('[Seed] Demo admin user created.');
  } else {
    console.log('[Seed] Admin user already exists, skipping.');
  }

  const existingStudent = await db.user.findUnique({ where: { email: 'student@college.edu' } });
  if (!existingStudent) {
    const hash = await bcrypt.hash('StudentPassword2026!', 10);
    await db.user.create({
      data: {
        email: 'student@college.edu',
        passwordHash: hash,
        fullName: 'Rahul Sharma',
        role: 'STUDENT',
        authProvider: 'local-password',
        profile: {
          create: {
            fullName: 'Rahul Sharma',
            email: 'student@college.edu',
            college: 'AptiCode College',
            branch: 'Computer Science',
            graduationYear: 2026
          }
        }
      }
    });
    console.log('[Seed] Demo student user created.');
  } else {
    console.log('[Seed] Student user already exists, skipping.');
  }

  const topicCount = await db.aptitudeTopic.count();
  if (topicCount === 0) {
    for (const topicData of defaultSeedTopics) {
      const topic = await db.aptitudeTopic.create({
        data: {
          id: topicData.id,
          name: topicData.name,
          description: topicData.description,
          category: topicData.category as any
        }
      });

      for (const qData of topicData.questions) {
        await db.aptitudeQuestion.create({
          data: {
            id: qData.id,
            topicId: topic.id,
            questionText: qData.questionText,
            optionA: qData.options[0],
            optionB: qData.options[1],
            optionC: qData.options[2],
            optionD: qData.options[3],
            correctOption: ['A', 'B', 'C', 'D'][qData.correctIndex],
            explanation: qData.aiExplanation,
            difficulty: qData.difficulty as any
          }
        });
      }

      console.log(`[Seed] Seeded topic: ${topic.name} with ${topicData.questions.length} questions.`);
    }
  } else {
    console.log(`[Seed] ${topicCount} topics already exist, skipping aptitude seed.`);
  }

  const problemCount = await db.codingProblem.count();
  if (problemCount === 0) {
    const problems = [
      {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'EASY' as const,
        timeLimitMs: 5000,
        testcases: [
          { inputData: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false },
          { inputData: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: true },
          { inputData: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true }
        ]
      },
      {
        title: 'Container With Most Water',
        description: 'Given n non-negative integers a1, a2, ..., an , where each represents a point at coordinate (i, ai). Find two lines that together with the x-axis forms a container, such that the container contains the most water.',
        difficulty: 'MEDIUM' as const,
        timeLimitMs: 8000,
        testcases: [
          { inputData: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49', isHidden: false },
          { inputData: '[1,1]', expectedOutput: '1', isHidden: true }
        ]
      },
      {
        title: 'Reverse Linked List',
        description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
        difficulty: 'EASY' as const,
        timeLimitMs: 5000,
        testcases: [
          { inputData: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
          { inputData: '[1,2]', expectedOutput: '[2,1]', isHidden: true }
        ]
      },
      {
        title: 'Longest Common Subsequence',
        description: 'Given two strings text1 and text2, return the length of their longest common subsequence.',
        difficulty: 'HARD' as const,
        timeLimitMs: 10000,
        testcases: [
          { inputData: '"abcde"\n"ace"', expectedOutput: '3', isHidden: false },
          { inputData: '"abc"\n"abc"', expectedOutput: '3', isHidden: true },
          { inputData: '"abc"\n"def"', expectedOutput: '0', isHidden: true }
        ]
      }
    ];

    for (const p of problems) {
      const problem = await db.codingProblem.create({
        data: {
          title: p.title,
          description: p.description,
          difficulty: p.difficulty,
          timeLimitMs: p.timeLimitMs,
          testcases: {
            create: p.testcases.map(tc => ({
              inputData: tc.inputData,
              expectedOutput: tc.expectedOutput,
              isHidden: tc.isHidden
            }))
          }
        },
        include: { testcases: true }
      });
      console.log(`[Seed] Seeded coding problem: ${p.title} with ${problem.testcases.length} testcases.`);
    }
  } else {
    console.log(`[Seed] ${problemCount} coding problems already exist, skipping.`);
  }

  console.log('[Seed] Seed process complete.');
}

seed().catch((err: any) => {
  console.error('[Seed] Error:', err.message);
  process.exit(1);
});