import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { AuditEntry, Operator } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'operators.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      totp_secret TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL,
      totp_configured INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      operator_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
  `);
  return db;
}

export function getOperatorCount(): number {
  return (getDb().prepare('SELECT COUNT(*) as count FROM operators').get() as { count: number }).count;
}

export function createOperator(email: string, passwordHash: string, totpSecret: string, role: 'admin' | 'viewer' = 'admin'): Operator {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().prepare(
    'INSERT INTO operators (id, email, password_hash, totp_secret, role, created_at, totp_configured) VALUES (?, ?, ?, ?, ?, ?, 1)'
  ).run(id, email, passwordHash, totpSecret, role, now);
  return { id, email, role, createdAt: now, totpConfigured: true };
}

export function getOperatorByEmail(email: string): (Operator & { passwordHash: string; totpSecret: string | null }) | null {
  const row = getDb().prepare('SELECT * FROM operators WHERE email = ?').get(email) as {
    id: string; email: string; password_hash: string; totp_secret: string | null;
    role: string; created_at: string; totp_configured: number;
  } | undefined;
  if (!row) return null;
  return {
    id: row.id, email: row.email, passwordHash: row.password_hash, totpSecret: row.totp_secret,
    role: row.role as 'admin' | 'viewer', createdAt: row.created_at, totpConfigured: row.totp_configured === 1,
  };
}

export function getAllOperators(): Operator[] {
  const rows = getDb().prepare('SELECT id, email, role, created_at, totp_configured FROM operators ORDER BY created_at').all() as {
    id: string; email: string; role: string; created_at: string; totp_configured: number;
  }[];
  return rows.map(r => ({ id: r.id, email: r.email, role: r.role as 'admin' | 'viewer', createdAt: r.created_at, totpConfigured: r.totp_configured === 1 }));
}

export function addAuditEntry(operatorEmail: string, action: string, target: string | null = null): AuditEntry {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  getDb().prepare('INSERT INTO audit_log (id, operator_email, action, target, timestamp) VALUES (?, ?, ?, ?, ?)').run(id, operatorEmail, action, target, timestamp);
  return { id, operatorEmail, action, target, timestamp };
}

export function getAuditLog(limit = 100): AuditEntry[] {
  return getDb().prepare('SELECT id, operator_email as operatorEmail, action, target, timestamp FROM audit_log ORDER BY timestamp DESC LIMIT ?').all(limit) as AuditEntry[];
}
