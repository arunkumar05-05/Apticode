import { db } from '../prisma/db';

export async function getDashboardData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 1. Fetch Coding attempts
  const codingSubs = await db.codingSubmission.findMany({
    where: { userId }
  });
  const solvedProblems = new Set(
    codingSubs.filter((sub: any) => sub.status === 'ACCEPTED' || sub.status === 'SUCCESS').map((sub: any) => sub.problemId)
  ).size;

  // 2. Fetch Aptitude UserAttempts
  const aptitudeAttempts = await db.userAttempt.findMany({
    where: { userId }
  });
  const mcqsAttempted = aptitudeAttempts.length;
  
  let totalScore = 0;
  aptitudeAttempts.forEach((att: any) => {
    totalScore += Number(att.score);
  });
  const averageScore = mcqsAttempted > 0 ? Math.round(totalScore / mcqsAttempted) : 0;

  // 3. Fetch speech sessions
  const speechSessions = await db.communicationSession.findMany({
    where: { userId }
  });
  
  let totalSpeechFluency = 0;
  speechSessions.forEach((s: any) => totalSpeechFluency += s.fluencyScore);
  const avgSpeechRating = speechSessions.length > 0 ? (totalSpeechFluency / (speechSessions.length * 10)).toFixed(1) : '8.0';

  // 4. Fetch interviews
  const interviews = await db.mockInterview.findMany({
    where: { userId }
  });
  const testsCompleted = mcqsAttempted + interviews.length;

  // 5. Topics stats (weak / strong)
  const topicScores: Record<string, { total: number, count: number }> = {};
  aptitudeAttempts.forEach((att: any) => {
    if (!topicScores[att.topicId]) {
      topicScores[att.topicId] = { total: 0, count: 0 };
    }
    topicScores[att.topicId].total += Number(att.score);
    topicScores[att.topicId].count += 1;
  });

  const topicsList = Object.keys(topicScores).map(topicId => {
    const avg = topicScores[topicId].total / topicScores[topicId].count;
    return { topicId, avg };
  });

  topicsList.sort((a, b) => a.avg - b.avg);
  
  const mapTopicName = (tId: string) => {
    if (tId === 'q1') return 'Time and Work';
    if (tId === 'q2') return 'Profit & Loss';
    if (tId === 'q3') return 'Average';
    return tId;
  };

  const weakTopics = topicsList.slice(0, 2).map(t => mapTopicName(t.topicId));
  const strongTopics = [...topicsList].reverse().slice(0, 2).map(t => mapTopicName(t.topicId));

  if (weakTopics.length === 0) weakTopics.push('Probability');
  if (strongTopics.length === 0) strongTopics.push('Time & Work');

  // 6. Ranks
  const higherXpCount = await db.user.count({
    where: { xp: { gt: user.xp } }
  });
  const leaderboardRank = higherXpCount + 1;

  // 7. Streak calculation
  const activityDates = new Set<string>();
  codingSubs.forEach((s: any) => activityDates.add(new Date(s.createdAt).toDateString()));
  aptitudeAttempts.forEach((s: any) => activityDates.add(new Date(s.completedAt).toDateString()));
  speechSessions.forEach((s: any) => activityDates.add(new Date(s.createdAt).toDateString()));
  interviews.forEach((s: any) => activityDates.add(new Date(s.createdAt).toDateString()));
  
  let currentStreak = 0;
  let checkDate = new Date();
  while (activityDates.has(checkDate.toDateString())) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  if (currentStreak === 0) {
    checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    if (activityDates.has(checkDate.toDateString())) {
      checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);
      while (activityDates.has(checkDate.toDateString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
  }

  // 8. Recent activities
  const recentActivities: any[] = [];
  codingSubs.slice(0, 3).forEach((s: any) => {
    recentActivities.push({
      type: 'coding',
      title: 'Coding Solution Submitted',
      detail: `Submitted code for challenge with status: ${s.status}`,
      date: s.createdAt
    });
  });
  aptitudeAttempts.slice(0, 3).forEach((s: any) => {
    recentActivities.push({
      type: 'aptitude',
      title: 'Aptitude Practice Completed',
      detail: `Scored ${s.score}% in quantitative logic quiz`,
      date: s.completedAt
    });
  });
  speechSessions.slice(0, 3).forEach((s: any) => {
    recentActivities.push({
      type: 'communication',
      title: 'Speech Session Evaluated',
      detail: `Rated ${s.fluencyScore}/100 fluency on prompt`,
      date: s.createdAt
    });
  });

  recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const levelTag = user.level === 1 ? 'Beginner' : user.level === 2 ? 'Intermediate' : user.level === 3 ? 'Advanced' : user.level === 4 ? 'Expert' : user.level === 5 ? 'Master' : 'Placement Ready';

  return {
    fullName: user.profile?.fullName || user.fullName || user.email.split('@')[0],
    email: user.email,
    xp: user.xp,
    level: levelTag,
    streak: `${currentStreak} days`,
    codingAccuracy: codingSubs.length > 0 ? ((codingSubs.filter((s: any) => s.status === 'ACCEPTED' || s.status === 'SUCCESS').length / codingSubs.length) * 100).toFixed(1) + '%' : '0.0%',
    aptitudeScore: `${averageScore}/100`,
    speechRating: `${avgSpeechRating}/10`,
    testsCompleted,
    solvedProblems,
    mcqsAttempted,
    weakTopics,
    strongTopics,
    leaderboardRank,
    recentActivities: recentActivities.slice(0, 5)
  };
}
