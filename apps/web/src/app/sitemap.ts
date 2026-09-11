import type { MetadataRoute } from "next";
import { PLACES } from "./que-hacer-en-panama/places";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: "https://randahome.com",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://randahome.com/que-hacer-en-panama",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...PLACES.map((p) => ({
      url: `https://randahome.com/que-hacer-en-panama/${p.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    {
      url: "https://randahome.com/tienda",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
