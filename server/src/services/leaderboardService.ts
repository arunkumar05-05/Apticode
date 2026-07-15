import { db } from '../prisma/db';

export async function getLeaderboard(currentUserId: string) {
  const users = await db.user.findMany({
    include: {
      profile: true,
      codingAttempts: true,
      aptitudeAttempts: true
    }
  });

  const candidates = users.map((u: any) => {
    const solvedCount = new Set(
      (u.codingAttempts || []).filter((sub: any) => sub.status === 'ACCEPTED' || sub.status === 'SUCCESS').map((sub: any) => sub.problemId)
    ).size;

    let totalScore = 0;
    const atts = u.aptitudeAttempts || [];
    atts.forEach((a: any) => totalScore += Number(a.score));
    const averageScore = atts.length > 0 ? Math.round(totalScore / atts.length) : 0;

    const levelTag = u.level === 1 ? 'Beginner' : u.level === 2 ? 'Intermediate' : u.level === 3 ? 'Advanced' : u.level === 4 ? 'Expert' : u.level === 5 ? 'Master' : 'Placement Ready';

    return {
      userId: u.id,
      name: u.profile?.fullName || u.fullName || u.email.split('@')[0],
      weeklyScore: Math.round(u.xp / 10),
      totalScore: u.xp,
      streak: 8,
      level: levelTag,
      college: u.profile?.college || 'IIT Delhi',
      solvedCount,
      averageScore
    };
  });

  candidates.sort((a: any, b: any) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
    return b.averageScore - a.averageScore;
  });

  const ranked = candidates.map((c: any, i: number) => ({
    rank: i + 1,
    ...c,
    name: c.userId === currentUserId ? `${c.name} (You)` : c.name
  }));

  if (ranked.length < 3) {
    const backupMock = [
      { rank: 1, name: 'Siddharth Sen', weeklyScore: 480, totalScore: 28400, streak: 24, level: 'Placement Ready', college: 'IIT Delhi', solvedCount: 45, averageScore: 92 },
      { rank: 2, name: 'Rahul Sharma', weeklyScore: 420, totalScore: 24500, streak: 12, level: 'Master', college: 'IIT Delhi', solvedCount: 38, averageScore: 84 },
      { rank: 3, name: 'Ananya Goel', weeklyScore: 390, totalScore: 22100, streak: 8, level: 'Master', college: 'IIT Delhi', solvedCount: 32, averageScore: 82 }
    ];
    
    const me = ranked.find((u: any) => u.userId === currentUserId);
    if (me) {
      backupMock[1] = {
        rank: 2,
        name: me.name,
        weeklyScore: me.weeklyScore,
        totalScore: me.totalScore,
        streak: me.streak,
        level: me.level,
        college: me.college,
        solvedCount: me.solvedCount,
        averageScore: me.averageScore
      };
    }
    
    backupMock.sort((a, b) => b.totalScore - a.totalScore);
    return backupMock.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  return ranked;
}
