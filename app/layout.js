import "./globals.css";

export const metadata = {
  title: "Game Star",
  description: "Game Star hesabı ile giriş yap",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
