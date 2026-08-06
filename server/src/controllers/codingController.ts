import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as codingService from '../services/codingService';
import { getSubmissionParamsSchema, submitCodeSchema } from '../validators/coding';

export async function getChallenges(req: AuthenticatedRequest, res: Response) {
  try {
    const challenges = await codingService.getChallenges();
    res.json({ status: 'success', challenges });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function createChallenge(req: AuthenticatedRequest, res: Response) {
  try {
    const data = req.body;
    const challenge = await codingService.createChallenge(data);
    res.status(201).json({ status: 'success', data: challenge });
  } catch (err: any) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

export async function deleteChallenge(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await codingService.deleteChallenge(id);
    res.json({ status: 'success' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function addTestcase(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    const tc = await codingService.addTestcase(id, data);
    res.status(201).json({ status: 'success', data: tc });
  } catch (err: any) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

export async function submitCode(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = submitCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid submission payload',
        errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    const userId = req.user!.userId;
    const submission = await codingService.saveCodingSubmission(userId, parsed.data);
    res.json({ status: 'success', submission });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function getSubmission(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = getSubmissionParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ status: 'fail', message: 'Invalid submission id' });
    }
    const userId = req.user!.userId;
    const role = req.user!.role;
    const submission = await codingService.getSubmissionById(parsed.data.id, userId, role);
    if (!submission) {
      return res.status(404).json({ status: 'fail', message: 'Submission not found' });
    }
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
