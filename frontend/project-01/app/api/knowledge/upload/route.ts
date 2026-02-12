import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Document upload coming soon' }, { status: 501 });
}
