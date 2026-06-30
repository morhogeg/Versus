import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VersusAI — Who Would Win?",
  description:
    "A fighting-game-styled verdict machine. Pick two characters and an arena, get an opinionated, shareable verdict.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
