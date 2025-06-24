import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import DatabaseManager from '@/lib/database';

// 型定義
interface ReplyRecord {
  id: number;
  content: string;
  created_at: string;
  username: string;
}

interface UserRecord {
  id: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;
  const db = new DatabaseManager();

  try {
    // 返信を取得
    const replies = db.all(`
      SELECT 
        r.id,
        r.content,
        r.created_at,
        u.username
      FROM replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.post_id = ?
      ORDER BY r.created_at ASC
    `, postId) as ReplyRecord[];

    return NextResponse.json(replies);
  } catch (error) {
    console.error('返信取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

export async function POST(
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

    const { content }: { content: string } = await request.json();
    const resolvedParams = await params;
    const postId = resolvedParams.id;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '返信内容が必要です' },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { error: '返信は280文字以内である必要があります' },
        { status: 400 }
      );
    }

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

      // 返信を作成
      db.run(
        'INSERT INTO replies (user_id, post_id, content) VALUES (?, ?, ?)',
        user.id, postId, content.trim()
      );

      return NextResponse.json(
        { message: '返信が作成されました' },
        { status: 201 }
      );

    } finally {
      db.close();
    }
  } catch (error) {
    console.error('返信作成エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
