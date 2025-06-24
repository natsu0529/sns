import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import DatabaseManager from '@/lib/database';

// 型定義
interface UserRecord {
  id: number;
}

interface PostRecord {
  user_id: number;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const postId = resolvedParams.id;
    const db = new DatabaseManager();

    try {
      // ユーザーIDを取得
      const user = db.get(
        'SELECT id FROM users WHERE username = ?',
        session.user.name
      ) as UserRecord | undefined;

      if (!user) {
        return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 404 }
        );
      }

      // 投稿の所有者確認
      const post = db.get(
        'SELECT user_id FROM posts WHERE id = ?',
        postId
      ) as PostRecord | undefined;

      if (!post) {
        return NextResponse.json(
          { error: '投稿が見つかりません' },
          { status: 404 }
        );
      }

      if (post.user_id !== user.id) {
        return NextResponse.json(
          { error: '自分の投稿のみ削除できます' },
          { status: 403 }
        );
      }

      // 関連データを削除（外部キー制約のため順序重要）
      // 1. 返信を削除
      db.run('DELETE FROM replies WHERE post_id = ?', postId);
      
      // 2. いいねを削除
      db.run('DELETE FROM likes WHERE post_id = ?', postId);
      
      // 3. 投稿を削除
      db.run('DELETE FROM posts WHERE id = ?', postId);

      return NextResponse.json(
        { message: '投稿が削除されました' },
        { status: 200 }
      );

    } finally {
      db.close();
    }
  } catch (error) {
    console.error('投稿削除エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
