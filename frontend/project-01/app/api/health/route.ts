import { NextResponse } from 'next/server';



export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
