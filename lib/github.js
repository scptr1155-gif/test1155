// GitHub Contents API ile JSON dosyası okuma/yazma (proje kayıtları için).
const API = "https://api.github.com";

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // örn: scptr1155-gif/test1155
  if (!token || !repo) throw new Error("GITHUB_TOKEN / GITHUB_REPO tanımlı değil");
  return { token, repo, branch: process.env.GITHUB_BRANCH || "main" };
}

function call(method, path, body) {
  const { token, repo, branch } = cfg();
  const q = method === "GET" ? `?ref=${encodeURIComponent(branch)}` : "";
  return fetch(`${API}/repos/${repo}/contents/${path}${q}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "game-star-site",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

export async function readJson(path) {
  const res = await call("GET", path);
  if (res.status === 404) return { sha: null, data: [] };
  if (!res.ok) throw Object.assign(new Error(`GitHub okuma hatası (${res.status})`), { status: res.status });
  const j = await res.json();
  return { sha: j.sha, data: JSON.parse(Buffer.from(j.content, "base64").toString("utf8")) };
}

export async function writeJson(path, data, sha, message) {
  const { branch } = cfg();
  const body = {
    message,
    branch,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
    ...(sha ? { sha } : {}),
  };
  const res = await call("PUT", path, body);
  if (!res.ok) throw Object.assign(new Error(`GitHub yazma hatası (${res.status})`), { status: res.status });
}
