/**
 * Structured logger (pino).
 *
 * - Development: pretty (pino-pretty, colors) + level debug.
 * - Production/Staging: compact JSON lines for log shippers.
 *
 * All other modules import `logger` from here — no direct console.* logging.
 */
import pino from 'pino';

type Logger = pino.Logger;

// Sensitive values redacted from every log line automatically (pino redact).
// Never log Authorization headers, cookies, tokens, or passwords.
const SENSITIVE_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.password',
  'passwordHash',
  'req.body.password',
  'req.body.passwordHash',
];

let _logger: Logger | null = null;

const isDev = process.env.NODE_ENV === 'development';

function prettyAvailable(): boolean {
  try { require.resolve('pino-pretty'); return true; } catch { return false; }
}

export function getLogger(): Logger {
  if (_logger) return _logger;

  const base: pino.LoggerOptions = {
    level: isDev ? 'debug' : 'info',
    base: { pid: process.pid, host: require('os').hostname() },
  };

  if (isDev && prettyAvailable()) {
    // Only pretty-print in dev when the optional dep is installed.
    _logger = pino(
      { ...base, level: 'debug', redact: SENSITIVE_PATHS },
      pino.transport({ target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } })
    );
  } else {
    // JSON lines in staging/prod — redact sensitive paths.
    _logger = pino({ ...base, level: isDev ? 'debug' : 'info', messageKey: 'msg', redact: SENSITIVE_PATHS });
  }
  return _logger;
}

export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop) {
    const l = getLogger();
    const val = (l as any)[prop];
    return typeof val === 'function' ? val.bind(l) : val;
  },
});

export type { Logger };
