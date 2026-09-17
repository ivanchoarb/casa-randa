import type { Metadata } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { SmoothScrollProvider } from "@/lib/scroll/SmoothScrollProvider";
import { PopupDescuento } from "@/components/ui/PopupDescuento";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
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
    <html lang="es" className={`${archivo.variable} ${sourceSerif.variable} h-full antialiased`}>
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
