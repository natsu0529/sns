import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import DatabaseManager from '@/lib/database';

// 型定義
interface UserRecord {
  id: number;
}

export async function POST(request: NextRequest) {
  console.log('=== ユーザー登録API開始 ===');
  try {
    const { username, password }: { username: string; password: string } = await request.json();
    console.log('受信データ:', { username, passwordLength: password?.length });

    // バリデーション
    if (!username || !password) {
      console.log('バリデーションエラー: 必須項目不足');
      return NextResponse.json(
        { error: 'ユーザー名とパスワードが必要です' },
        { status: 400 }
      );
    }

    if (username.length < 3 || password.length < 6) {
      console.log('バリデーションエラー: 文字数制限');
      return NextResponse.json(
        { error: 'ユーザー名は3文字以上、パスワードは6文字以上である必要があります' },
        { status: 400 }
      );
    }

    console.log('データベース接続を取得中...');
    const db = DatabaseManager.getInstance();
    console.log('データベース接続取得完了');
    
    try {
      console.log('ユーザー名重複チェック開始:', username);
      // ユーザー名の重複チェック
      const existingUser = await db.get(
        'SELECT id FROM users WHERE username = ?',
        username
      ) as UserRecord | undefined;
      console.log('重複チェック結果:', existingUser ? 'ユーザー存在' : 'ユーザー未存在');

      if (existingUser) {
        console.log('重複エラー: ユーザー名既存');
        return NextResponse.json(
          { error: 'このユーザー名は既に使用されています' },
          { status: 409 }
        );
      }

      console.log('パスワードハッシュ化開始...');
      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('パスワードハッシュ化完了');

      console.log('ユーザー作成開始...');
      // ユーザーを作成
      await db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        username, hashedPassword
      );
      console.log('ユーザー作成完了');

      console.log('=== ユーザー登録成功 ===');
      return NextResponse.json(
        { message: 'ユーザーが正常に作成されました' },
        { status: 201 }
      );

    } catch (error) {
      console.error('ユーザー登録中にエラーが発生:', error);
      console.error('エラー詳細:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.json(
        { error: 'ユーザー登録に失敗しました' },
        { status: 500 }
      );
    }
    // Note: シングルトンパターンなのでcloseしない
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    console.error('エラー詳細:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
