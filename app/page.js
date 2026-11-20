import Logo from "../components/Logo";

export default function Home() {
  return (
    <main className="wrap">
      <div className="card">
        <Logo />
        <h1>GAME STAR</h1>
        <p>Giriş yapmak için Game Star uygulamasındaki <b>“Google ile Giriş Yap”</b> butonunu kullan.</p>
        <p className="small">Bu sayfa uygulama tarafından otomatik açılır.</p>
      </div>
    </main>
  );
}
