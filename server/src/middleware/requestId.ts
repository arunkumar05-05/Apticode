/**
 * Request ID middleware.
 *
 * Ensures every request has a stable `x-request-id` (propagated if a client
 * sends one, generated with `crypto.randomUUID()` otherwise), exposed on
 * `req.id` for log correlation.
 */
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { config } from '../config';

export function requestId() {
  const headerName = config.security.requestIdHeader;
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.header(headerName);
    const id = (typeof incoming === 'string' && incoming.length > 0) ? incoming : randomUUID();
    // @ts-ignore — augmenting req with the request id
    req.id = id;
    res.setHeader(headerName, id);
    next();
  };
}
