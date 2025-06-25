import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== FINAL TEST API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  const finalTestPosts = [
    { 
      id: 1, 
      content: 'Final Test Post 1', 
      created_at: new Date().toISOString(), 
      username: 'finaluser1', 
      like_count: 0, 
      reply_count: 0 
    },
    { 
      id: 2, 
      content: 'Final Test Post 2', 
      created_at: new Date().toISOString(), 
      username: 'finaluser2', 
      like_count: 1, 
      reply_count: 1 
    }
  ];
  
  console.log('Final API returning posts:', finalTestPosts);
  return NextResponse.json(finalTestPosts);
}
