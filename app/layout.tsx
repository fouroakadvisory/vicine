import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vicine",
  description: "Private directories for associations and communities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
