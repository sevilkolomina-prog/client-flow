"use client";

import { Geist, Geist_Mono } from "next/font/google";

import { Button } from "@/components/ui/button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Please try again. If the problem continues, refresh the page.
          </p>
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
