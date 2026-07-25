import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오큐브(주) — Embedded에서 AI까지",
  description:
    "산업 데이터를 이해하고 AI로 판단하며 현장의 실행과 자동화로 연결하는 오큐브 공식 홈페이지 검토본입니다.",
  icons: {
    icon: "/assets/ci_01.avif",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
