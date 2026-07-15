import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as analyticsService from '../services/analyticsService';

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const analytics = await analyticsService.getAnalyticsData(userId);
    res.json({ status: 'success', analytics });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
