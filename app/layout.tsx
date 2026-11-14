import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Comic Drama Studio",
  description: "AI-driven comic drama creation workflow platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
