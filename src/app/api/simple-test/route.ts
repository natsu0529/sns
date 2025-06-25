import { NextResponse } from 'next/server';

export async function GET() {
  console.log('SIMPLE TEST API CALLED');
  
  const testArray = [
    { id: 1, message: 'test 1' },
    { id: 2, message: 'test 2' }
  ];
  
  console.log('Returning test array:', testArray);
  
  return NextResponse.json(testArray);
}
