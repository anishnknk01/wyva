import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { MobileDetector } from "@/components/mobile/mobile-detector";
import { RoleProvider } from "@/lib/role-context";

// Single font — Inter replaced with system-ui fallback to eliminate a network request
const fontDisplay = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "WYSA — Find your vibe.",
  description:
    "WYSA is a Mangalore-based task marketplace. Post a task and get help from a nearby Wysa for errands, hangouts, exploring the city, elder assistance, and more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wysa",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Lets content extend into notch/home-indicator safe areas on iOS, which
  // the new mobile nav rail (src/components/mobile/mobile-nav-rail.tsx)
  // accounts for via env(safe-area-inset-*) padding. Has no visible effect
  // on desktop or on devices without a notch/rounded-corner display.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fontDisplay.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wysa" />
        <link rel="apple-touch-icon" href="/wysa-logo.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <RoleProvider>
          <MobileDetector />
          {children}
          <Toaster position="top-center" richColors />
        </RoleProvider>
      </body>
    </html>
  );
}
