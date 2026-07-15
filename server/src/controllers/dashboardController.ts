import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as dashboardService from '../services/dashboardService';

export async function getDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const stats = await dashboardService.getDashboardData(userId);
    res.json({ status: 'success', stats });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
