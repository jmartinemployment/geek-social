import type { Metadata } from "next";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/Toaster";
import "./globals.css";

// Served from the installed @fontsource-variable packages, not fetched from Google Fonts: the build
// made that request on every run, and it failed on CI runners intermittently ("An error occurred in
// next/font"), which took the whole build down with it.
const display = localFont({
  variable: "--font-display",
  src: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
});

const body = localFont({
  variable: "--font-body",
  src: "../../node_modules/@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2",
  weight: "200 900",
  style: "normal",
});

export const metadata: Metadata = {
  title: "GeekSocial",
  description: "Approve, edit or reject reply drafts, and publish link posts, for Geek @ Your Spot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
