import Database from "better-sqlite3";
import path from "path";
import type { FinancialData } from "./parse-excel";

export interface StoredSnapshot {
  month: string;
  label: string;
  data: FinancialData;
  isCurrent: boolean;
  updatedAt: string;
}

const DB_PATH = path.join(process.cwd(), "data", "finance.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS monthly_snapshots (
        month TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        is_current INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }
  return _db;
}

export function getAllSnapshots(): StoredSnapshot[] {
  const db = getDb();
  const rows = db.prepare("SELECT month, label, is_current, data, updated_at FROM monthly_snapshots ORDER BY month DESC").all() as {
    month: string;
    label: string;
    is_current: number;
    data: string;
    updated_at: string;
  }[];
  return rows.map((r) => ({
    month: r.month,
    label: r.label,
    data: JSON.parse(r.data) as FinancialData,
    isCurrent: r.is_current === 1,
    updatedAt: r.updated_at,
  }));
}

export function getSnapshot(month: string): StoredSnapshot | null {
  const db = getDb();
  const row = db.prepare("SELECT month, label, is_current, data, updated_at FROM monthly_snapshots WHERE month = ?").get(month) as {
    month: string;
    label: string;
    is_current: number;
    data: string;
    updated_at: string;
  } | undefined;
  if (!row) return null;
  return {
    month: row.month,
    label: row.label,
    data: JSON.parse(row.data) as FinancialData,
    isCurrent: row.is_current === 1,
    updatedAt: row.updated_at,
  };
}

export function saveSnapshot(month: string, label: string, data: FinancialData, isCurrent: boolean): string {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO monthly_snapshots (month, label, is_current, data, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(month, label, isCurrent ? 1 : 0, JSON.stringify(data), now);
  return now;
}

export function seedFromSnapshots(snapshots: { month: string; label: string; data: FinancialData; isCurrent: boolean }[]): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO monthly_snapshots (month, label, is_current, data, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    const now = new Date().toISOString();
    for (const s of snapshots) {
      insert.run(s.month, s.label, s.isCurrent ? 1 : 0, JSON.stringify(s.data), now);
    }
  });
  tx();
}

export function hasData(): boolean {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as cnt FROM monthly_snapshots").get() as { cnt: number };
  return row.cnt > 0;
}
