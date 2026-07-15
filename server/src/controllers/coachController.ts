import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as coachService from '../services/coachService';

export async function chat(req: AuthenticatedRequest, res: Response) {
  try {
    const { message, history } = req.body;
    const reply = await coachService.getCoachResponse(message, history || []);
    res.json({ status: 'success', reply });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
