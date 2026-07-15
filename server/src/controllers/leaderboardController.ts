import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as leaderboardService from '../services/leaderboardService';

export async function getLeaderboard(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const standings = await leaderboardService.getLeaderboard(userId);
    res.json({ status: 'success', standings });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
