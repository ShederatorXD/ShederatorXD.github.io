import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { EcoBot } from "@/components/EcoBot"

export const metadata: Metadata = {
  title: "EcoRide - Sustainable Transportation",
  description: "Join EcoRide and start earning EcoPoints while contributing to a greener future through sustainable transportation.",
  generator: "EcoRide",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="theme-transition">
        <AuthProvider>
          {children}
          <EcoBot />
        </AuthProvider>
      </body>
    </html>
  )
}
