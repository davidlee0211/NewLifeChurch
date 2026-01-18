import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#4285F4",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://modoosunday.com"),
  title: "모두의주일학교",
  description: "모두의주일학교",
  manifest: "/manifest.json",
  keywords: ["주일학교", "교회", "달란트", "출석", "QT"],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "모두의주일학교",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://modoosunday.com",
    siteName: "모두의주일학교",
    title: "모두의주일학교",
    description: "모두의주일학교",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "모두의주일학교",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "모두의주일학교",
    description: "모두의주일학교",
    images: ["/og-image.png"],
  },
  verification: {
    google: "구글서치콘솔_인증코드",
    other: {
      "naver-site-verification": "네이버서치어드바이저_인증코드",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
