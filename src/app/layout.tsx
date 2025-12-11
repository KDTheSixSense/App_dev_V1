import { headers } from 'next/headers';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { PageViewLogger } from "@/components/features/audit/PageViewLogger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infopia",
  description: "情報学をゲーム感覚で学ぶ！",
  icons: {
    // 既にHeaderで使っている画像をそのまま指定できます
    icon: '/images/Kohaku/kohaku-normal.png',
    // iPhoneなどでホーム画面に追加した時のアイコンも指定したい場合
    apple: '/images/Kohaku/kohaku-normal.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = headers().get('x-nonce') || '';

  return (
    <html
      lang="en"
      //  <html>に背景画像と bg-cover, bg-fixedを指定
      className="bg-center bg-cover bg-no-repeat bg-fixed bg-slate-900"
      style={{ backgroundImage: "url('/images/Infopia_Login_Ragister_Background.png')" }}
    ><body
      // <body>はbg-transparent（透明）にし、<html>の背景が見えるようにする
      className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-transparent`}
      data-nonce={nonce} // For debugging CSP Nonce
    >
        {children}
        <Toaster position="bottom-right" toastOptions={{ style: { zIndex: 99999 } }} />
        <PageViewLogger />
      </body></html>
  );
}