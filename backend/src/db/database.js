import pkg from 'pg';
const { Pool } = pkg;

let pool;

export async function initDatabase() {
  const connectionString = process.env.DATABASE_URL || 
    `postgres://${process.env.DB_USER || 'yugabyte'}:${process.env.DB_PASSWORD || 'yugabyte'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5433'}/${process.env.DB_NAME || 'enorde'}`;

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test the connection
  try {
    const client = await pool.connect();
    console.log('YugabyteDB connected successfully');
    
    // Check if we need to create or migrate tables
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      // Create users table
      await client.query(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);

      // Create api_keys table
      await client.query(`
        CREATE TABLE api_keys (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          api_key TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX idx_api_keys_key ON api_keys(api_key)
      `);

      await client.query(`
        CREATE INDEX idx_api_keys_user_id ON api_keys(user_id)
      `);

      await client.query(`
        CREATE INDEX idx_users_username ON users(username)
      `);

      await client.query(`
        CREATE INDEX idx_users_email ON users(email)
      `);

      console.log('YugabyteDB tables created');
    } else {
      // Tables exist, check if migration is needed
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'username'
        )
      `);

      if (!columnCheck.rows[0].exists) {
        console.log('Migrating existing tables to new schema...');
        
        // Drop old tables and recreate (data will be lost)
        await client.query('DROP TABLE IF EXISTS api_keys CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        
        // Recreate with new schema
        await client.query(`
          CREATE TABLE users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at INTEGER NOT NULL
          )
        `);

        await client.query(`
          CREATE TABLE api_keys (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            api_key TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            created_at INTEGER NOT NULL
          )
        `);

        await client.query(`
          CREATE INDEX idx_api_keys_key ON api_keys(api_key)
        `);

        await client.query(`
          CREATE INDEX idx_api_keys_user_id ON api_keys(user_id)
        `);

        await client.query(`
          CREATE INDEX idx_users_username ON users(username)
        `);

        await client.query(`
          CREATE INDEX idx_users_email ON users(email)
        `);

        console.log('Tables migrated successfully');
      } else {
        console.log('Tables already exist with correct schema');
      }
    }

    client.release();
    console.log('YugabyteDB initialization complete');
  } catch (error) {
    console.error('Failed to initialize YugabyteDB:', error);
    throw error;
  }
}

export function getDb() {
  return pool;
}

export async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return { 
      rows: result.rows, 
      rowCount: result.rowCount,
      rowsAffected: result.rowCount
    };
  } catch (error) {
    throw error;
  }
}

export async function run(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return { 
      rows: [], 
      rowCount: 0, 
      rowsAffected: result.rowCount
    };
  } catch (error) {
    throw error;
  }
}
