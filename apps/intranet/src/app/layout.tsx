import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "./providers";
import "./globals.css";

// 2026-09-29, at Ivan's request ("tampoco me gusta la de la intranet"):
// Archivo -> Inter, same swap as apps/web's body font. See globals.css
// for the wdth-axis note (Inter has no width axis, unlike Archivo).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Casa Randa · Intranet",
    template: "%s · Intranet",
  },
  description: "Reservas, calendario, operación, contabilidad y análisis de Casa Randa.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/*
          @refinedev/nextjs-router's RouteChangeHandler calls useSearchParams()
          internally, which forces Next.js to bail out of static generation for
          any page that renders it (notably the built-in /_not-found route)
          unless it's wrapped in Suspense — https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
        */}
        <Suspense>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
