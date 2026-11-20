import { NextResponse } from "next/server";
import { verifyToken } from "../../../lib/token";
import { listProjects, createProject, buildSnippet, MODES } from "../../../lib/projects";

export const runtime = "nodejs";

function who(req) {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  return verifyToken(t, "session");
}
const fail = (e) => NextResponse.json({ error: e.message || "Hata" }, { status: e.status && e.status < 500 ? e.status : 500 });

export async function GET(req) {
  const s = who(req);
  if (!s) return NextResponse.json({ error: "Oturum geçersiz" }, { status: 401 });
  try {
    return NextResponse.json({ projects: await listProjects(s.uid) });
  } catch (e) {
    console.error("projects GET:", e.message);
    return fail(e);
  }
}

export async function POST(req) {
  const s = who(req);
  if (!s) return NextResponse.json({ error: "Oturum geçersiz" }, { status: 401 });
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 40)
      return NextResponse.json({ error: "Proje adı 2-40 karakter olmalı" }, { status: 400 });
    if (!MODES.includes(body.mode))
      return NextResponse.json({ error: "Geçersiz giriş türü" }, { status: 400 });
    const { project, secret } = await createProject(s.uid, name, body.mode);
    const origin = new URL(req.url).origin;
    return NextResponse.json({ project, secret, snippet: buildSnippet(origin, project.appId, project.mode) });
  } catch (e) {
    console.error("projects POST:", e.message);
    return fail(e);
  }
}
