const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

// NextAuth.jsが使用するのと同じロジックをシミュレート
async function simulateLogin(username, password) {
  console.log('=== ログインシミュレーション ===');
  console.log('入力された認証情報:', {
    username: username,
    password: password ? '入力あり' : '入力なし'
  });

  if (!username || !password) {
    console.log('認証情報が不足しています');
    return null;
  }

  const db = new Database('./sns.db');
  
  try {
    console.log('データベースからユーザー検索:', username);
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    console.log('ユーザー検索結果:', user ? `見つかった (ID: ${user.id})` : '見つからない');

    if (user) {
      console.log('パスワード比較開始');
      console.log('入力パスワード:', password);
      console.log('保存されたハッシュ:', user.password);
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('パスワード比較結果:', passwordMatch);
      
      if (passwordMatch) {
        console.log('認証成功:', user.username);
        return {
          id: user.id.toString(),
          name: user.username,
        };
      } else {
        console.log('パスワード不一致');
      }
    }
    
    console.log('認証失敗');
    return null;
  } catch (error) {
    console.error('認証エラー:', error);
    return null;
  } finally {
    db.close();
  }
}

// テストケース
async function runTests() {
  console.log('=== テストケース1: 正しい認証情報 ===');
  await simulateLogin('testuser', 'testpass123');
  
  console.log('\n=== テストケース2: 間違ったパスワード ===');
  await simulateLogin('testuser', 'wrongpass');
  
  console.log('\n=== テストケース3: 存在しないユーザー ===');
  await simulateLogin('nonexistent', 'testpass123');
  
  console.log('\n=== テストケース4: 空の認証情報 ===');
  await simulateLogin('', '');
}

runTests().catch(console.error);
