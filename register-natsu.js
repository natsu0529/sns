// Natsuユーザー登録用スクリプト
const http = require('http');

function registerNatsu() {
  console.log('=== Natsuユーザー登録 ===');
  
  const natsuUser = {
    username: 'Natsu',
    password: 'password123'
  };

  const postData = JSON.stringify(natsuUser);
  
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
        console.log('✅ Natsuユーザー登録成功');
        
        // データベースで確認
        const Database = require('better-sqlite3');
        const db = new Database('./sns.db');
        const users = db.prepare('SELECT id, username, created_at FROM users').all();
        console.log('データベース確認:');
        console.log(users);
        db.close();
      } else {
        console.log('❌ Natsuユーザー登録失敗');
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
    setTimeout(registerNatsu, 500);
  });

  req.on('error', (e) => {
    console.log('サーバー確認: 起動していません');
    console.log('以下のコマンドでサーバーを起動してください:');
    console.log('npm run dev');
  });

  req.end();
}

checkServer();
