import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Japifon ChatHub',
  description:
    'Bandeja omnicanal para equipos de soporte y ventas impulsada por Japifon.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 font-sans antialiased text-slate-900`}
      >
        <AuthProvider>
          <div className="flex min-h-screen flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
