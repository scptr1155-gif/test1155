import { NextResponse } from "next/server";
import { signToken, verifyToken } from "../../../lib/token";

export const runtime = "nodejs";

// Uygulama: code + state gönderir -> kullanıcı bilgisi + 30 günlük session döner.
export async function POST(req) {
  try {
    const { code, state } = await req.json();
    const p = verifyToken(code, "code");
    if (!p || typeof state !== "string" || p.state !== state) {
      return NextResponse.json({ error: "Kod geçersiz veya süresi dolmuş" }, { status: 401 });
    }
    const user = { uid: p.uid, name: p.name, email: p.email, picture: p.picture };
    const session = signToken({ typ: "session", ...user }, 60 * 60 * 24 * 30);
    return NextResponse.json({ user, session });
  } catch (e) {
    console.error("app-verify hata:", e && e.message);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
