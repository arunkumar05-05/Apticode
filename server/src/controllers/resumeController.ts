import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as resumeService from '../services/resumeService';

export async function getResume(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const data = await resumeService.getUserResume(userId);
    res.json({ status: 'success', ...data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function saveResume(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const resume = await resumeService.saveUserResume(userId, req.body);
    res.json({ status: 'success', resume });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function audit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const report = await resumeService.auditResume(userId, req.body);
    res.json({ status: 'success', ...report });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
