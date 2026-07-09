import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
// 2. Initialize the local SQLite file engine
const nativeDb = new Database('mimo_notes.db');
// Ensure standard optimizations are turned on for SQLite
nativeDb.pragma('journal_mode = WAL');
nativeDb.pragma('synchronous = NORMAL');
// 3. Construct the clean Kysely Query Builder
export const db = new Kysely({
    dialect: new SqliteDialect({
        database: nativeDb,
    }),
});
// 4. Database Initialization Routine
export function initializeDatabase() {
    // Creating the table dynamically if it's a fresh workspace
    nativeDb.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      transcript TEXT NOT NULL,
      summary TEXT NOT NULL,
      key_points TEXT NOT NULL,
      action_items TEXT NOT NULL,
      category TEXT NOT NULL,
      duration INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
    console.log('✅ SQLite Database engine initialized smoothly.');
}
