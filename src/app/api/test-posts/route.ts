import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== テスト投稿API開始 ===');
  
  try {
    // テスト用の配列を返す
    const testPosts = [
      {
        id: 1,
        content: "テスト投稿1",
        created_at: new Date().toISOString(),
        username: "testuser",
        like_count: 0,
        reply_count: 0
      }
    ];
    
    console.log('テスト投稿を返します:', testPosts);
    return NextResponse.json(testPosts);
  } catch (error) {
    console.error('テストAPIエラー:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: 'POST method not implemented yet' }, { status: 501 });
}
