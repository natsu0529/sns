import Database from 'better-sqlite3';
import { Pool } from 'pg';

// Vercel環境ではPostgreSQL、ローカルではSQLite
const isVercel = !!process.env.VERCEL;
const hasDatabase = !!process.env.DATABASE_URL || !!process.env.POSTGRES_URL;
const isPostgres = isVercel && hasDatabase;

// データベース接続クラス（シングルトンパターン）
class DatabaseManager {
  private static instance: DatabaseManager;
  private db?: Database.Database;
  private pgPool?: Pool;
  private isPostgres: boolean;
  private initialized: boolean = false;
  private initializationPromise?: Promise<void>;

  private constructor() {
    this.isPostgres = isVercel && isPostgres;
    
    console.log('=== DatabaseManager 初期化 ===');
    console.log('isVercel:', isVercel);
    console.log('hasDatabase:', hasDatabase);
    console.log('isPostgres:', isPostgres);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
    
    if (this.isPostgres) {
      console.log('PostgreSQL使用中 (Vercel環境)');
      // PostgreSQL接続プールを作成
      const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (dbUrl) {
        console.log('データベースURL確認済み');
        this.pgPool = new Pool({
          connectionString: dbUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        console.log('PostgreSQL接続プール作成完了');
      } else {
        console.error('データベースURLが見つかりません');
      }
      // PostgreSQLの場合は非同期で初期化
      this.initializationPromise = this.initializeTablesAsync();
    } else {
      console.log('SQLite使用中:', './sns.db');
      this.db = new Database('./sns.db');
      this.db.pragma('journal_mode = WAL');
      // SQLiteは同期で初期化
      this.initializeTablesSqlite();
      this.initialized = true;
    }
  }

  // シングルトンインスタンスを取得
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // 初期化が完了するまで待機
  private async ensureInitialized(): Promise<void> {
    if (this.isPostgres && this.initializationPromise) {
      await this.initializationPromise;
      this.initialized = true;
    }
  }

  // クエリ実行
  async run(sqlQuery: string, ...params: unknown[]): Promise<any> {
    await this.ensureInitialized();
    
    if (this.isPostgres && this.pgPool) {
      // PostgreSQLの場合、$1, $2, $3...形式に変換
      let paramIndex = 1;
      const pgQuery = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);
      console.log('PostgreSQL Query:', pgQuery, 'Params:', params);
      const client = await this.pgPool.connect();
      try {
        const result = await client.query(pgQuery, params);
        return result;
      } finally {
        client.release();
      }
    } else {
      return this.db!.prepare(sqlQuery).run(...params);
    }
  }

  // 単一行取得
  async get(sqlQuery: string, ...params: unknown[]): Promise<unknown> {
    await this.ensureInitialized();
    
    if (this.isPostgres && this.pgPool) {
      // PostgreSQLの場合、$1, $2, $3...形式に変換
      let paramIndex = 1;
      const pgQuery = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);
      console.log('PostgreSQL Query:', pgQuery, 'Params:', params);
      const client = await this.pgPool.connect();
      try {
        const result = await client.query(pgQuery, params);
        return result.rows[0];
      } finally {
        client.release();
      }
    } else {
      return this.db!.prepare(sqlQuery).get(...params);
    }
  }

  // 複数行取得
  async all(sqlQuery: string, ...params: unknown[]): Promise<unknown[]> {
    await this.ensureInitialized();
    
    if (this.isPostgres && this.pgPool) {
      // PostgreSQLの場合、$1, $2, $3...形式に変換
      let paramIndex = 1;
      const pgQuery = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);
      console.log('PostgreSQL Query:', pgQuery, 'Params:', params);
      const client = await this.pgPool.connect();
      try {
        const result = await client.query(pgQuery, params);
        return result.rows;
      } finally {
        client.release();
      }
    } else {
      return this.db!.prepare(sqlQuery).all(...params);
    }
  }

  // PostgreSQL用の非同期テーブル初期化
  private async initializeTablesAsync(): Promise<void> {
    try {
      console.log('PostgreSQLテーブル初期化中...');
      
      // 環境変数の確認
      const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL または POSTGRES_URL 環境変数が設定されていません');
      }
      
      console.log('データベースURL確認完了');

      if (!this.pgPool) {
        throw new Error('PostgreSQL接続プールが初期化されていません');
      }

      const client = await this.pgPool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('usersテーブル作成完了');

        await client.query(`
          CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('postsテーブル作成完了');

        await client.query(`
          CREATE TABLE IF NOT EXISTS likes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            post_id INTEGER NOT NULL REFERENCES posts(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, post_id)
          )
        `);
        console.log('likesテーブル作成完了');

        await client.query(`
          CREATE TABLE IF NOT EXISTS replies (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            post_id INTEGER NOT NULL REFERENCES posts(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('repliesテーブル作成完了');

        console.log('PostgreSQLテーブル初期化完了');
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('PostgreSQLテーブル初期化エラー:', error);
      console.error('エラー詳細:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // SQLite用の同期テーブル初期化
  private initializeTablesSqlite(): void {
    try {
      console.log('SQLiteテーブル初期化中...');
      
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

      console.log('SQLiteテーブル初期化完了');
    } catch (error) {
      console.error('SQLiteテーブル初期化エラー:', error);
      throw error;
    }
  }

  // データベースを閉じる
  close() {
    if (this.isPostgres && this.pgPool) {
      this.pgPool.end();
    } else if (!this.isPostgres && this.db) {
      this.db.close();
    }
  }
}

// TypeScript形式のエクスポート
export default DatabaseManager;
