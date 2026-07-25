import { db } from '../prisma/db';

const defaultSeedTopics = [
  {
    id: 'q1',
    name: 'Time and Work',
    category: 'QUANTITATIVE',
    description: 'Calculate rate efficiency and pipeline cistern parameters.',
    questions: [
      {
        id: 'q1_1',
        difficulty: 'EASY',
        questionText: 'A can complete a task in 10 days, and B can complete the same task in 15 days. If they work together, how many days will they take?',
        options: ['5 Days', '6 Days', '8 Days', '4 Days'],
        correctIndex: 1,
        hint: 'Calculate their daily rates: 1/10 and 1/15, add them up, then invert the result.',
        aiExplanation: '1. Rate of A = 1/10 per day.\n2. Rate of B = 1/15 per day.\n3. Combined Rate = 1/10 + 1/15 = (3 + 2)/30 = 5/30 = 1/6.\n4. Reciprocal = 6 Days.'
      },
      {
        id: 'q1_2',
        difficulty: 'MEDIUM',
        questionText: 'Pipe A can fill a tank in 6 hours and Pipe B can empty it in 8 hours. If both pipes are opened together, how long will it take to fill the tank?',
        options: ['14 Hours', '24 Hours', '18 Hours', '12 Hours'],
        correctIndex: 1,
        hint: 'Net rate per hour = 1/6 - 1/8.',
        aiExplanation: '1. Filling rate = 1/6 per hour.\n2. Emptying rate = 1/8 per hour.\n3. Net rate = 1/6 - 1/8 = 1/24.\n4. Time taken = 24 Hours.'
      }
    ]
  },
  {
    id: 'q2',
    name: 'Profit & Loss',
    category: 'QUANTITATIVE',
    description: 'Solve margins, cost markups, and sequential discount fractions.',
    questions: [
      {
        id: 'q2_1',
        difficulty: 'EASY',
        questionText: 'An item bought for $200 is sold for $250. What is the percentage profit earned?',
        options: ['20%', '25%', '30%', '15%'],
        correctIndex: 1,
        hint: 'Profit = Selling Price - Cost Price. Profit % = (Profit / Cost Price) * 100.',
        aiExplanation: '1. Profit = 250 - 200 = $50.\n2. Profit % = (50 / 200) * 100 = 25%.'
      }
    ]
  },
  {
    id: 'l1',
    name: 'Blood Relations',
    category: 'LOGICAL',
    description: 'Deconstruct family tree relations and coded statements.',
    questions: [
      {
        id: 'l1_1',
        difficulty: 'EASY',
        questionText: 'Pointing to a photograph, a man said: "I have no brother or sister, but that man\'s father is my father\'s son." Whose photograph was it?',
        options: ['His son\'s', 'His own', 'His father\'s', 'His nephew\'s'],
        correctIndex: 0,
        hint: '"My father\'s son" is the speaker himself (since he has no siblings).',
        aiExplanation: '1. "My father\'s son" = the man himself.\n2. "That man\'s father is my father\'s son" means that man\'s father is the speaker himself.\n3. Therefore, the photo is of his son.'
      }
    ]
  },
  {
    id: 'v1',
    name: 'Sentence Completion',
    category: 'VERBAL',
    description: 'Grammar structure, idioms, and contextual word selection.',
    questions: [
      {
        id: 'v1_1',
        difficulty: 'EASY',
        questionText: 'Despite the harsh criticism, the engineer remained ________ and focused on refining the system.',
        options: ['Undeterred', 'Agitated', 'Reluctant', 'Indifferent'],
        correctIndex: 0,
        hint: 'Choose a word that indicates resilience and determination.',
        aiExplanation: '"Undeterred" means persevering despite obstacles or criticism.'
      }
    ]
  }
];

export async function getTopics() {
  try {
    const dbTopics = await db.aptitudeTopic.findMany({
      include: { questions: true }
    });

    if (dbTopics && dbTopics.length > 0) {
      return dbTopics.map((t: any) => ({
        ...t,
        questions: (t.questions && t.questions.length > 0) ? t.questions.map((q: any) => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        })) : (defaultSeedTopics.find(st => st.id === t.id)?.questions || defaultSeedTopics[0].questions)
      }));
    }
  } catch (err: any) {
    console.warn('[Aptitude Service] DB query offline, using static topics data.');
  }

  return defaultSeedTopics;
}

export async function saveAptitudeAttempt(userId: string, data: any) {
  const { topicId, score, accuracy, timeTaken, incorrectQuestions, topicPerformance } = data;

  const attempt = await db.userAttempt.create({
    data: {
      userId,
      topicId,
      score: Number(score),
      accuracy: Number(accuracy),
      timeTaken: Number(timeTaken),
      incorrectQuestions: JSON.stringify(incorrectQuestions || []),
      topicPerformance: JSON.stringify(topicPerformance || {})
    }
  });

  // Grant XP to candidate on successful attempt
  const xpGained = Math.max(50, Math.round(Number(score) * 2));
  await db.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xpGained }
    }
  });

  // Update user level rank locally if DB triggers are not active
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) {
      let nextLevel = 1;
      if (user.xp < 1000) nextLevel = 1;
      else if (user.xp < 2500) nextLevel = 2;
      else if (user.xp < 5000) nextLevel = 3;
      else if (user.xp < 10000) nextLevel = 4;
      else if (user.xp < 20000) nextLevel = 5;
      else nextLevel = 6;

      if (user.level !== nextLevel) {
        await db.user.update({
          where: { id: userId },
          data: { level: nextLevel }
        });
      }
    }
  } catch (e) {
    // skip fallback
  }

  return attempt;
}

export async function getUserAptitudeHistory(userId: string) {
  return await db.userAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' }
  });
}
