import 'isomorphic-fetch';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { auditLogger } from './middleware/auditLogger.js';
import { validateToken } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();

// ──────────────────────────────────────────────────────────────────
// 1. Security headers
// ──────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://graph.microsoft.com', 'https://login.microsoftonline.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// ──────────────────────────────────────────────────────────────────
// 2. CORS — only allow the configured frontend origin
// ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,                     // required for session cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ──────────────────────────────────────────────────────────────────
// 3. Rate limiting
// ──────────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts.' },
});

app.use(globalLimiter);

// ──────────────────────────────────────────────────────────────────
// 4. Body parsers
// ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────────────────────────
// 5. Request logging
// ──────────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ──────────────────────────────────────────────────────────────────
// 6. Session (in-process store for dev; use Redis/connect-redis in prod)
// ──────────────────────────────────────────────────────────────────
app.use(
  session({
    name: 'm365admin.sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === 'production',   // HTTPS only in prod
      httpOnly: true,                          // not accessible via JS
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,             // 8 hours
    },
  }),
);

// ──────────────────────────────────────────────────────────────────
// 7. Audit logging (attaches to res.finish event — must be before routes)
// ──────────────────────────────────────────────────────────────────
app.use(auditLogger);

// ──────────────────────────────────────────────────────────────────
// 8. Health check (no auth required)
// ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'm365-admin-backend',
    version: process.env.npm_package_version ?? '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ──────────────────────────────────────────────────────────────────
// 9. Routes
// ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/dashboard', validateToken, dashboardRouter);

// 404 handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', statusCode: 404 });
});

// ──────────────────────────────────────────────────────────────────
// 10. Global error handler (must be last)
// ──────────────────────────────────────────────────────────────────
app.use(errorHandler);

// ──────────────────────────────────────────────────────────────────
// 11. Start
// ──────────────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`\n🚀 M365 Admin API`);
  console.log(`   ● Environment : ${env.NODE_ENV}`);
  console.log(`   ● Port        : ${PORT}`);
  console.log(`   ● CORS origin : ${env.FRONTEND_URL}`);
  console.log(`   ● Tenant      : ${env.AZURE_TENANT_ID}\n`);
});

export default app;
