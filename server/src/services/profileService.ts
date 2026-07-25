import { db } from '../prisma/db';

export function formatHumanName(rawName?: string, email?: string): string {
  let name = rawName?.trim();
  if (!name || name === 'New Candidate' || name.includes('@')) {
    if (email) {
      name = email.split('@')[0];
    }
  }

  if (!name) return 'Candidate';

  let cleaned = name.replace(/^[0-9]{2}(it|cs|cse|ece|eee|mech|civil|ai|ds)?/i, '');
  if (!cleaned) cleaned = name;

  cleaned = cleaned.replace(/[._-]/g, ' ');
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const formatted = words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    if (formatted.length >= 2) return formatted;
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
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

  if (targetName) {
    try {
      await db.user.update({
        where: { id: userId },
        data: { fullName: targetName }
      });
    } catch (e) {
      // ignore
    }
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
