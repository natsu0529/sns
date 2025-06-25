import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== CLEAN TEST API CALLED ===');
  
  const result = [
    { id: 1, content: 'Clean test 1', created_at: '2024-01-01', username: 'user1', like_count: 0, reply_count: 0 },
    { id: 2, content: 'Clean test 2', created_at: '2024-01-02', username: 'user2', like_count: 0, reply_count: 0 }
  ];
  
  console.log('Clean API returning:', result);
  return NextResponse.json(result);
}
