import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (_db) return _db

  const dbDir = join(process.cwd(), 'data')
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

  const sqlite = new Database(join(dbDir, 'unos-first.db'))
  sqlite.pragma('journal_mode = WAL')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      display_name TEXT NOT NULL,
      submitter_name TEXT NOT NULL,
      contact TEXT,
      headcount INTEGER DEFAULT 1,
      dietary_notes TEXT,
      status TEXT DEFAULT 'pending',
      show_on_public INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lap_number TEXT,
      label TEXT NOT NULL,
      time TEXT NOT NULL,
      venue_name TEXT,
      address TEXT,
      note TEXT,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      uploader_name TEXT,
      caption TEXT,
      status TEXT DEFAULT 'pending',
      is_featured INTEGER DEFAULT 0,
      show_on_public INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS time_capsule_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submitter_name TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submitter_name TEXT NOT NULL,
      amount REAL NOT NULL,
      message TEXT,
      show_on_public INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS fund_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal REAL NOT NULL DEFAULT 100000,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  // Seed fund_settings if empty
  const existing = sqlite.prepare('SELECT id FROM fund_settings LIMIT 1').get()
  if (!existing) {
    const now = new Date().toISOString()
    sqlite.prepare('INSERT INTO fund_settings (goal, created_at, updated_at) VALUES (100000, ?, ?)').run(now, now)
  }

  _db = drizzle(sqlite, { schema })
  return _db
}
