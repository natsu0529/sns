import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('LIKE API HIT!');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const postId = resolvedParams.id;
    
    console.log('いいね処理:', { username: session.user.name, postId });
    
    // 一時的に成功レスポンスを返す（実際のDB操作は後で実装）
    return NextResponse.json({
      success: true,
      message: `投稿${postId}にいいねしました（テスト）`,
      liked: true
    });

  } catch (error) {
    console.error('いいねエラー:', error);
    return NextResponse.json(
      { error: 'いいね処理に失敗しました' },
      { status: 500 }
    );
  }
}
