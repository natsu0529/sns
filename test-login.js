const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

async function testLogin() {
  const db = new Database('./sns.db');
  
  // テストユーザーの情報を取得
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get('testuser');
  
  if (!user) {
    console.log('ユーザーが見つかりません');
    return;
  }
  
  console.log('=== ユーザー情報 ===');
  console.log('ID:', user.id);
  console.log('ユーザー名:', user.username);
  console.log('パスワードハッシュ:', user.password);
  console.log('作成日時:', user.created_at);
  
  // 複数のパスワードでテスト
  const testPasswords = ['testpass123', 'testpass', 'test123', 'password'];
  
  console.log('\n=== パスワードテスト ===');
  for (const pwd of testPasswords) {
    try {
      const isMatch = await bcrypt.compare(pwd, user.password);
      console.log(`"${pwd}" -> ${isMatch ? '✅ 一致' : '❌ 不一致'}`);
    } catch (error) {
      console.log(`"${pwd}" -> エラー:`, error.message);
    }
  }
  
  db.close();
}

testLogin().catch(console.error);
