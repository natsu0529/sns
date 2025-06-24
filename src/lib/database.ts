import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const DATABASE_PATH = path.join(process.cwd(), 'sns.db');

// データベース接続クラス
class Database {
  private db: sqlite3.Database;
  public run: (sql: string, ...params: any[]) => Promise<sqlite3.RunResult>;
  public get: (sql: string, ...params: any[]) => Promise<any>;
  public all: (sql: string, ...params: any[]) => Promise<any[]>;

  constructor() {
    this.db = new sqlite3.Database(DATABASE_PATH);
    
    // プロミス化されたメソッドを初期化
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }

  // データベースの初期化
  async initialize() {
    try {
      // ユーザーテーブル
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 投稿テーブル
      await this.run(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // いいねテーブル
      await this.run(`
        CREATE TABLE IF NOT EXISTS likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (post_id) REFERENCES posts (id),
          UNIQUE(user_id, post_id)
        )
      `);

      // 返信テーブル
      await this.run(`
        CREATE TABLE IF NOT EXISTS replies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (post_id) REFERENCES posts (id)
        )
      `);

      console.log('データベースが正常に初期化されました');
    } catch (error) {
      console.error('データベースの初期化でエラーが発生しました:', error);
    }
  }

  // データベースを閉じる
  close() {
    return new Promise<void>((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('データベース切断エラー:', err);
        }
        resolve();
      });
    });
  }
}

export default Database;
