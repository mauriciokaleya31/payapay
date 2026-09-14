import crypto from 'crypto';
import { AdminUser, AuthSession } from './types.js';
import { store } from './store.js';

// Secure password hasher with unique salt and PBKDF2
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

// In-memory rate limiter for failed login attempts to prevent brute force
interface LoginAttemptRecord {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) return { allowed: true };

  if (record.blockedUntil && record.blockedUntil > now) {
    const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // Clear if expired
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string) {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;

  // If 5 failed attempts within 15 minutes, block for 5 minutes
  if (record.count >= 5) {
    record.blockedUntil = now + 5 * 60 * 1000;
  }

  loginAttempts.set(identifier, record);
}

export function resetLoginAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

// Session management
export function createSession(user: AdminUser, ip?: string, userAgent?: string): AuthSession {
  const token = `adm_token_${crypto.randomBytes(32).toString('hex')}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 3600 * 1000); // 7 days

  const session: AuthSession = {
    token,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    role: user.role,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    ip,
    userAgent,
  };

  store.saveSession(session);
  return session;
}

export function validateSessionToken(token: string): AuthSession | null {
  if (!token) return null;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const session = store.getSession(cleanToken);

  if (!session) return null;

  // Check expiration
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    store.deleteSession(cleanToken);
    return null;
  }

  return session;
}
