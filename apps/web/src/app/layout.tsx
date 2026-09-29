import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { SmoothScrollProvider } from "@/lib/scroll/SmoothScrollProvider";
import { PopupDescuento } from "@/components/ui/PopupDescuento";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import "./globals.css";

// 2026-09-29, at Ivan's request ("no me gusta la tipografía"): swapped the
// display/body pair from Archivo+Source Serif to Fraunces+Inter — flips
// which font carries the loud voice (a serif display now, per the
// "Hotel NuVe Heritage" reference audit) instead of the sans doing all the
// heavy lifting. Every component reads the semantic --font-display/
// --font-body tokens (see globals.css), never these two directly, so this
// is the only file besides globals.css that needed to change.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = "https://randahome.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Casa Randa · Casa completa de 6 habitaciones en Ciudad de Panamá",
    template: "%s · Casa Randa",
  },
  description:
    "Casa de la antigua Zona del Canal en Diablo Heights, Ancón. Seis habitaciones con baño privado, hasta 16 huéspedes. Reserva directa sin comisión de plataforma.",
  alternates: {
    canonical: "/",
    languages: {
      es: "/",
      en: "/en",
    },
  },
  openGraph: {
    title: "Casa Randa · Casa completa de 6 habitaciones en Ciudad de Panamá",
    description:
      "Seis habitaciones, seis baños, una sola llave. Alquiler directo de la casa entera en Diablo Heights, Ancón.",
    url: SITE_URL,
    siteName: "Casa Randa",
    locale: "es_PA",
    alternateLocale: "en_US",
    type: "website",
    images: [{ url: "/images/sala-principal.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Casa Randa · Casa completa de 6 habitaciones en Ciudad de Panamá",
    description: "Seis habitaciones, seis baños, una sola llave. Reserva directa en Diablo Heights, Ancón.",
    images: ["/images/sala-principal.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SmoothScrollProvider>
          <LanguageProvider>
            {children}
            <PopupDescuento />
            <WhatsAppButton />
          </LanguageProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
