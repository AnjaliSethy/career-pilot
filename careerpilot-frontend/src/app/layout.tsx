import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/common/providers";

export const metadata: Metadata = { title: "CareerPilot AI", description: "Your personal AI career assistant" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
