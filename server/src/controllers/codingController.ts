import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as codingService from '../services/codingService';

export async function getChallenges(req: AuthenticatedRequest, res: Response) {
  try {
    const challenges = await codingService.getChallenges();
    res.json({ status: 'success', challenges });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function submitCode(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const submission = await codingService.saveCodingSubmission(userId, req.body);
    res.json({ status: 'success', submission });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const history = await codingService.getUserCodingHistory(userId);
    res.json({ status: 'success', history });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
