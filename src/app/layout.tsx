import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "./contexts/NotificationContext";
import Notification from "@/components/Notification";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ★★★ <html>, <body>, <NotificationProvider> を一行に連結して空白を削除 ★★★
    <html 
      lang="en" 
      // ★ <html>に背景画像と bg-cover, bg-fixedを指定
      className="bg-center bg-cover bg-no-repeat bg-fixed bg-slate-900" 
      style={{ backgroundImage: "url('/images/Infopia_Login_Ragister_Background.png')" }}
    ><body 
        // ★ <body>はbg-transparent（透明）にし、<html>の背景が見えるようにする
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-transparent`}
      ><NotificationProvider>
        {children}
        <Notification />
      </NotificationProvider></body></html>
  );
}