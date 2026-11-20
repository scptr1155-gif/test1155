import { NextResponse } from "next/server";
import { adminAuth } from "../../../lib/firebaseAdmin";
import { signToken, STATE_RE } from "../../../lib/token";

export const runtime = "nodejs";

// Tarayıcı: Firebase ID token + state gönderir -> kısa ömürlü "code" döner.
export async function POST(req) {
  try {
    const { idToken, state } = await req.json();
    if (typeof idToken !== "string" || typeof state !== "string" || !STATE_RE.test(state)) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const decoded = await adminAuth().verifyIdToken(idToken);
    const code = signToken(
      {
        typ: "code",
        state,
        uid: decoded.uid,
        name: decoded.name || (decoded.email ? decoded.email.split("@")[0] : "Kullanıcı"),
        email: decoded.email || "",
        picture: decoded.picture || "",
      },
      120 // 2 dakika
    );
    return NextResponse.json({ code });
  } catch (e) {
    console.error("app-code hata:", e && e.message);
    return NextResponse.json({ error: "Doğrulama başarısız" }, { status: 401 });
  }
}
