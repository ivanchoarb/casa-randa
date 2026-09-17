import type { Metadata } from "next";
import { HomeContent } from "../HomeContent";

// Same real content as "/", server-rendered in English by default — see
// LanguageProvider.tsx (initial language is derived from the pathname) and
// LangToggle.tsx (toggling on this page navigates to "/", not just the
// client-side state, so the URL and the visible language never disagree).
export const revalidate = 300;

const SITE_URL = "https://randahome.com";

export const metadata: Metadata = {
  title: "Casa Randa · Whole 6-bedroom house in Panama City",
  description:
    "A former Canal Zone house in Diablo Heights, Ancón. Six ensuite bedrooms, up to 16 guests. Book direct, no platform commission.",
  alternates: {
    canonical: "/en",
    languages: {
      es: "/",
      en: "/en",
    },
  },
  openGraph: {
    title: "Casa Randa · Whole 6-bedroom house in Panama City",
    description: "Six bedrooms, six bathrooms, one key. Book the whole house directly in Diablo Heights, Ancón.",
    url: `${SITE_URL}/en`,
    siteName: "Casa Randa",
    locale: "en_US",
    alternateLocale: "es_PA",
    type: "website",
    images: [{ url: "/images/sala-principal.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Casa Randa · Whole 6-bedroom house in Panama City",
    description: "Six bedrooms, six bathrooms, one key. Book direct in Diablo Heights, Ancón.",
    images: ["/images/sala-principal.jpg"],
  },
};

export default function Page() {
  return <HomeContent />;
}
