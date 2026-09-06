import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://seraj-store.vercel.app"
  ),
  title: {
    default: "متجر سِراج — قصص أطفال وألعاب تعليمية وإسلامية وقصص مخصصة",
    template: "%s | سراج",
  },
  applicationName: "سِراج",
  description:
    "قصص أطفال عربية وإسلامية، وألعاب بازل وحساب، وقصص مخصصة باسم وصورة طفلك. اكتشف منتجات سراج وأدلة القراءة واللعب للأهل، مع توصيل داخل مصر.",
  authors: [{ name: "فريق سراج" }],
  creator: "سراج",
  publisher: "سراج",
  category: "كتب وقصص أطفال",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "متجر سِراج — قصص أطفال وألعاب تعليمية وإسلامية وقصص مخصصة",
    description:
      "قصص مخصصة باسم وصورة طفلك، وكتب وألعاب تعليمية عربية مصنوعة بحب في مصر.",
    type: "website",
    locale: "ar_EG",
    siteName: "سِراج",
    images: [
      {
        url: "/assets/social-card-1200x630.jpg",
        width: 1200,
        height: 630,
        alt: "شخصيات عالم سراج لقصص الأطفال العربية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "متجر سِراج — قصص أطفال وألعاب تعليمية وإسلامية وقصص مخصصة",
    description:
      "قصص مخصصة باسم وصورة طفلك، وكتب وألعاب تعليمية عربية.",
    images: ["/assets/social-card-1200x630.jpg"],
  },
  icons: {
    icon: [
      { url: "/assets/logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/logo/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/assets/logo/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "DoNNa-nsBoluQWt2zV0c7O-0u_p0Hf9bAywnawcL-Ss",
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
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-FZW3R2J7Y9"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FZW3R2J7Y9');
          `}
        </Script>
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
