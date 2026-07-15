import { db } from '../prisma/db';

export async function getAnalyticsData(userId: string) {
  const codingSubs = await db.codingSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  const aptitudeAttempts = await db.userAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: 'asc' }
  });

  const speechSessions = await db.communicationSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  const interviews = await db.mockInterview.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  const studyMins = (codingSubs.length * 15) + (aptitudeAttempts.length * 30) + (speechSessions.length * 10) + (interviews.length * 45);
  const studyHours = (studyMins / 60).toFixed(1);

  let totalAptitudeScore = 0;
  aptitudeAttempts.forEach((att: any) => totalAptitudeScore += att.score);
  const avgAptitudeScore = aptitudeAttempts.length > 0 ? Math.round(totalAptitudeScore / aptitudeAttempts.length) : 75;

  let totalSpeechFluency = 0;
  speechSessions.forEach((s: any) => totalSpeechFluency += s.fluencyScore);
  const avgSpeechRating = speechSessions.length > 0 ? Math.round(totalSpeechFluency / speechSessions.length) : 78;

  const acceptedCodingCount = codingSubs.filter((s: any) => s.status === 'ACCEPTED' || s.status === 'SUCCESS').length;
  const codingAccuracy = codingSubs.length > 0 ? Math.round((acceptedCodingCount / codingSubs.length) * 100) : 70;

  const codingScoreRadar = Math.min(100, Math.max(50, 60 + acceptedCodingCount * 5));
  const aptitudeScoreRadar = avgAptitudeScore;
  const softSkillsRadar = avgSpeechRating;
  const dbmsRadar = Math.min(100, Math.max(50, 55 + aptitudeAttempts.length * 4));
  const sysDesignRadar = Math.min(100, Math.max(50, 50 + interviews.length * 8));

  const placementReadiness = Math.round(
    (codingScoreRadar * 0.3) + 
    (aptitudeScoreRadar * 0.25) + 
    (softSkillsRadar * 0.25) + 
    (sysDesignRadar * 0.2)
  );

  const activityLevels = Array(24).fill(0);
  const activityDates = [...codingSubs, ...aptitudeAttempts, ...speechSessions, ...interviews];
  const now = new Date();
  
  activityDates.forEach((act: any) => {
    const actDate = new Date(act.createdAt || act.completedAt);
    const diffTime = Math.abs(now.getTime() - actDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 24) {
      activityLevels[23 - diffDays] += 1;
    }
  });

  const finalActivityLevels = activityLevels.map(v => Math.min(4, v));

  return {
    studyHours: `${studyHours} Hours`,
    averageAptitudeScore: avgAptitudeScore,
    codingAccuracy,
    placementReadiness: `${placementReadiness}% Match`,
    activityLevels: finalActivityLevels,
    radarMetrics: {
      coding: codingScoreRadar,
      aptitude: aptitudeScoreRadar,
      softSkills: softSkillsRadar,
      dbms: dbmsRadar,
      sysDesign: sysDesignRadar
    }
  };
}
