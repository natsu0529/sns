import Database from 'better-sqlite3';

// 一時的にシンプルなSQLite設定に戻す
const isVercel = false;
const hasDatabase = false;
const isPostgres = false;

// データベース接続クラス（シングルトンパターン）
class DatabaseManager {
  private static instance: DatabaseManager;
  private db?: Database.Database;
  private initialized: boolean = false;

  private constructor() {
    console.log('=== DatabaseManager 初期化 ===');
    console.log('SQLite使用中:', './sns.db');
    this.db = new Database('./sns.db');
    this.db.pragma('journal_mode = WAL');
    // SQLiteは同期で初期化
    this.initializeTablesSqlite();
    this.initialized = true;
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
      try {
        // 初期化に15秒のタイムアウトを設定
        const timeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('データベース初期化タイムアウト (15秒)')), 15000);
        });
        
        await Promise.race([this.initializationPromise, timeout]);
        this.initialized = true;
      } catch (error) {
        console.error('データベース初期化待機中にエラー:', error);
        // 初期化に失敗してもクエリは実行を試行する
        this.initialized = true; // エラー状態でも継続
      }
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
      
      // タイムアウト処理付きでクエリ実行
      const queryPromise = (async () => {
        const client = await this.pgPool!.connect();
        try {
          const result = await client.query(pgQuery, params);
          return result;
        } finally {
          client.release();
        }
      })();
      
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('クエリタイムアウト (30秒)')), 30000);
      });
      
      return await Promise.race([queryPromise, timeout]);
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
      
      // タイムアウト処理付きでクエリ実行
      const queryPromise = (async () => {
        const client = await this.pgPool!.connect();
        try {
          const result = await client.query(pgQuery, params);
          return result.rows;
        } finally {
          client.release();
        }
      })();
      
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('クエリタイムアウト (30秒)')), 30000);
      });
      
      return await Promise.race([queryPromise, timeout]);
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
        // タイムアウト付きでテーブル作成
        const createTables = async () => {
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
        };

        // 10秒のタイムアウトを設定
        const timeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('テーブル初期化タイムアウト (10秒)')), 10000);
        });

        await Promise.race([createTables(), timeout]);
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
      // 初期化エラーでもアプリケーションは継続
      console.log('テーブル初期化に失敗しましたが、アプリケーションは継続します');
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

  // PostgreSQL接続テスト
  private async testConnection(): Promise<void> {
    if (this.pgPool) {
      try {
        console.log('PostgreSQL接続テスト開始...');
        const client = await this.pgPool.connect();
        try {
          const result = await client.query('SELECT NOW()');
          console.log('PostgreSQL接続テスト成功:', result.rows[0]);
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('PostgreSQL接続テスト失敗:', error);
      }
    }
  }
}

// TypeScript形式のエクスポート
export default DatabaseManager;
