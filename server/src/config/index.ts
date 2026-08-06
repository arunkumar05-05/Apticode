/**
 * Centralized, environment-driven configuration for AptiCode.
 *
 * One source of truth for every configurable value. All new features read
 * from here; nothing else reads process.env directly. Validated eagerly on
 * load so a misspelled env var fails fast at boot in every environment.
 *
 * Environments: development | staging | production (NODE_ENV / APP_ENV).
 */
import { z } from 'zod';
import { version as appVersion } from '../../package.json';

// Re-export the structured logger from this barrel for a single import site.
export { logger, getLogger } from './logger';
export type { Logger } from './logger';

const toBool = (v: unknown) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['1', 'true', 'yes'].includes(v.toLowerCase());
  return Boolean(v);
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production']).optional(),
  PORT: z.coerce.number().int().positive().default(5001),
  HOST: z.string().default('0.0.0.0'),

  // Database: PostgreSQL in prod, SQLite in dev. Fallback chain stays in db.ts.
  DATABASE_URL: z.string().optional(),

  // Redis cache (Upstash in prod; local docker for dev). Optional.
  REDIS_URL: z.string().url().optional(),
  // Upstash-specific fields
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
  REDIS_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  // Phase 5 — BullMQ connection (force TLS even on plain redis:// URLs)
  REDIS_TLS: z.preprocess(toBool, z.boolean()).default(false),
  BULLMQ_PREFIX: z.string().default('bull'),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('apticode-server'),
  JWT_AUDIENCE: z.string().default('apticode-client'),
  JWT_VERSION: z.coerce.number().int().positive().default(1),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(14).default(10),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCKOUT_BASE_SECONDS: z.coerce.number().int().positive().default(30),
  LOGIN_LOCKOUT_MAX_SECONDS: z.coerce.number().int().positive().default(600),

  // AI provider (OpenAI-compatible; vsllm by default). Optional until AI is used.
  AI_API_KEY: z.string().optional(),
  AI_API_URL: z.string().url().default('https://vsllm.com/v1'),
  AI_MODEL: z.string().default('glm-4.7-flash-free'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  // Gemini fallback (must be a real key, not the "your_key" placeholder).
  GEMINI_API_KEY: z.string().optional(),

  // Email (Nodemailer + SMTP). Dev uses console transport.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.preprocess(toBool, z.boolean()).default(true),
  EMAIL_FROM: z.string().email().default('no-reply@apticode.com'),
  EMAIL_DEV_TRANSPORT: z.preprocess(toBool, z.boolean()).default(true),

  // Cloudinary (profile images, resumes, future uploads)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().url().optional(),

  // Server tuning
  TRUST_PROXY: z.preprocess(toBool, z.boolean()).default(false),
  BODY_LIMIT: z.string().default('1mb'),
  REQUEST_ID_HEADER: z.string().default('x-request-id'),
  ENABLE_REQUEST_LOGGING: z.preprocess(toBool, z.boolean()).default(true),

  // ---------------------------------------------------------------- *
  // Phase 5 — Judge0 code-execution provider
  // ---------------------------------------------------------------- *
  JUDGE0_API_URL: z.string().default(''),
  JUDGE0_API_TOKEN: z.string().optional(),
  JUDGE0_AUTH_TOKEN: z.string().optional(), // legacy alias
  JUDGE0_AUTH_TYPE: z.enum(['header', 'bearer', 'none']).default('header'),
  JUDGE0_AUTH_HEADER: z.string().default('X-Auth-Token'),
  JUDGE0_API_VERSION: z.enum(['ce', 'extra', 'self']).default('ce'),
  JUDGE0_FETCH_LANGUAGES: z.preprocess(toBool, z.boolean()).default(false),
  JUDGE0_LANGUAGES_CACHE_TTL_MS: z.coerce.number().int().positive().default(3_600_000),
  JUDGE0_WAIT_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  JUDGE0_POLL_MODE: z.preprocess(toBool, z.boolean()).default(false),
  JUDGE0_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1_000),
  JUDGE0_POLL_MAX_ATTEMPTS: z.coerce.number().int().positive().default(60),
  JUDGE0_CONCURRENCY: z.coerce.number().int().positive().default(3),
  JUDGE0_MAX_TESTCASES_PER_JOB: z.coerce.number().int().positive().default(32),
  JUDGE0_MAX_CPU_SECONDS: z.coerce.number().int().positive().default(15),
  JUDGE0_MAX_MEMORY_KB: z.coerce.number().int().positive().default(512_000),
  JUDGE0_PROVIDER_OVERRIDE: z.string().optional(),

  // ---------------------------------------------------------------- *
  // Phase 5 — queue pipeline
  // ---------------------------------------------------------------- *
  QUEUE_SUBMISSION_ATTEMPTS: z.coerce.number().int().positive().default(3),
  QUEUE_SUBMISSION_BACKOFF_MS: z.coerce.number().int().positive().default(2_000),
  QUEUE_RESULT_ATTEMPTS: z.coerce.number().int().positive().default(5),
  QUEUE_JOB_MAX_DURATION_MS: z.coerce.number().int().positive().default(300_000),
  CODE_MAX_BYTES: z.coerce.number().int().positive().default(65_536),
  WORKER_HEARTBEAT_INTERVAL_MS: z.coerce.number().int().positive().default(10_000),
  WORKER_HEARTBEAT_TTL_MS: z.coerce.number().int().positive().default(30_000),
  CODE_XP_REWARD_SUBMISSION: z.coerce.number().int().positive().default(250),
});

