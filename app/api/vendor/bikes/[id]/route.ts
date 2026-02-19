import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  return NextResponse.json({ data: { name: 'PCX 160' }, message: 'OK' });
}
export async function PUT(req: NextRequest) {
  return NextResponse.json({ success: true, message: 'Bike updated' });
}
export async function DELETE(req: NextRequest) {
  return NextResponse.json({ success: true, message: 'Bike deleted' });
}
