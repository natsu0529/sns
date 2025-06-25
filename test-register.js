// ユーザー登録APIのテスト
const http = require('http');

function testUserRegistration() {
  console.log('=== ユーザー登録APIテスト ===');
  
  const testUser = {
    username: 'apitest',
    password: 'apitest123'
  };

  const postData = JSON.stringify(testUser);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('ステータス:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('レスポンス:', data);
      
      if (res.statusCode === 201) {
        console.log('✅ ユーザー登録成功');
        
        // データベースで確認
        const Database = require('better-sqlite3');
        const db = new Database('./sns.db');
        const users = db.prepare('SELECT * FROM users WHERE username = ?').all('apitest');
        console.log('データベース確認:', users);
        db.close();
      } else {
        console.log('❌ ユーザー登録失敗');
      }
    });
  });

  req.on('error', (e) => {
    console.error('エラー:', e.message);
    console.log('サーバーが起動していない可能性があります');
    console.log('以下のコマンドでサーバーを起動してください:');
    console.log('npm run dev');
  });

  req.write(postData);
  req.end();
}

// サーバーが起動しているかチェック
function checkServer() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('サーバー確認: 起動中');
    setTimeout(testUserRegistration, 500);
  });

  req.on('error', (e) => {
    console.log('サーバー確認: 起動していません');
    console.log('以下のコマンドでサーバーを起動してください:');
    console.log('npm run dev');
  });

  req.end();
}

checkServer();
