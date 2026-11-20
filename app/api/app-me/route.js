import { NextResponse } from "next/server";
import { verifyToken } from "../../../lib/token";

export const runtime = "nodejs";

// Uygulama: kayıtlı session gönderir -> hâlâ geçerliyse kullanıcıyı döner.
export async function POST(req) {
  try {
    const { session } = await req.json();
    const p = verifyToken(session, "session");
    if (!p) return NextResponse.json({ error: "Oturum geçersiz" }, { status: 401 });
    return NextResponse.json({
      user: { uid: p.uid, name: p.name, email: p.email, picture: p.picture },
    });
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
