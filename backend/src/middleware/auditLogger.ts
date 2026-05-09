import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

interface AuditEntry {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  query: Record<string, unknown>;
  statusCode: number;
  durationMs: number;
  actor: string | null;
  actorId: string | null;
  tenantId: string | null;
  ipAddress: string;
  userAgent: string;
  action: string;
  severity: 'info' | 'warn' | 'error';
}

const SKIP_PATHS = new Set(['/health', '/favicon.ico']);

function resolveIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

function deriveAction(method: string, path: string): string {
  const resource = path.replace(/^\/api\//, '').split('/')[0] ?? 'unknown';
  const map: Record<string, string> = {
    GET: `read:${resource}`,
    POST: `create:${resource}`,
    PATCH: `update:${resource}`,
    PUT: `replace:${resource}`,
    DELETE: `delete:${resource}`,
  };
  return map[method.toUpperCase()] ?? `${method.toLowerCase()}:${resource}`;
}

async function persist(entry: AuditEntry): Promise<void> {
  // ── Production: replace with your database write, e.g. ──────────
  // await db.collection('audit_logs').insertOne(entry);
  // await elasticClient.index({ index: 'audit', document: entry });
  // ────────────────────────────────────────────────────────────────
  const icon =
    entry.severity === 'error' ? '🔴' :
    entry.severity === 'warn'  ? '🟡' : '🟢';

  console.log(
    `${icon} [AUDIT] ${entry.timestamp} | ${entry.actor ?? 'anon'} | ` +
    `${entry.method} ${entry.path} → ${entry.statusCode} (${entry.durationMs}ms)`,
  );
}

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_PATHS.has(req.path)) return next();

  const requestId = randomUUID();
  const startedAt = Date.now();

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const entry: AuditEntry = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query as Record<string, unknown>,
      statusCode,
      durationMs: Date.now() - startedAt,
      actor: req.user?.email ?? null,
      actorId: req.user?.oid ?? null,
      tenantId: req.user?.tenantId ?? null,
      ipAddress: resolveIp(req),
      userAgent: req.get('user-agent') ?? 'unknown',
      action: deriveAction(req.method, req.path),
      severity: statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info',
    };

    persist(entry).catch(console.error);
  });

  next();
}