type Env = z.infer<typeof envSchema>;

let parsed: Env | null = null;

export function loadConfig(): Env {
  if (parsed) return parsed; // cached singleton
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`[config] environment validation failed:\n${issues}`);
  }
  parsed = result.data;
  // Resolve APP_ENV precedence over NODE_ENV.
  if (parsed.APP_ENV) {
    (parsed as any).NODE_ENV = parsed.APP_ENV;
  }
  return parsed;
}

// Convenience booleans used throughout the app.
let _cfg: Env | null = null;
function cfg() {
  _cfg ??= loadConfig();
  return _cfg;
}

export const config = {
  get env() { return cfg().NODE_ENV; },
  get isProd() { return cfg().NODE_ENV === 'production'; },
  get isStaging() { return cfg().NODE_ENV === 'staging'; },
  get isDev() { return cfg().NODE_ENV === 'development'; },
  get port() { return cfg().PORT; },
  get host() { return cfg().HOST; },
  get db() {
    const c = cfg();
    return {
      url: c.DATABASE_URL,
      // When true, db.ts forces SQLite (dev); when false, prefers PG (prod).
      preferSQLite: c.NODE_ENV === 'development' || (!c.DATABASE_URL ? true : false),
    };
  },
  get redis() {
    const c = cfg();
    const url = c.UPSTASH_REDIS_REST_URL || c.REDIS_URL;
    return { url, ttlSeconds: c.REDIS_TTL_SECONDS, token: c.UPSTASH_REDIS_TOKEN, tls: c.REDIS_TLS, bullmqPrefix: c.BULLMQ_PREFIX };
  },
  get judge0() {
    const c = cfg();
    const token = c.JUDGE0_API_TOKEN || c.JUDGE0_AUTH_TOKEN || '';
    const unconfigured = !c.JUDGE0_API_URL || /your_url/i.test(c.JUDGE0_API_URL) || !token || /your_key/i.test(token);
    return {
      apiUrl: c.JUDGE0_API_URL,
      apiToken: token,
      authType: c.JUDGE0_AUTH_TYPE,
      authHeader: c.JUDGE0_AUTH_HEADER,
      apiVersion: c.JUDGE0_API_VERSION,
      fetchLanguages: c.JUDGE0_FETCH_LANGUAGES,
      languagesCacheTtlMs: c.JUDGE0_LANGUAGES_CACHE_TTL_MS,
      waitTimeoutMs: c.JUDGE0_WAIT_TIMEOUT_MS,
      pollMode: c.JUDGE0_POLL_MODE,
      pollIntervalMs: c.JUDGE0_POLL_INTERVAL_MS,
      pollMaxAttempts: c.JUDGE0_POLL_MAX_ATTEMPTS,
      concurrency: c.JUDGE0_CONCURRENCY,
      maxTestcasesPerJob: c.JUDGE0_MAX_TESTCASES_PER_JOB,
      maxCpuSeconds: c.JUDGE0_MAX_CPU_SECONDS,
      maxMemoryKb: c.JUDGE0_MAX_MEMORY_KB,
      providerOverride: c.JUDGE0_PROVIDER_OVERRIDE,
      enabled: !unconfigured,
    };
  },
  get queue() {
    const c = cfg();
    return {
      prefix: c.BULLMQ_PREFIX,
      submissionAttempts: c.QUEUE_SUBMISSION_ATTEMPTS,
      submissionBackoffMs: c.QUEUE_SUBMISSION_BACKOFF_MS,
      resultAttempts: c.QUEUE_RESULT_ATTEMPTS,
      jobMaxDurationMs: c.QUEUE_JOB_MAX_DURATION_MS,
      codeMaxBytes: c.CODE_MAX_BYTES,
    };
  },
  get worker() {
    const c = cfg();
    return {
      heartbeatIntervalMs: c.WORKER_HEARTBEAT_INTERVAL_MS,
      heartbeatTtlMs: c.WORKER_HEARTBEAT_TTL_MS,
    };
  },
  get code() {
    const c = cfg();
    return {
      xpRewardSubmission: c.CODE_XP_REWARD_SUBMISSION,
    };
  },
  get ai() {
    const c = cfg();
    return {
      apiKey: c.AI_API_KEY,
      apiUrl: c.AI_API_URL,
      model: c.AI_MODEL,
      timeoutMs: c.AI_TIMEOUT_MS,
      geminiKey: c.GEMINI_API_KEY,
      enabled: Boolean(c.AI_API_KEY && c.AI_API_KEY !== 'your_key') || Boolean(c.GEMINI_API_KEY && c.GEMINI_API_KEY !== 'your_key'),
    };
  },
  get email() {
    const c = cfg();
    return {
      host: c.SMTP_HOST,
      port: c.SMTP_PORT,
      user: c.SMTP_USER,
      pass: c.SMTP_PASS,
      secure: c.SMTP_SECURE,
      from: c.EMAIL_FROM,
      devTransport: c.EMAIL_DEV_TRANSPORT,
    };
  },
  get cloudinary() {
    const c = cfg();
    return {
      cloudName: c.CLOUDINARY_CLOUD_NAME,
      apiKey: c.CLOUDINARY_API_KEY,
      apiSecret: c.CLOUDINARY_API_SECRET,
      url: c.CLOUDINARY_URL,
    };
  },
  get security() {
    const c = cfg();
    return ({
      trustProxy: c.TRUST_PROXY,
      bodyLimit: c.BODY_LIMIT,
      requestIdHeader: c.REQUEST_ID_HEADER,
      requestLogging: c.ENABLE_REQUEST_LOGGING,
    });
  },
  get appVersion() { return appVersion; },
  get auth() {
    const c = cfg();
    return {
      jwtSecret: c.JWT_SECRET,
      jwtIssuer: c.JWT_ISSUER,
      jwtAudience: c.JWT_AUDIENCE,
      jwtVersion: c.JWT_VERSION,
      accessExpiresIn: c.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: c.JWT_REFRESH_EXPIRES_IN,
      bcryptSaltRounds: c.BCRYPT_SALT_ROUNDS,
      loginMaxAttempts: c.LOGIN_MAX_ATTEMPTS,
      loginLockoutBaseSec: c.LOGIN_LOCKOUT_BASE_SECONDS,
      loginLockoutMaxSec: c.LOGIN_LOCKOUT_MAX_SECONDS,
    };
  },
};

export type AppConfig = typeof config;
