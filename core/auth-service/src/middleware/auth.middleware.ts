import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, extractActorFromPayload } from '../services/oidc.service';
import { checkPermission } from '../services/rbac.service';
import { logger } from './logger';
import type { AuthContext, TraceContext } from '@autoecops/shared-types';

const BEARER_PREFIX = 'Bearer ';
const TRACE_HEADER = 'x-trace-id';
const SPAN_HEADER = 'x-span-id';
const SESSION_HEADER = 'x-session-id';

declare module 'express-serve-static-core' {
  interface Request {
    authContext?: AuthContext;
    traceContext?: TraceContext;
  }
}

export function traceMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const traceId = (req.headers[TRACE_HEADER] as string) ?? uuidv4();
  const spanId = (req.headers[SPAN_HEADER] as string) ?? uuidv4();
  const sessionId = req.headers[SESSION_HEADER] as string | undefined;

  req.traceContext = {
    traceId,
    spanId,
    sessionId,
  };

  next();
}

export function authMiddleware(requiredPermission?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
      logger.warn(
        { traceId: req.traceContext?.traceId, path: req.path },
        'Missing or malformed Authorization header',
      );
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or malformed Authorization header',
        },
        meta: {
          requestId: uuidv4(),
          traceId: req.traceContext?.traceId ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const token = authHeader.slice(BEARER_PREFIX.length);

    try {
      const payload = await verifyToken(token);
      const actor = extractActorFromPayload(payload);

      req.authContext = {
        actor,
        token,
        trace: req.traceContext!,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
      };

      if (requiredPermission) {
        const verdict = checkPermission(actor, requiredPermission);
        if (verdict === 'deny') {
          logger.warn(
            {
              traceId: req.traceContext?.traceId,
              actorId: actor.id,
              requiredPermission,
            },
            'Permission denied',
          );
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: `Insufficient permissions: requires ${requiredPermission}`,
            },
            meta: {
              requestId: uuidv4(),
              traceId: req.traceContext?.traceId ?? 'unknown',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }
      }

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
      logger.warn(
        { traceId: req.traceContext?.traceId, error: errorMessage },
        'Authentication failed',
      );
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token verification failed',
        },
        meta: {
          requestId: uuidv4(),
          traceId: req.traceContext?.traceId ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}
