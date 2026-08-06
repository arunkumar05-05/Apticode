/**
 * Phase 5 — coding API request validation (zod).
 *
 * submitCodeSchema requires exactly one of problemId / problemTitle and a
 * code payload within the configured byte budget. getSubmissionParamsSchema
 * accepts uuid-ish ids (letters, digits, dashes) to keep 404s clean.
 */
import { z } from 'zod';
import { config } from '../config';
import { isSupportedLanguage } from '../integrations/judge0/languageMap';

export const submitCodeSchema = z
  .object({
    problemId: z.string().min(1).optional(),
    problemTitle: z.string().min(1).optional(),
    code: z
      .string()
      .min(1)
      .max(65_536)
      .refine((code) => Buffer.byteLength(code, 'utf8') <= config.queue.codeMaxBytes, {
        message: `Code exceeds the ${config.queue.codeMaxBytes}-byte limit`,
      }),
    language: z.string().refine(isSupportedLanguage, { message: 'Unsupported programming language' }),
  })
  .refine((d) => Boolean(d.problemId) !== Boolean(d.problemTitle), {
    message: 'Provide exactly one of problemId or problemTitle',
    path: ['problemId'],
  });

export const getSubmissionParamsSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .refine((v) => /^[a-zA-Z0-9-]+$/.test(v), { message: 'Invalid submission id' }),
});
