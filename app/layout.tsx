import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NextAuthSessionProvider from "@/components/NextAuthSessionProvide";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.empiresphere.com'),
  title: {
    default: "EmpireSphere - Secure File Storage and Sharing Platform",
    template: "%s | EmpireSphere"
  },
  description: "EmpireSphere: A professional file management platform offering secure uploads, API-driven file sharing, and intuitive file organization for individuals and businesses.",
  keywords: [
    "file storage",
    "file sharing",
    "API file management",
    "cloud storage",
    "secure file upload",
    "file hosting",
    "document management"
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.empiresphere.com",
    title: "EmpireSphere - Secure File Storage and Sharing Platform",
    description: "EmpireSphere: A professional file management platform offering secure uploads, API-driven file sharing, and intuitive file organization for individuals and businesses.",
    siteName: "EmpireSphere",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EmpireSphere - Secure File Management"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "EmpireSphere - Secure File Storage and Sharing Platform",
    description: "EmpireSphere: A professional file management platform offering secure uploads, API-driven file sharing, and intuitive file organization for individuals and businesses.",
    images: ["/twitter-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: "https://www.empiresphere.com"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any"/>{/* Remove whitespace */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>{/* Remove whitespace */}
        <meta name="theme-color" content="#000000"/>{/* Remove whitespace */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </body>
    </html>
  );
}