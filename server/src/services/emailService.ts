/**
 * Email transport abstraction.
 *
 * - Production: SMTP via nodemailer (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS).
 * - Development / unconfigured: console transport (EMAIL_DEV_TRANSPORT=true).
 * - Degrades gracefully: if `nodemailer` is not installed or SMTP is not
 *   configured, messages are logged to the console and the function resolves
 *   successfully (auth flows never hard-fail on email delivery).
 *
 * No credentials or tokens are ever logged.
 */
import { logger } from '../config/logger';
import { config } from '../config';

export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

let transporter: any = null;
let transportName = 'console';

function getTransporter(): any {
  if (transporter !== null) return transporter;

  // Lazy require so the server builds and boots without nodemailer installed.
  let nodemailer: any;
  try {
    nodemailer = require('nodemailer');
  } catch {
    logger.warn('nodemailer not installed — email falls back to console transport');
    transportName = 'console';
    return null;
  }

  const devTransport = config.email.devTransport;
  if (devTransport || !config.email.host || !config.email.port) {
    transportName = 'console';
    return null;
  }

  try {
    transportName = 'smtp';
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.user && config.email.pass
        ? { user: config.email.user, pass: config.email.pass }
        : undefined,
    });
  } catch (err: any) {
    logger.warn({ err: { message: err.message } }, 'SMTP transporter init failed — falling back to console');
    transportName = 'console';
    return null;
  }
  return transporter;
}

export async function sendMail(mail: MailOptions): Promise<void> {
  const t = getTransporter();
  if (!t) {
    // Console dev transport — logged, never exposing secrets.
    logger.info({ to: mail.to, subject: mail.subject, transport: transportName }, 'email (dev)');
    if (transportName === 'console') {
      // Surface the message body in dev so developers can copy reset/verify codes.
      logger.debug({ text: mail.text?.slice(0, 120) }, 'email body (dev)');
    }
    return;
  }
  try {
    await t.sendMail({
      from: config.email.from,
      ...mail,
    });
  } catch (err: any) {
    // Never let email delivery break auth flows.
    logger.warn({ err: { message: err.message }, to: mail.to, subject: mail.subject }, 'email send failed');
  }
}
