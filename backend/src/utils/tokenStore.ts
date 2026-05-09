import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  type BinaryLike,
} from 'crypto';
import { env } from '../config/env.js';

// -------------------------------------------------------------------
// Derive a 32-byte AES key from the ENCRYPTION_KEY env variable
// -------------------------------------------------------------------
function getKey(): Buffer {
  return createHash('sha256')
    .update(env.ENCRYPTION_KEY as BinaryLike)
    .digest();
}

const ALGORITHM = 'aes-256-gcm' as const;

function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Pack: iv(16) + tag(16) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(packed: string): string {
  const buf = Buffer.from(packed, 'base64');
  const iv = buf.subarray(0, 16);
  const tag = buf.subarray(16, 32);
  const ciphertext = buf.subarray(32);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

// -------------------------------------------------------------------
// Token shape stored per session
// -------------------------------------------------------------------
export interface StoredTokens {
  accessToken: string;
  idToken: string;
  expiresOn: string;        // ISO date string
  account: Record<string, unknown>;
  scopes: string[];
  tenantId: string;
}

// -------------------------------------------------------------------
// Simple TTL cache entry
// -------------------------------------------------------------------
interface CacheEntry {
  packed: string;           // encrypted payload
  expiresAt: number;        // epoch ms
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const cache = new Map<string, CacheEntry>();

// Periodically sweep expired entries (every 30 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}, 30 * 60 * 1000).unref();

// -------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------
export const tokenStore = {
  set(sessionId: string, tokens: StoredTokens): void {
    cache.set(`tokens:${sessionId}`, {
      packed: encrypt(JSON.stringify(tokens)),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
  },

  get(sessionId: string): StoredTokens | null {
    const entry = cache.get(`tokens:${sessionId}`);
    if (!entry || entry.expiresAt <= Date.now()) {
      cache.delete(`tokens:${sessionId}`);
      return null;
    }
    try {
      return JSON.parse(decrypt(entry.packed)) as StoredTokens;
    } catch {
      cache.delete(`tokens:${sessionId}`);
      return null;
    }
  },

  delete(sessionId: string): void {
    cache.delete(`tokens:${sessionId}`);
  },

  has(sessionId: string): boolean {
    return this.get(sessionId) !== null;
  },
};
