import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          status: 'fail',
          message: 'Validation failed',
          errors: err.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
}

export const schemas = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(1),
    role: z.string().optional()
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }),
  mcqCreate: z.object({
    topicId: z.string().optional(),
    topic: z.string().optional(),
    questionText: z.string().min(1),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional()
  }),
  codingChallengeCreate: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    timeLimitMs: z.number().int().positive().optional(),
    memoryLimitKb: z.number().int().positive().optional(),
    testcases: z.array(z.object({
      inputData: z.string(),
      expectedOutput: z.string(),
      isHidden: z.boolean().optional()
    })).optional()
  }),
  codingSubmit: z.object({
    problemId: z.string().optional(),
    problemTitle: z.string().optional(),
    code: z.string().min(1),
    language: z.string().optional()
  }),
  interviewStart: z.object({
    interviewType: z.enum(['HR', 'TECHNICAL', 'CODING', 'BEHAVIORAL']),
    topic: z.string().optional()
  }),
  interviewSubmit: z.object({
    interviewId: z.string(),
    answers: z.array(z.object({
      questionId: z.string(),
      answer: z.string()
    }))
  }),
  resumeSave: z.object({
    versionName: z.string().min(1),
    contentJson: z.string()
  }),
  resumeAudit: z.object({
    resumeId: z.string().optional(),
    contentJson: z.string().optional()
  }),
  commEval: z.object({
    sessionType: z.string(),
    transcript: z.string().min(1)
  }),
  refreshToken: z.object({
    refreshToken: z.string().min(1)
  })
};