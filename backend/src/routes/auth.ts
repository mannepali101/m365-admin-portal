import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { buildAuthUrl, exchangeCode, revokeTokens } from '../services/msalService.js';
import { validateToken } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../utils/AppError.js';

const router = Router();

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    authenticated?: boolean;
    userId?: string;
  }
}

// ──────────────────────────────────────────────────────────────────
// GET /api/auth/login
// Returns the Entra ID authorization URL.
// Frontend redirects the user to this URL.
// ──────────────────────────────────────────────────────────────────
router.get(
  '/login',
  asyncHandler(async (req, res) => {
    const state = randomBytes(32).toString('hex');
    req.session.oauthState = state;

    const authUrl = await buildAuthUrl(state);
    res.json({ success: true, authUrl });
  }),
);

// ──────────────────────────────────────────────────────────────────
// POST /api/auth/callback
// Receives the authorization code from the frontend redirect.
// Exchanges code for tokens and establishes a server-side session.
// ──────────────────────────────────────────────────────────────────
router.post(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, state } = z
      .object({
        code: z.string().min(1, 'Authorization code is required'),
        state: z.string().min(1, 'State is required'),
      })
      .parse(req.body);

    // CSRF guard
    if (!req.session.oauthState || state !== req.session.oauthState) {
      throw new AppError('Invalid OAuth state — possible CSRF attack.', 400, 'INVALID_STATE');
    }

    delete req.session.oauthState;

    const tokens = await exchangeCode(code, req.session.id);

    // Persist minimal session state (token payload lives in tokenStore)
    req.session.authenticated = true;
    req.session.userId = (tokens.account as any).homeAccountId ?? '';

    const account = tokens.account as any;
    res.json({
      success: true,
      user: {
        name: account.name ?? account.username ?? '',
        email: account.username ?? '',
        tenantId: tokens.tenantId,
      },
    });
  }),
);

// ──────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Returns the currently authenticated user's profile.
// ──────────────────────────────────────────────────────────────────
router.get(
  '/me',
  validateToken,
  (req, res) => {
    res.json({
      success: true,
      user: {
        oid: req.user!.oid,
        name: req.user!.name,
        email: req.user!.email,
        tenantId: req.user!.tenantId,
        roles: req.user!.roles,
      },
    });
  },
);

// ──────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Revokes server-side tokens and destroys the session.
// ──────────────────────────────────────────────────────────────────
router.post(
  '/logout',
  validateToken,
  asyncHandler(async (req, res) => {
    const sessionId = req.session.id;
    revokeTokens(sessionId);

    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });

    res.clearCookie('m365admin.sid');
    res.json({ success: true, message: 'Logged out successfully.' });
  }),
);

// ──────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Proactively refreshes the access token.
// Frontend can call this every ~45 min to keep session alive.
// ──────────────────────────────────────────────────────────────────
router.post(
  '/refresh',
  validateToken,
  (_req, res) => {
    res.json({ success: true, message: 'Token refreshed.' });
  },
);

export default router;
