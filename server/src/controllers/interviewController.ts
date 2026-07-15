import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as interviewService from '../services/interviewService';

export async function start(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { type, company } = req.body;
    const questions = await interviewService.startInterview(userId, type, company);
    res.json({ status: 'success', questions });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function submit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const report = await interviewService.submitInterview(userId, req.body);
    res.json({ status: 'success', report });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const history = await interviewService.getUserInterviewHistory(userId);
    res.json({ status: 'success', history });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
