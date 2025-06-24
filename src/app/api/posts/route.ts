import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import DatabaseManager from '@/lib/database';

// 型定義
interface PostWithStats {
  id: number;
  content: string;
  created_at: string;
  username: string;
  like_count: number;
  reply_count: number;
}

interface UserRecord {
  id: number;
}

export async function GET() {
  const db = DatabaseManager.getInstance();
  try {
    // 投稿を取得（ユーザー名、いいね数、返信数を含む）
    const posts = db.all(`
      SELECT 
        p.id,
        p.content,
        p.created_at,
        u.username,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT r.id) as reply_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN replies r ON p.id = r.post_id
      GROUP BY p.id, p.content, p.created_at, u.username
      ORDER BY p.created_at DESC
    `) as PostWithStats[];

    return NextResponse.json(posts);
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { content }: { content: string } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '投稿内容が必要です' },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { error: '投稿は280文字以内である必要があります' },
        { status: 400 }
      );
    }

    const db = DatabaseManager.getInstance();
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

      // 投稿を作成
      db.run(
        'INSERT INTO posts (user_id, content) VALUES (?, ?)',
        user.id, content.trim()
      );

      return NextResponse.json(
        { message: '投稿が作成されました' },
        { status: 201 }
      );

  } catch (error) {
    console.error('投稿作成エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
