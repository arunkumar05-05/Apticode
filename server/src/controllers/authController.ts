import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as authService from '../services/authService';

let firebaseAdmin: any = null;
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    const fs = require('fs');
    if (fs.existsSync(serviceAccountPath)) {
      const admin = require('firebase-admin');
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseAdmin = admin;
      console.log('[Firebase Admin] Init success.');
    }
  }
} catch (err: any) {
  console.warn('[Firebase Admin] Init failed/skipped:', err.message);
}

export async function firebaseVerify(req: Request, res: Response) {
  const { idToken, role } = req.body;
  if (!idToken) {
    return res.status(400).json({ status: 'fail', message: 'Missing Firebase ID token.' });
  }

  try {
    let email = req.body.email || '';
    let name = req.body.fullName || email.split('@')[0] || 'Rahul Sharma';
    let firebaseUid = 'sandbox-uid-' + Date.now();

    if (firebaseAdmin) {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      firebaseUid = decodedToken.uid;
      email = decodedToken.email || email;
      name = decodedToken.name || email.split('@')[0];
    }

    const user = await authService.createOrUpdateFirebaseUser(firebaseUid, email, name, role);
    const token = authService.generateToken(user);

    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.fullName || user.email.split('@')[0],
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('[Auth Controller] Firebase verify error:', err);
    res.status(500).json({ status: 'fail', message: err.message || 'Firebase token verification failed.' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ status: 'fail', message: 'Email and password are required.' });
  }

  try {
    // Sandbox defaults validation
    const defaultStudent = email === 'student@college.edu' && password === 'StudentPassword2026!';
    const defaultAdmin = email === 'admin@college.edu' && password === 'AdminPassword2026!';

    let user = await authService.findUserByEmail(email);

    if (!user && (defaultStudent || defaultAdmin)) {
      // Auto-create sandbox profiles in DB to ensure proper relational bindings
      const defaultName = defaultStudent ? 'Rahul Sharma' : 'Prof. Shastri';
      const defaultRole = defaultStudent ? 'STUDENT' : 'ADMIN';
      const hash = await bcrypt.hash(password, 10);
      user = await authService.registerUser(email, hash, defaultName, defaultRole);
    }

    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'Invalid email or password.' });
    }

    if (user.passwordHash) {
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ status: 'fail', message: 'Invalid email or password.' });
      }
    }

    const token = authService.generateToken(user);
    res.json({
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.fullName || user.email.split('@')[0],
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, fullName, role } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ status: 'fail', message: 'All fields are required.' });
  }

  try {
    const existing = await authService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ status: 'fail', message: 'Email is already registered.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await authService.registerUser(email, hash, fullName, role);
    const token = authService.generateToken(user);

    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
