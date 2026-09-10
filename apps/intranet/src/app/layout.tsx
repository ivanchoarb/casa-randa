import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "./providers";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
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
    <html lang="es" className={`${archivo.variable} h-full antialiased`}>
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
