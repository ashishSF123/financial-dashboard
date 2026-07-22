import type { Metadata } from "next"
import type React from "react"
import "./globals.css"
import { UserAvatar } from "@/components/user-avatar"
import { ThemeProvider } from "@/lib/theme-context"

export const metadata: Metadata = {
  title: "Ashish Financial Dashboard",
  description: "Personal Finance Dashboard with Live Editing",
  icons: { icon: "/icon.svg" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen transition-colors duration-300">
        <ThemeProvider>
          <div className="fixed top-4 right-6 z-[100]">
            <UserAvatar />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
