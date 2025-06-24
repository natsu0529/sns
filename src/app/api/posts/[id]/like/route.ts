import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Database from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const postId = params.id;
    const db = new Database();

    try {
      // ユーザーIDを取得
      const user = await db.get(
        'SELECT id FROM users WHERE username = ?',
        [session.user.name]
      );

      if (!user) {
        return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 404 }
        );
      }

      // 既にいいねしているかチェック
      const existingLike = await db.get(
        'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
        [user.id, postId]
      );

      if (existingLike) {
        // いいねを削除（取り消し）
        await db.run(
          'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
          [user.id, postId]
        );
        return NextResponse.json({ message: 'いいねを取り消しました', liked: false });
      } else {
        // いいねを追加
        await db.run(
          'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
          [user.id, postId]
        );
        return NextResponse.json({ message: 'いいねしました', liked: true });
      }

    } finally {
      db.close();
    }
  } catch (error) {
    console.error('いいねエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
