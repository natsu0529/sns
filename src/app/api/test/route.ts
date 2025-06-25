import { NextResponse } from 'next/server';

export async function GET() {
  console.log('TEST API CALLED!!!');
  return NextResponse.json({ message: 'test', data: [1, 2, 3] });
}
