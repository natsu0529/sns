import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import DatabaseManager from '@/lib/database';

// 型定義
interface UserRecord {
  id: number;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password }: { username: string; password: string } = await request.json();

    // バリデーション
    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードが必要です' },
        { status: 400 }
      );
    }

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json(
        { error: 'ユーザー名は3文字以上、パスワードは6文字以上である必要があります' },
        { status: 400 }
      );
    }

    const db = DatabaseManager.getInstance();
    try {
      // ユーザー名の重複チェック
      const existingUser = db.get(
        'SELECT id FROM users WHERE username = ?',
        username
      ) as UserRecord | undefined;

      if (existingUser) {
        return NextResponse.json(
          { error: 'このユーザー名は既に使用されています' },
          { status: 409 }
        );
      }

      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(password, 12);

      // ユーザーを作成
      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        username, hashedPassword
      );

      return NextResponse.json(
        { message: 'ユーザーが正常に作成されました' },
        { status: 201 }
      );

    } catch (error) {
      console.error('ユーザー登録中にエラーが発生:', error);
      return NextResponse.json(
        { error: 'ユーザー登録に失敗しました' },
        { status: 500 }
      );
    }
    // Note: シングルトンパターンなのでcloseしない
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
