import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { gitaLian } from './fonts'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Andrea & Isaac Wedding Planner",
  description: "Wedding planning dashboard for Andrea and Isaac",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${gitaLian.variable}`}>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Parisienne&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
