import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/token";
import { findProject, secretMatches } from "../../../../lib/projects";

export const runtime = "nodejs";

// Proje sahibinin SUNUCUSU çağırır: appId + secret + code + state -> kullanıcı bilgisi.
export async function POST(req) {
  try {
    const { appId, secret, code, state } = await req.json();
    const project = await findProject(appId);
    if (!project || !secretMatches(project, secret))
      return NextResponse.json({ error: "Geçersiz appId veya secret" }, { status: 401 });
    const p = verifyToken(code, "code");
    if (!p || typeof state !== "string" || p.state !== state)
      return NextResponse.json({ error: "Kod geçersiz veya süresi dolmuş" }, { status: 401 });
    return NextResponse.json({ user: { uid: p.uid, name: p.name, email: p.email, picture: p.picture } });
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
