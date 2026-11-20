# Game Star – Site (Vercel + Firebase Google ve GitHub Girişi)

Akış:
1. Launcher tarayıcıda `SITE/login?port=PORT&state=STATE` açar.
2. Site Firebase ile Google girişi yaptırır, ID token'ı `/api/app-code`'a gönderir.
3. Sunucu token'ı doğrular, 2 dakikalık `code` üretir ve tarayıcıyı `http://127.0.0.1:PORT/callback?code=...&state=...` adresine yönlendirir.
4. Launcher `code`'u `/api/app-verify`'a gönderir, kullanıcı bilgisi + 30 günlük `session` alır.
5. Sonraki açılışlarda launcher `session`'ı `/api/app-me` ile doğrular (tekrar giriş gerekmez).

## 1) Yerelde çalıştır
```
npm install
copy .env.example .env.local     (Mac/Linux: cp .env.example .env.local)
npm run dev
```
`.env.local` içini doldur (aşağıya bak). Site: http://localhost:3000

## 2) Gerekli değişkenler
| Değişken | Nereden |
|---|---|
| NEXT_PUBLIC_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID / APP_ID | Firebase → Project settings → Your apps → Web → firebaseConfig |
| FIREBASE_SERVICE_ACCOUNT_B64 | Firebase → Project settings → Service accounts → "Generate new private key" ile inen JSON'un base64 hali |
| APP_TOKEN_SECRET | Kendi ürettiğin uzun rastgele metin |

Service account JSON → base64 (Windows PowerShell):
```
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\yol\serviceAccount.json")) | clip
```
(Panoya kopyalar, `.env.local`'e yapıştır.)

APP_TOKEN_SECRET üretmek için:
```
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**GİZLİ olanlar:** FIREBASE_SERVICE_ACCOUNT_B64 ve APP_TOKEN_SECRET. GitHub'a koyma, kimseyle paylaşma. İndirdiğin JSON dosyasını da repoya ekleme.

## 3) Vercel'e yükle
1. Projeyi GitHub reposuna push et (`.env.local` push edilmez, `.gitignore` engelliyor).
2. vercel.com → Add New → Project → repoyu seç.
3. **Environment Variables** kısmına yukarıdaki 6 değişkeni ekle (Production + Preview).
4. Deploy. Sonra Firebase → Authentication → Settings → **Authorized domains**'e Vercel alan adını ekle (örn. `game-star-site-xxxx.vercel.app`).
5. Deploy'dan sonra env değiştirirsen **Redeploy** et.

## 4) Launcher
`game_star_launcher_v2.py` içindeki `SITE_URL` değerini Vercel adresinle değiştir.

## Güvenlik notları
- Google token'ları URL'ye konmaz; sadece 2 dk ömürlü, imzalı `code` konur.
- `state` her girişte rastgele üretilir; launcher kendi ürettiğiyle eşleşmeyen callback'i reddeder.
- `code` stateless olduğu için 2 dk içinde tekrar kullanılabilir. Daha sıkı istersen Firestore ile tek kullanımlık hale getirilebilir.
- `session` launcher'ın config dosyasında düz metin saklanır. Süresi 30 gündür.

## GitHub girişi (Firebase tarafı)
1. Firebase → Authentication → Sign-in method → **Add new provider → GitHub** → Enable. Ekranda görünen **callback URL**'yi kopyala (`https://PROJE-ID.firebaseapp.com/__/auth/handler`).
2. github.com → Settings → Developer settings → **OAuth Apps → New OAuth App**:
   - Application name: `Game Star`
   - Homepage URL: Vercel adresin
   - Authorization callback URL: Firebase'den kopyaladığın URL
3. Register'dan sonra **Client ID**'yi kopyala, **Generate a new client secret** ile secret üret.
4. İkisini Firebase'deki GitHub ayarına yapıştırıp **Save** de. Client secret'ı başka yere yazma.

## Proje oluşturma (launcher → Vercel → GitHub)
- Launcher "Projeler → Oluştur": ad + giriş türü (Normal / Gelişmiş Bot Korumalı) → `POST /api/projects`.
- Sunucu appId + secret üretir. Secret yalnızca bir kez gösterilir; GitHub'a sadece SHA-256 özeti yazılır.
- Kayıtlar `GITHUB_REPO` içindeki `projects/<sahip>.json` dosyalarında tutulur. `vercel.json` bu commit'lerin yeniden deploy tetiklemesini engeller.
- Ek Vercel değişkenleri: `GITHUB_TOKEN`, `GITHUB_REPO` (opsiyonel `GITHUB_BRANCH`).
- `POST /api/v1/verify`: proje sahibinin sunucusu appId + secret + code + state ile kullanıcıyı doğrular.
- Henüz yapılmadı: `/login?app=APPID` ile üçüncü taraf yönlendirmesi ve gelişmiş modun bot koruması (zorluk testi, hız sınırı).
