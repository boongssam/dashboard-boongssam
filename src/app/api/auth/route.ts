import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ ok: false, error: '서버에 ADMIN_PASSWORD가 설정되지 않았습니다.' }, { status: 500 });
  }

  return NextResponse.json({ ok: password === adminPassword });
}
