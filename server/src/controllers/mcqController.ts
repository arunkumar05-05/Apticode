import { Request, Response } from 'express';
import * as mcqService from '../services/mcqService';

export async function create(req: Request, res: Response) {
  try {
    const data = req.body;
    const mcq = await mcqService.createMcq(data);
    res.status(201).json({ status: 'success', data: mcq });
  } catch (err: any) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const topicId = req.query.topic as string | undefined;
    const mcqs = await mcqService.listMcqs(topicId);
    res.json({ status: 'success', data: mcqs });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await mcqService.deleteMcq(id);
    res.json({ status: 'success' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function generate(req: Request, res: Response) {
  try {
    const data = req.body;
    const mcqs = await mcqService.generateQuestions(data);
    res.json({ status: 'success', data: mcqs });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}