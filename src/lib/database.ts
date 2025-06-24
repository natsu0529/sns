import Database from 'better-sqlite3';
import path from 'path';

// Vercel環境ではメモリ内データベースを使用
const DATABASE_PATH = process.env.NODE_ENV === 'production' 
  ? ':memory:' 
  : path.join(process.cwd(), 'sns.db');

// データベース接続クラス（シングルトンパターン）
class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database;

  private constructor() {
    this.db = new Database(DATABASE_PATH);
    this.db.pragma('journal_mode = WAL');
    // 本番環境では自動的にテーブルを初期化
    if (process.env.NODE_ENV === 'production') {
      this.initializeTables();
    }
  }

  // シングルトンインスタンスを取得
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // クエリ実行
  run(sql: string, ...params: unknown[]): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  // 単一行取得
  get(sql: string, ...params: unknown[]): unknown {
    return this.db.prepare(sql).get(...params);
  }

  // 複数行取得
  all(sql: string, ...params: unknown[]): unknown[] {
    return this.db.prepare(sql).all(...params);
  }

  // 本番環境用の同期初期化
  private initializeTables() {
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
      
      console.log('Production database tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize production database tables:', error);
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
    this.db.close();
  }
}

// TypeScript形式のエクスポート
export default DatabaseManager;
