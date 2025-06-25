import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 本番環境では無効化（セキュリティのため）
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 403 }
    );
  }

  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    timestamp: new Date().toISOString()
  };

  console.log('Environment debug info:', envInfo);
  
  return NextResponse.json(envInfo);
}
