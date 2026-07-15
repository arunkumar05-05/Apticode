import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as aptitudeService from '../services/aptitudeService';

export async function getTopics(req: AuthenticatedRequest, res: Response) {
  try {
    const topics = await aptitudeService.getTopics();
    res.json({ status: 'success', topics });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function saveAttempt(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const attempt = await aptitudeService.saveAptitudeAttempt(userId, req.body);
    res.json({ status: 'success', attempt });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const history = await aptitudeService.getUserAptitudeHistory(userId);
    res.json({ status: 'success', history });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
