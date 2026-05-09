import { Request, Response, NextFunction } from 'express';
import { jwtDecode } from 'jwt-decode';
import { getValidToken } from '../services/msalService.js';
import { AppError } from '../utils/AppError.js';

// -------------------------------------------------------------------
// Extend Express Request with decoded user info
// -------------------------------------------------------------------
export interface AuthenticatedUser {
  /** Entra ID object ID (permanent unique user identifier) */
  oid: string;
  /** User principal name (usually email) */
  email: string;
  /** Display name */
  name: string;
  /** Entra ID tenant ID */
  tenantId: string;
  /** App roles assigned in Entra ID */
  roles: string[];
  /** The session ID used to look up the cached access token */
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      accessToken?: string;
    }
  }
}

interface EntraIdTokenClaims {
  oid: string;
  preferred_username?: string;
  upn?: string;
  name: string;
  tid: string;
  roles?: string[];
  scp?: string;
  exp: number;
  iss: string;
}

// -------------------------------------------------------------------
// validateToken middleware
// Retrieves (and silently refreshes) the access token for this session,
// decodes the JWT claims, and attaches the user to req.user.
// -------------------------------------------------------------------
export async function validateToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sessionId = req.session?.id;

    if (!sessionId || !req.session?.authenticated) {
      throw new AppError('Not authenticated. Please log in.', 401, 'UNAUTHENTICATED');
    }

    const accessToken = await getValidToken(sessionId);
    const claims = jwtDecode<EntraIdTokenClaims>(accessToken);

    req.user = {
      oid: claims.oid,
      email: claims.preferred_username ?? claims.upn ?? '',
      name: claims.name ?? '',
      tenantId: claims.tid,
      roles: claims.roles ?? [],
      sessionId,
    };

    req.accessToken = accessToken;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
  }
}

// -------------------------------------------------------------------
// requireRoles middleware factory
// Usage: router.get('/admin', requireRoles('GlobalAdmin'), handler)
// -------------------------------------------------------------------
export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles ?? [];
    const allowed = roles.some((r) => userRoles.includes(r));

    if (!allowed) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}`,
          403,
          'FORBIDDEN',
        ),
      );
    }

    next();
  };
}
