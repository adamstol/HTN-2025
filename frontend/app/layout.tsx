import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script";
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Ember AI - Your AI uni superconnector",
  description: "Your AI superconnector I help you find exactly who you\'re looking for as you go through your day",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Simonetta:ital,wght@0,400;0,900;1,400;1,900&display=swap" rel="stylesheet" />
      </head>
      <Analytics />
      <Script src="https://cloud.umami.is/script.js" strategy="afterInteractive" data-website-id="81fcd805-b14a-4d2c-8186-332a9e0c7064"></Script>
      <body className={`${geistSans.className} antialiased min-h-screen`}>
        {/* <Header /> */}
        <Toaster />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          // disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
