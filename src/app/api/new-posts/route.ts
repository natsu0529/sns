import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== NEW POSTS API START ===');
  
  const posts = [
    {
      id: 1,
      content: "新しいテスト投稿",
      created_at: "2024-01-01T00:00:00Z",
      username: "testuser",
      like_count: 0,
      reply_count: 0
    }
  ];
  
  console.log('Returning posts:', posts);
  
  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
