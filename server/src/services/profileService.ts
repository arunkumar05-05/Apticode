import { db } from '../prisma/db';

export function formatHumanName(rawName?: string, email?: string): string {
  let name = rawName?.trim();
  if (name && name !== 'New Candidate' && name !== 'Candidate' && !name.includes('@')) {
    return name;
  }
  if (email) {
    const handle = email.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  return 'Candidate';
}

export async function getUserProfile(userId: string) {
  let profile = await db.profile.findUnique({
    where: { userId }
  });
  const user = await db.user.findUnique({ where: { id: userId } });

  const formattedName = formatHumanName(profile?.fullName || user?.fullName, user?.email);

  if (!profile) {
    if (user) {
      profile = await db.profile.create({
        data: {
          userId,
          fullName: formattedName,
          email: user.email,
          college: 'Mailam Engineering College',
          branch: 'Information Technology',
          graduationYear: 2026
        }
      });
    } else {
      return {
        id: userId,
        userId,
        fullName: formattedName,
        email: 'student@college.edu',
        college: 'Mailam Engineering College',
        branch: 'Information Technology',
        graduationYear: 2026,
        placementReadinessIndex: 70
      };
    }
  }

  return {
    ...profile,
    fullName: formattedName
  };
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

  const targetName = fullName ? formatHumanName(fullName, email) : undefined;

  try {
    const updateData: any = { isOnboarded: true };
    if (targetName) updateData.fullName = targetName;
    await db.user.update({
      where: { id: userId },
      data: updateData
    });
  } catch (e) {
    // ignore
  }

  return await db.profile.upsert({
    where: { userId },
    create: {
      userId,
      fullName: targetName || 'New Candidate',
      email,
      phone,
      college,
      branch: branch || department,
      graduationYear: graduationYear ? Number(graduationYear) : 2026,
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
      fullName: targetName,
      email,
      phone,
      college,
      branch: branch || department,
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
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
