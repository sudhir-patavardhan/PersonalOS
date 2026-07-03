import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type { BrandUser } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'brand-portal.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS brand_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      totp_secret TEXT,
      brand_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL,
      totp_configured INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS invite_tokens (
      token TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_brand_users_brand ON brand_users(brand_id);
    CREATE INDEX IF NOT EXISTS idx_brand_users_email ON brand_users(email);
  `);
  return db;
}

export function getUserCount(brandId?: string): number {
  if (brandId) {
    return (getDb().prepare('SELECT COUNT(*) as count FROM brand_users WHERE brand_id = ?').get(brandId) as { count: number }).count;
  }
  return (getDb().prepare('SELECT COUNT(*) as count FROM brand_users').get() as { count: number }).count;
}

export function createUser(email: string, passwordHash: string, totpSecret: string, brandId: string, role: BrandUser['role'] = 'admin'): BrandUser {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().prepare(
    'INSERT INTO brand_users (id, email, password_hash, totp_secret, brand_id, role, created_at, totp_configured) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
  ).run(id, email, passwordHash, totpSecret, brandId, role, now);
  return { id, email, brandId, role, createdAt: now, totpConfigured: true };
}

export function getUserByEmail(email: string): (BrandUser & { passwordHash: string; totpSecret: string | null }) | null {
  const row = getDb().prepare('SELECT * FROM brand_users WHERE email = ?').get(email) as {
    id: string; email: string; password_hash: string; totp_secret: string | null;
    brand_id: string; role: string; created_at: string; totp_configured: number;
  } | undefined;
  if (!row) return null;
  return {
    id: row.id, email: row.email, passwordHash: row.password_hash, totpSecret: row.totp_secret,
    brandId: row.brand_id, role: row.role as BrandUser['role'], createdAt: row.created_at, totpConfigured: row.totp_configured === 1,
  };
}

export function getTeamMembers(brandId: string): BrandUser[] {
  const rows = getDb().prepare('SELECT id, email, brand_id, role, created_at, totp_configured FROM brand_users WHERE brand_id = ? ORDER BY created_at').all(brandId) as {
    id: string; email: string; brand_id: string; role: string; created_at: string; totp_configured: number;
  }[];
  return rows.map(r => ({ id: r.id, email: r.email, brandId: r.brand_id, role: r.role as BrandUser['role'], createdAt: r.created_at, totpConfigured: r.totp_configured === 1 }));
}

export function createInviteToken(brandId: string, role: BrandUser['role']): string {
  const token = uuidv4();
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  getDb().prepare('INSERT INTO invite_tokens (token, brand_id, role, created_at, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)')
    .run(token, brandId, role, now.toISOString(), expires.toISOString());
  return token;
}

export function getInviteToken(token: string): { brandId: string; role: BrandUser['role']; expiresAt: string; used: boolean } | null {
  const row = getDb().prepare('SELECT * FROM invite_tokens WHERE token = ?').get(token) as {
    token: string; brand_id: string; role: string; created_at: string; expires_at: string; used: number;
  } | undefined;
  if (!row) return null;
  return { brandId: row.brand_id, role: row.role as BrandUser['role'], expiresAt: row.expires_at, used: row.used === 1 };
}

export function markInviteUsed(token: string): void {
  getDb().prepare('UPDATE invite_tokens SET used = 1 WHERE token = ?').run(token);
}
