import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'soul-app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS soul_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    totp_secret TEXT,
    soul_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    totp_configured INTEGER DEFAULT 0
  )
`);

export function getUserCount(): number {
  return (db.prepare('SELECT COUNT(*) as count FROM soul_users').get() as { count: number }).count;
}

export function createUser(id: string, email: string, passwordHash: string, totpSecret: string, soulId: string): void {
  db.prepare('INSERT INTO soul_users (id, email, password_hash, totp_secret, soul_id, totp_configured) VALUES (?, ?, ?, ?, ?, 1)').run(id, email, passwordHash, totpSecret, soulId);
}

export function getUserByEmail(email: string) {
  return db.prepare('SELECT * FROM soul_users WHERE email = ?').get(email) as {
    id: string; email: string; password_hash: string; totp_secret: string; soul_id: string; totp_configured: number;
  } | undefined;
}
