import { db } from '../prisma/db';

export async function getStudents() {
  const users = await db.user.findMany({
    where: { role: 'STUDENT' },
    include: { profile: true },
    orderBy: { createdAt: 'desc' }
  });

  const students = await Promise.all(users.map(async (u: any) => {
    const [attempts, submissions, interviews, xpLogs] = await Promise.all([
      db.userAttempt.count({ where: { userId: u.id } }),
      db.codingSubmission.count({ where: { userId: u.id } }),
      db.mockInterview.count({ where: { userId: u.id } }),
      db.xpLog.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 1 })
    ]);

    const lastActivity = xpLogs[0]?.createdAt || u.createdAt;
    const avgScore = attempts > 0 
      ? Math.round((await db.userAttempt.aggregate({ where: { userId: u.id }, _avg: { score: true } }))._avg.score || 0)
      : 0;

    return {
      id: u.id,
      name: u.fullName || u.profile?.fullName || u.email.split('@')[0],
      email: u.email,
      level: u.level,
      xp: u.xp,
      role: u.role,
      college: u.profile?.college,
      branch: u.profile?.branch,
      graduationYear: u.profile?.graduationYear,
      stats: {
        attempts,
        submissions,
        interviews,
        avgScore
      },
      lastActivity
    };
  }));

  return students;
}

export async function getAdminAnalytics() {
  const [totalUsers, totalStudents, totalAdmins, totalAttempts, totalSubmissions, totalInterviews] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'STUDENT' } }),
    db.user.count({ where: { role: 'ADMIN' } }),
    db.userAttempt.count(),
    db.codingSubmission.count(),
    db.mockInterview.count()
  ]);

  const attemptsByCategory = await db.userAttempt.groupBy({
    by: ['topicId'],
    _count: { id: true },
    _avg: { score: true }
  });

  const xpDistribution = await db.user.groupBy({
    by: ['level'],
    _count: { id: true }
  });

  const recentActivity = await db.xpLog.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, fullName: true, email: true } } }
  });

  return {
    totals: {
      users: totalUsers,
      students: totalStudents,
      admins: totalAdmins,
      attempts: totalAttempts,
      submissions: totalSubmissions,
      interviews: totalInterviews
    },
    attemptsByCategory,
    xpDistribution,
    recentActivity
  };
}

export async function deleteStudent(userId: string) {
  await db.user.delete({ where: { id: userId } });
  return { success: true };
}

export async function getPlacementReadinessReport() {
  const users = await db.user.findMany({
    where: { role: 'STUDENT' },
    include: { profile: true }
  });

  const rows = await Promise.all(users.map(async (u: any) => {
    const [attempts, submissions, interviews, latestAttempt] = await Promise.all([
      db.userAttempt.findMany({ where: { userId: u.id } }),
      db.codingSubmission.count({ where: { userId: u.id } }),
      db.mockInterview.count({ where: { userId: u.id } }),
      db.userAttempt.findFirst({ where: { userId: u.id }, orderBy: { completedAt: 'desc' } })
    ]);

    const avgScore = attempts.length > 0 
      ? Math.round(attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / attempts.length)
      : 0;

    const topicsCovered = new Set(attempts.map((a: any) => a.topicId)).size;

    return {
      id: u.id,
      name: u.fullName || u.profile?.fullName || u.email.split('@')[0],
      email: u.email,
      college: u.profile?.college,
      branch: u.profile?.branch,
      graduationYear: u.profile?.graduationYear,
      level: u.level,
      xp: u.xp,
      avgScore,
      attempts: attempts.length,
      topicsCovered,
      codingSubmissions: submissions,
      mockInterviews: interviews,
      lastActive: latestAttempt?.completedAt || u.createdAt
    };
  }));

  return rows;
}