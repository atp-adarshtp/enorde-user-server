import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db;
const DB_PATH = process.env.DB_PATH || './data/enorde.db';

export async function initDatabase() {
  const SQL = await initSqlJs();
  
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key)`);

  console.log('SQLite database initialized');
}

export function getDb() {
  return db;
}

export function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return { 
      rows: results, 
      rowCount: results.length,
      rowsAffected: 0 
    };
  } catch (error) {
    throw error;
  }
}

export function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
    return { 
      rows: [], 
      rowCount: 0, 
      rowsAffected: db.getRowsModified()
    };
  } catch (error) {
    throw error;
  }
}

export function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}
