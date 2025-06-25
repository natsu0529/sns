const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

async function testDirectAuth() {
  console.log('=== 直接認証テスト ===');
  
  // データベースパス確認
  const DATABASE_PATH = process.env.VERCEL ? ':memory:' : './sns.db';
  console.log('使用するDB:', DATABASE_PATH);
  
  const db = new Database(DATABASE_PATH);
  
  // 全ユーザー取得
  const users = db.prepare('SELECT * FROM users').all();
  console.log('データベース内のユーザー数:', users.length);
  
  if (users.length === 0) {
    console.log('❌ ユーザーが存在しません');
    db.close();
    return;
  }
  
  // 各ユーザーでパスワードテスト
  for (const user of users) {
    console.log(`\n--- ${user.username} のテスト ---`);
    
    const testPasswords = ['testpass123', 'newpass123', 'password', 'test'];
    
    for (const pwd of testPasswords) {
      try {
        const isMatch = await bcrypt.compare(pwd, user.password);
        if (isMatch) {
          console.log(`✅ ${user.username} / ${pwd} -> 認証成功`);
        }
      } catch (error) {
        console.log(`❌ ${user.username} / ${pwd} -> エラー:`, error.message);
      }
    }
  }
  
  db.close();
  console.log('\n=== テスト完了 ===');
}

testDirectAuth().catch(console.error);
