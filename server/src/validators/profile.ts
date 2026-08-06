/**
 * Profile update request validation (zod).
 *
 * profileUpdateSchema enforces the onboarding contract: every required field
 * must be present and non-empty, while optional link fields accept '' as
 * absent. `email` is validated-optional (the service persists it on the
 * Profile row) and unknown keys are stripped, not rejected.
 */
import { z } from 'zod';

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.preprocess(emptyToUndefined, z.string().email().optional()),
  phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  college: z.string().trim().min(2),
  branch: z.string().trim().min(2),
  department: z.preprocess(emptyToUndefined, z.string().trim().min(2).optional()),
  graduationYear: z.coerce.number().int().min(1950).max(2035),
  registerNumber: z.string().trim().regex(/^[A-Za-z0-9]{3,32}$/, 'Invalid register number'),
  skills: z.string().trim().min(2),
  bio: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  github: z.preprocess(emptyToUndefined, z.string().url().optional()),
  linkedin: z.preprocess(emptyToUndefined, z.string().url().optional()),
  portfolio: z.preprocess(emptyToUndefined, z.string().url().optional()),
  profilePhoto: z.preprocess(emptyToUndefined, z.string().url().optional()),
  resume: z.preprocess(emptyToUndefined, z.string().url().optional()),
  placementReadinessIndex: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(100).optional())
});
