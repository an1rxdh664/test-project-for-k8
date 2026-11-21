import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickForm — Simple form collection",
  description: "A clean, simple form to collect submissions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
