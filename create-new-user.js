const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

async function createNewTestUser() {
  const db = new Database('./sns.db');
  
  // 新しいテストユーザーを作成
  const username = 'newtest';
  const password = 'newpass123';
  
  console.log('=== 新しいテストユーザーを作成 ===');
  console.log(`ユーザー名: ${username}`);
  console.log(`パスワード: ${password}`);
  
  try {
    // 既存ユーザーチェック
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      console.log('既存ユーザーを削除中...');
      db.prepare('DELETE FROM users WHERE username = ?').run(username);
    }
    
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log(`ハッシュ化パスワード: ${hashedPassword}`);
    
    // ユーザーを作成
    const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
    console.log('ユーザー作成結果:', result);
    
    // 確認
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    console.log('作成されたユーザー:', user);
    
    // パスワード検証テスト
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`パスワード検証結果: ${isMatch}`);
    
    console.log('\n✅ 新しいログイン情報:');
    console.log(`ユーザー名: ${username}`);
    console.log(`パスワード: ${password}`);
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    db.close();
  }
}

createNewTestUser().catch(console.error);
