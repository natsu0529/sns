// データベース接続テスト
const path = require('path');

// 同じロジックでデータベースパスを確認
const DATABASE_PATH = process.env.VERCEL 
  ? ':memory:' 
  : path.join(process.cwd(), 'sns.db');

console.log('=== データベース接続テスト ===');
console.log('DATABASE_PATH:', DATABASE_PATH);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('Current working directory:', process.cwd());

// ファイルの存在確認
const fs = require('fs');
if (DATABASE_PATH !== ':memory:') {
  const exists = fs.existsSync(DATABASE_PATH);
  console.log('データベースファイル存在:', exists);
  
  if (exists) {
    const stats = fs.statSync(DATABASE_PATH);
    console.log('ファイルサイズ:', stats.size, 'bytes');
    console.log('最終更新:', stats.mtime);
  }
}

// 実際にデータベースに接続してテスト
const Database = require('better-sqlite3');
try {
  const db = new Database(DATABASE_PATH);
  console.log('データベース接続: 成功');
  
  const users = db.prepare('SELECT * FROM users').all();
  console.log('ユーザー数:', users.length);
  users.forEach(user => {
    console.log(`- ID: ${user.id}, ユーザー名: ${user.username}`);
  });
  
  db.close();
} catch (error) {
  console.error('データベース接続エラー:', error);
}
