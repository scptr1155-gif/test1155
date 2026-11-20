"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithGoogle, signInWithGitHub } from "../../lib/firebase";
import Logo from "../../components/Logo";

const STATE_RE = /^[A-Za-z0-9_-]{16,128}$/;

function LoginInner() {
  const params = useSearchParams();
  const port = Number(params.get("port"));
  const state = params.get("state") || "";
  const valid = Number.isInteger(port) && port >= 1024 && port <= 65535 && STATE_RE.test(state);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", kind: "" });

  async function handleLogin(kind) {
    setBusy(true);
    setMsg({ text: kind === "github" ? "GitHub ile giriş yapılıyor..." : "Google ile giriş yapılıyor...", kind: "" });
    try {
      const idToken = kind === "github" ? await signInWithGitHub() : await signInWithGoogle();

      setMsg({ text: "Doğrulanıyor...", kind: "" });
      const res = await fetch("/api/app-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, state }),
      });
      const data = await res.json();
      if (!res.ok || !data.code) throw new Error(data.error || "Doğrulama başarısız");

      setMsg({ text: "Giriş başarılı! Uygulamaya yönlendiriliyorsun...", kind: "ok" });
      window.location.href =
        `http://127.0.0.1:${port}/callback?code=${encodeURIComponent(data.code)}&state=${encodeURIComponent(state)}`;
    } catch (e) {
      const code = e && e.code;
      let text = e && e.message ? e.message : "Bir hata oluştu";
      if (code === "auth/popup-closed-by-user") text = "Giriş penceresi kapatıldı.";
      if (code === "auth/popup-blocked") text = "Tarayıcı açılır pencereyi engelledi. İzin verip tekrar dene.";
      if (code === "auth/unauthorized-domain") text = "Bu alan adı Firebase'de yetkili değil (Authorized domains).";
      if (code === "auth/account-exists-with-different-credential")
        text = "Bu e-posta ile daha önce başka bir yöntemle (Google veya GitHub) giriş yapılmış. Önceki yöntemi kullan.";
      setMsg({ text, kind: "err" });
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <div className="card">
        <Logo />
        <h1>GAME STAR</h1>
        {valid ? (
          <>
            <p>Devam etmek için bir yöntem seç.</p>
            <button className="btn" onClick={() => handleLogin("google")} disabled={busy}>
              <GoogleIcon /> Google ile Giriş Yap
            </button>
            <button className="btn dark" onClick={() => handleLogin("github")} disabled={busy}>
              <GitHubIcon /> GitHub ile Giriş Yap
            </button>
            <div className={`msg ${msg.kind}`}>{msg.text}</div>
            <p className="small">Giriş sonrası otomatik olarak uygulamaya döneceksin.</p>
          </>
        ) : (
          <p>Geçersiz bağlantı. Lütfen girişi Game Star uygulamasından başlat.</p>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/>
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.9 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
