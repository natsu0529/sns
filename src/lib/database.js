const Database = require('better-sqlite3');
const path = require('path');

const DATABASE_PATH = path.join(process.cwd(), 'sns.db');

// データベース接続クラス
class DatabaseManager {
  constructor() {
    const db = new Database(DATABASE_PATH);
    this.db = db;
    this.db.pragma('journal_mode = WAL');
  }

  // クエリ実行
  run(sql, ...params) {
    const paramsArray = params;
    return this.db.prepare(sql).run(...paramsArray);
  }

  // 単一行取得
  get(sql, ...params) {
    const paramsArray = params;
    return this.db.prepare(sql).get(...paramsArray);
  }

  // 複数行取得
  all(sql, ...params) {
    const paramsArray = params;
    return this.db.prepare(sql).all(...paramsArray);
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

// CommonJS形式のエクスポート
module.exports = DatabaseManager;
module.exports.DatabaseManager = DatabaseManager;
module.exports.default = DatabaseManager;
