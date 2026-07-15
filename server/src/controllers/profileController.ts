import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as profileService from '../services/profileService';

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const profile = await profileService.getUserProfile(userId);
    res.json({ status: 'success', profile });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const profile = await profileService.updateUserProfile(userId, req.body);
    res.json({ status: 'success', profile });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
