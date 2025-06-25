import Database from 'better-sqlite3';

// シンプルなSQLite専用データベース接続クラス
class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database;

  private constructor() {
    console.log('=== DatabaseManager 初期化（SQLite専用）===');
    this.db = new Database('./sns.db');
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  // シングルトンインスタンスを取得
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // テーブル初期化
  private initializeTables(): void {
    try {
      console.log('SQLiteテーブル初期化中...');
      
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      this.db.prepare(`
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

      this.db.prepare(`
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

  // クエリ実行（同期）
  run(sqlQuery: string, ...params: unknown[]): any {
    return this.db.prepare(sqlQuery).run(...params);
  }

  // 単一行取得（同期）
  get(sqlQuery: string, ...params: unknown[]): unknown {
    return this.db.prepare(sqlQuery).get(...params);
  }

  // 複数行取得（同期）
  all(sqlQuery: string, ...params: unknown[]): unknown[] {
    return this.db.prepare(sqlQuery).all(...params);
  }

  // 接続を閉じる
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseManager;
