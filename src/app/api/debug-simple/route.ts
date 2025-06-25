import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== デバッグAPI開始 ===');
  
  const simpleArray = [1, 2, 3];
  console.log('シンプル配列:', simpleArray);
  
  return NextResponse.json(simpleArray);
}
