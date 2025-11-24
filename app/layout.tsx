import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kurye Barkod İşleme ve Takip Paneli",
  description: "Kurye barkod işleme ve admin takip sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}


