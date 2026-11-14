import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: {
    default: "오늘의 수산",
    template: "%s | 오늘의 수산",
  },
  description: "수산물 가격 변화와 시장 동향을 알아보는 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
