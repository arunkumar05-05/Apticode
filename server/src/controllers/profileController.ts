import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as profileService from '../services/profileService';
import { profileUpdateSchema } from '../validators/profile';

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
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid profile payload',
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    const userId = req.user!.userId;
    const profile = await profileService.updateUserProfile(userId, parsed.data);
    res.json({ status: 'success', profile });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
