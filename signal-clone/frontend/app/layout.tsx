import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Signal",
  description: "Say 'hello' to a different messaging experience.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-signal-bg text-signal-primary h-screen overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
