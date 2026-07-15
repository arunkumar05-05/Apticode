import { db } from '../prisma/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-apticode-token-decryption-key';

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
            college: 'AptiCode College',
            branch: 'Computer Science',
            graduationYear: 2026
          }
        }
      },
      include: { profile: true }
    });
  } else {
    if (!user.firebaseUid || !user.authProvider) {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: uid,
          authProvider: 'firebase-email',
          fullName: user.fullName || name
        },
        include: { profile: true }
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
