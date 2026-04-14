import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://seraj-store.vercel.app"
  ),
  title: "سِراج — متعة القراءة واللعب",
  description:
    "قصص مخصصة باسم طفلك — مصنوعة بحب في مصر. كتب أطفال بجودة عالية بتعلّم القيم والمغامرة. اطلبي قصة بطلك النهاردة!",
  openGraph: {
    title: "سِراج — متعة القراءة واللعب",
    description:
      "قصص مخصصة باسم طفلك — مصنوعة بحب في مصر. كتب أطفال بجودة عالية بتعلّم القيم والمغامرة.",
    type: "website",
    locale: "ar_EG",
    siteName: "سِراج",
    images: [
      {
        url: "/assets/share-banner.jpg",
        width: 1200,
        height: 630,
        alt: "سِراج — متعة القراءة واللعب",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سِراج — متعة القراءة واللعب",
    description:
      "قصص مخصصة باسم طفلك — مصنوعة بحب في مصر.",
    images: ["/assets/share-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <head>
        <link rel="icon" type="image/svg+xml" href="/assets/logo/logo-icon.svg" />
        <link rel="apple-touch-icon" href="/assets/logo/logo-icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;600;700;800&family=Tajawal:wght@400;500;700;900&family=Lalezar&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
