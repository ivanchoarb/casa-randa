import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "./providers";
import "./globals.css";

// 2026-09-29: Archivo -> Inter, same swap as apps/web's body font.
// 2026-09-30, at Ivan's request ("usa sans-serif como Open Sans, Roboto o
// Lato en párrafos, botones y menús" — he picked Lato after a live
// comparison): Inter -> Lato. See globals.css for the wdth-axis note
// (neither Inter nor Lato has a width axis, unlike Archivo).
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
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
    <html lang="es" className={`${lato.variable} h-full antialiased`}>
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
