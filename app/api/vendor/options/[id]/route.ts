import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  return NextResponse.json({ data: { name: 'ヘルメット', price: 500 }, message: 'OK' });
}
export async function PUT(req: NextRequest) {
  return NextResponse.json({ success: true, message: 'Option updated' });
}
export async function DELETE(req: NextRequest) {
  return NextResponse.json({ success: true, message: 'Option deleted' });
}
