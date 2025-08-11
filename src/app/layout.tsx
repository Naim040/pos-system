import type { Metadata } from "next";
import "./globals.css";
import "../themes/theme-styles.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import InfoSignature from "@/components/InfoSignature";

export const metadata: Metadata = {
  title: "POS System",
  description: "Modern Point of Sale System",
  keywords: ["POS", "Point of Sale", "Retail", "Business"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans theme-transition">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <div className="fixed top-4 right-4 z-50">
              <ThemeSwitcher />
            </div>
            <div className="flex-1">
              {children}
            </div>
            <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 py-4">
                <div className="flex justify-center">
                  <InfoSignature />
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
