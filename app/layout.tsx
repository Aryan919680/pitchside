import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitchside — Find your next innings",
  description: "Discover cricket grounds, box cricket turfs and practice nets near you. Find your pitch with Pitchside.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
