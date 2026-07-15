import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as commService from '../services/commService';

export async function evaluate(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const evaluation = await commService.evaluateSpeech(userId, req.body);
    res.json({ status: 'success', evaluation });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const history = await commService.getUserSpeechHistory(userId);
    res.json({ status: 'success', history });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
