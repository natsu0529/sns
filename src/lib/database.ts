import Database from 'better-sqlite3';
import { sql } from '@vercel/postgres';
import path from 'path';

// Vercel環境ではPostgreSQL、ローカルではSQLite
const isVercel = !!process.env.VERCEL;
const isPostgres = !!process.env.POSTGRES_URL;

// データベース接続クラス（シングルトンパターン）
class DatabaseManager {
  private static instance: DatabaseManager;
  private db?: Database.Database;
  private isPostgres: boolean;

  private constructor() {
    this.isPostgres = isVercel && isPostgres;
    
    if (this.isPostgres) {
      console.log('PostgreSQL使用中 (Vercel環境)');
    } else {
      console.log('SQLite使用中:', './sns.db');
      this.db = new Database('./sns.db');
      this.db.pragma('journal_mode = WAL');
    }
    
    console.log('テーブル初期化中');
    this.initializeTables();
  }

  // シングルトンインスタンスを取得
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // クエリ実行
  async run(sqlQuery: string, ...params: unknown[]): Promise<any> {
    if (this.isPostgres) {
      // PostgreSQLの場合、$1, $2, $3...形式に変換
      const pgQuery = sqlQuery.replace(/\?/g, () => `$${params.length}`);
      return await sql.query(pgQuery, params);
    } else {
      return this.db!.prepare(sqlQuery).run(...params);
    }
  }

  // 単一行取得
  async get(sqlQuery: string, ...params: unknown[]): Promise<unknown> {
    if (this.isPostgres) {
      // PostgreSQLの場合、$1, $2, $3...形式に変換
      let paramIndex = 1;
      const pgQuery = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);
      const result = await sql.query(pgQuery, params);
      return result.rows[0];
    } else {
      return this.db!.prepare(sqlQuery).get(...params);
    }
  }

  // 複数行取得
  async all(sqlQuery: string, ...params: unknown[]): Promise<unknown[]> {
    if (this.isPostgres) {
      // PostgreSQLの場合、$1, $2, $3...形式に変換
      let paramIndex = 1;
      const pgQuery = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);
      const result = await sql.query(pgQuery, params);
      return result.rows;
    } else {
      return this.db!.prepare(sqlQuery).all(...params);
    }
  }

  // 本番環境用の同期初期化
  private async initializeTables() {
    try {
      if (this.isPostgres) {
        // PostgreSQL用のテーブル作成
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS likes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            post_id INTEGER NOT NULL REFERENCES posts(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, post_id)
          )
        `;

        await sql`
          CREATE TABLE IF NOT EXISTS replies (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            post_id INTEGER NOT NULL REFERENCES posts(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

        console.log('PostgreSQL tables initialized successfully');
      } else {
        // SQLite用のテーブル作成
        this.db!.prepare(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        this.db!.prepare(`
          CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `).run();

        this.db!.prepare(`
          CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (post_id) REFERENCES posts(id),
            UNIQUE(user_id, post_id)
          )
        `).run();

        this.db!.prepare(`
          CREATE TABLE IF NOT EXISTS replies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (post_id) REFERENCES posts(id)
          )
        `).run();

        console.log('SQLite tables initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
    }
  }

  // データベース初期化
  async initialize() {
    try {
      // ユーザーテーブル
      this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 投稿テーブル
      this.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // いいねテーブル
      this.run(`
        CREATE TABLE IF NOT EXISTS likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (post_id) REFERENCES posts(id),
          UNIQUE(user_id, post_id)
        )
      `);

      // 返信テーブル
      this.run(`
        CREATE TABLE IF NOT EXISTS replies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (post_id) REFERENCES posts(id)
        )
      `);

      console.log('データベースが正常に初期化されました');
    } catch (error) {
      console.error('データベースの初期化でエラーが発生しました:', error);
    }
  }

  // データベースを閉じる
  close() {
    if (!this.isPostgres && this.db) {
      this.db.close();
    }
  }
}

// TypeScript形式のエクスポート
export default DatabaseManager;
