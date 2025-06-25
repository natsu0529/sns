import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'OK', 
    data: [1, 2, 3], 
    timestamp: new Date().toISOString() 
  });
}
