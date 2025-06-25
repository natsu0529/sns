import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== WORKING API CALLED ===');
  const testPosts = [
    { 
      id: 1, 
      content: 'Working Test Post 1', 
      created_at: new Date().toISOString(), 
      username: 'testuser', 
      like_count: 0, 
      reply_count: 0 
    },
    { 
      id: 2, 
      content: 'Working Test Post 2', 
      created_at: new Date().toISOString(), 
      username: 'testuser2', 
      like_count: 0, 
      reply_count: 0 
    }
  ];
  
  console.log('Returning working posts:', testPosts);
  return NextResponse.json(testPosts);
}
