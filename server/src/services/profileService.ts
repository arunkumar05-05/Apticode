import { db } from '../prisma/db';

export async function getUserProfile(userId: string) {
  let profile = await db.profile.findUnique({
    where: { userId }
  });
  if (!profile) {
    // Return empty profile with user ID to prevent crashes
    profile = await db.profile.create({
      data: {
        userId,
        fullName: 'New Candidate',
        college: 'AptiCode College',
        branch: 'Computer Science',
        graduationYear: 2026
      }
    });
  }
  return profile;
}

export async function updateUserProfile(userId: string, data: any) {
  const {
    fullName,
    email,
    phone,
    college,
    branch,
    department,
    graduationYear,
    registerNumber,
    skills,
    bio,
    github,
    linkedin,
    portfolio,
    profilePhoto,
    resume,
    placementReadinessIndex
  } = data;

  return await db.profile.upsert({
    where: { userId },
    create: {
      userId,
      fullName: fullName || 'New Candidate',
      email,
      phone,
      college,
      branch: branch || department,
      department: department || branch,
      graduationYear: graduationYear ? Number(graduationYear) : null,
      registerNumber,
      skills,
      bio,
      github,
      linkedin,
      portfolio,
      profilePhoto,
      resume,
      placementReadinessIndex: placementReadinessIndex ? Number(placementReadinessIndex) : 70
    },
    update: {
      fullName,
      email,
      phone,
      college,
      branch: branch || department,
      department: department || branch,
      graduationYear: graduationYear ? Number(graduationYear) : null,
      registerNumber,
      skills,
      bio,
      github,
      linkedin,
      portfolio,
      profilePhoto,
      resume,
      placementReadinessIndex: placementReadinessIndex ? Number(placementReadinessIndex) : undefined
    }
  });
}
