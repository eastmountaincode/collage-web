import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Body Language — Collaborative Collage",
  description: "A real-time collaborative collage. Add, move, resize, and rotate images together in real time.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Body Language",
    description: "A real-time collaborative collage. Add, move, resize, and rotate images together.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Body Language",
    description: "A real-time collaborative collage.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
