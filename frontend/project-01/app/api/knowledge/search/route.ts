import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Knowledge search coming soon' }, { status: 501 });
}
