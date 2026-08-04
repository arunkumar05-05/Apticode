import { db } from '../prisma/db';

const XP_THRESHOLDS = [0, 1000, 2500, 5000, 10000, 20000];

export function getLevel(xp: number): number {
  let level = 1;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export async function grantXp(userId: string, amount: number, reason: string) {
  const xpLog = await db.xpLog.create({
    data: { userId, amount, reason }
  });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return xpLog;

  const newXp = user.xp + amount;
  const newLevel = getLevel(newXp);

  await db.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel }
  });

  await upsertLeaderboard(userId, newXp);

  return xpLog;
}

async function upsertLeaderboard(userId: string, totalXp: number) {
  await db.leaderboard.upsert({
    where: { userId },
    update: { totalXp, updatedAt: new Date() },
    create: { userId, totalXp }
  });

  const all = await db.leaderboard.findMany({ orderBy: { totalXp: 'desc' } });
  await Promise.all(
    all.map((entry: any, index: number) =>
      db.leaderboard.update({
        where: { userId: entry.userId },
        data: { rank: index + 1 }
      })
    )
  );
}

export async function getUserXpHistory(userId: string) {
  return await db.xpLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getLeaderboard(limit: number = 50) {
  return await db.leaderboard.findMany({
    take: limit,
    orderBy: { totalXp: 'desc' },
    include: { user: { select: { id: true, fullName: true, email: true, level: true } } }
  });
}