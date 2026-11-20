// Proje kayıtları: projects/<ownerKey>.json (kullanıcı başına bir dosya).
// Secret düz metin SAKLANMAZ, sadece SHA-256 özeti saklanır.
import crypto from "crypto";
import { readJson, writeJson } from "./github.js";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const ownerKeyOf = (uid) => sha256(uid).slice(0, 12);
const fileOf = (ownerKey) => `projects/${ownerKey}.json`;
const MAX_PROJECTS = 20;

export const MODES = ["normal", "advanced"];

export async function listProjects(uid) {
  const { data } = await readJson(fileOf(ownerKeyOf(uid)));
  return data.map(({ secretHash, ...pub }) => pub);
}

export async function createProject(uid, name, mode) {
  const ownerKey = ownerKeyOf(uid);
  const path = fileOf(ownerKey);
  const appId = `gs-${ownerKey}-${crypto.randomBytes(5).toString("hex")}`;
  const secret = `gss_${crypto.randomBytes(32).toString("base64url")}`;
  const project = {
    appId,
    name,
    mode,
    botProtection: mode === "advanced",
    createdAt: new Date().toISOString(),
    secretHash: sha256(secret),
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    const { sha, data } = await readJson(path);
    if (data.length >= MAX_PROJECTS) throw Object.assign(new Error("En fazla 20 proje oluşturabilirsin"), { status: 400 });
    if (data.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      throw Object.assign(new Error("Bu isimde bir projen zaten var"), { status: 409 });
    try {
      await writeJson(path, [...data, project], sha, `Proje oluşturuldu: ${name}`);
      const { secretHash, ...pub } = project;
      return { project: pub, secret };
    } catch (e) {
      if (e.status !== 409 && e.status !== 422) throw e; // sha çakışması: tekrar dene
    }
  }
  throw new Error("Kayıt çakışması, tekrar dene");
}

export async function findProject(appId) {
  const m = /^gs-([0-9a-f]{12})-[0-9a-f]{10}$/.exec(appId || "");
  if (!m) return null;
  const { data } = await readJson(fileOf(m[1]));
  return data.find((p) => p.appId === appId) || null;
}

export function secretMatches(project, secret) {
  if (typeof secret !== "string") return false;
  const a = Buffer.from(sha256(secret));
  const b = Buffer.from(project.secretHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function buildSnippet(origin, appId, mode) {
  return `<!-- Game Star Giriş (${mode === "advanced" ? "Gelişmiş / Bot Korumalı" : "Normal"}) -->
<a href="${origin}/login?app=${appId}">Game Star ile Giriş Yap</a>

// Sunucu tarafı doğrulama (Node.js). Secret'ı ASLA tarayıcı koduna koyma.
const r = await fetch("${origin}/api/v1/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    appId: "${appId}",
    secret: process.env.GAMESTAR_SECRET, // proje oluştururken verilen secret
    code, state,                         // giriş sonrası gelen değerler
  }),
});
const { user } = await r.json();`;
}
