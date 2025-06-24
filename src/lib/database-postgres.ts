// PostgreSQL対応版のデータベースマネージャー（将来使用予定）
import { sql } from '@vercel/postgres';
import Database from 'better-sqlite3';

class DatabaseManager {
  private static instance: DatabaseManager;
  private isPostgres: boolean;
  private db?: Database.Database;

  private constructor() {
    this.isPostgres = !!process.env.POSTGRES_URL;
    
    if (this.isPostgres) {
      console.log('PostgreSQL使用中 (Vercel Postgres)');
    } else {
      console.log('SQLite使用中:', './sns.db');
      this.db = new Database('./sns.db');
      this.db.pragma('journal_mode = WAL');
    }
    
    this.initializeTables();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async run(query: string, ...params: unknown[]) {
    if (this.isPostgres) {
      return await sql.query(query, params);
    } else {
      return this.db!.prepare(query).run(...params);
    }
  }

  async get(query: string, ...params: unknown[]) {
    if (this.isPostgres) {
      const result = await sql.query(query, params);
      return result.rows[0];
    } else {
      return this.db!.prepare(query).get(...params);
    }
  }

  async all(query: string, ...params: unknown[]) {
    if (this.isPostgres) {
      const result = await sql.query(query, params);
      return result.rows;
    } else {
      return this.db!.prepare(query).all(...params);
    }
  }

  private async initializeTables() {
    // PostgreSQL用のテーブル作成SQL（将来使用）
    const postgresSchema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        post_id INTEGER NOT NULL REFERENCES posts(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      );

      CREATE TABLE IF NOT EXISTS replies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        post_id INTEGER NOT NULL REFERENCES posts(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // SQLite用のテーブル作成SQL
    const sqliteSchema = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        UNIQUE(user_id, post_id)
      )`,
      `CREATE TABLE IF NOT EXISTS replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
      )`
    ];

    try {
      if (this.isPostgres) {
        await sql.query(postgresSchema);
        console.log('PostgreSQL tables initialized successfully');
      } else {
        for (const query of sqliteSchema) {
          this.db!.prepare(query).run();
        }
        console.log('SQLite tables initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
    }
  }
}

export default DatabaseManager;
