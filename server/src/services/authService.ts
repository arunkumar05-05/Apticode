import { db } from '../prisma/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-apticode-token-decryption-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET;

export async function registerUser(email: string, passwordHash: string | null, fullName: string, role: string) {
  // Create user
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
      authProvider: 'local-password',
      profile: {
        create: {
          fullName,
          email,
          college: 'AptiCode College',
          branch: 'Computer Science',
          graduationYear: 2026
        }
      }
    }
  });
  return user;
}

export async function findUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email },
    include: { profile: true }
  });
}

export async function findUserByUid(uid: string) {
  return await db.user.findUnique({
    where: { firebaseUid: uid },
    include: { profile: true }
  });
}

export async function createOrUpdateFirebaseUser(uid: string, email: string, name: string, role: string) {
  let user = await db.user.findFirst({
    where: {
      OR: [
        { email },
        { firebaseUid: uid }
      ]
    },
    include: { profile: true }
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        firebaseUid: uid,
        authProvider: 'firebase-email',
        fullName: name,
        role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
        profile: {
          create: {
            fullName: name,
            email,
            college: 'Mailam Engineering College',
            branch: 'Information Technology',
            graduationYear: 2026
          }
        }
      },
      include: { profile: true }
    });
  } else {
    const isNewNameProvided = name && name !== email.split('@')[0];
    const finalName = isNewNameProvided ? name : (user.fullName || name);

    user = await db.user.update({
      where: { id: user.id },
      data: {
        firebaseUid: uid,
        authProvider: 'firebase-email',
        fullName: finalName
      },
      include: { profile: true }
    });

    if (user.profile) {
      await db.profile.update({
        where: { id: user.profile.id },
        data: { fullName: finalName }
      });
    }
  }

  return user;
}

export function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateRefreshToken(user: { id: string }) {
  const token = randomBytes(64).toString('hex');
  return token;
}

export async function saveRefreshToken(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  return await db.refreshToken.create({
    data: { userId, token, expiresAt }
  });
}

export async function verifyRefreshToken(token: string) {
  const stored = await db.refreshToken.findUnique({ where: { token } });
  if (!stored) return null;
  if (stored.expiresAt < new Date()) {
    await db.refreshToken.delete({ where: { token } });
    return null;
  }
  return stored;
}

export async function revokeRefreshToken(token: string) {
  try {
    return await db.refreshToken.delete({ where: { token } });
  } catch {
    return null;
  }
}

export async function revokeAllUserTokens(userId: string) {
  return await db.refreshToken.deleteMany({ where: { userId } });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}
