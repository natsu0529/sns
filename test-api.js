// NextAuth.js APIエンドポイントの直接テスト
const http = require('http');

function testLoginAPI() {
  const postData = JSON.stringify({
    username: 'testuser',
    password: 'testpass123',
    csrfToken: 'test'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/callback/credentials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('=== NextAuth.js API テスト ===');
  console.log('エンドポイント:', `http://${options.hostname}:${options.port}${options.path}`);
  console.log('送信データ:', postData);

  const req = http.request(options, (res) => {
    console.log(`ステータスコード: ${res.statusCode}`);
    console.log(`ヘッダー:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('レスポンス:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`リクエストエラー: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

// サーバーが起動しているかチェック
const checkOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
};

const checkReq = http.request(checkOptions, (res) => {
  console.log('サーバー起動確認: OK');
  setTimeout(testLoginAPI, 1000);
});

checkReq.on('error', (e) => {
  console.error('サーバーが起動していません:', e.message);
  console.log('まずアプリケーションを起動してください: npm run dev または npm start');
});

checkReq.end();
