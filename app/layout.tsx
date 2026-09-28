import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LingoFrame — Learn English from real videos",
  description: "Turn authentic English videos into structured, personal lessons.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
