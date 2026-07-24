import { db } from '../prisma/db';

export async function getTopics() {
  try {
    const dbTopics = await db.aptitudeTopic.findMany({
      include: { questions: true }
    });
    if (dbTopics.length > 0) return dbTopics;
  } catch (err: any) {
    console.warn('[Aptitude Service] DB query offline, using static topics data.');
  }

  return [
    {
      id: 'q1',
      name: 'Time and Work',
      category: 'QUANTITATIVE',
      description: 'Calculate rate efficiency and pipeline cistern parameters.'
    },
    {
      id: 'q2',
      name: 'Profit & Loss',
      category: 'QUANTITATIVE',
      description: 'Solve margins, cost markups, and sequential discount fractions.'
    },
    {
      id: 'q3',
      name: 'Average',
      category: 'QUANTITATIVE',
      description: 'Compute consecutive averages and weighted class results.'
    }
  ];
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
