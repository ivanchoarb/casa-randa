import type { MetadataRoute } from "next";
import { obtenerLugares } from "@/lib/guia";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const lugares = await obtenerLugares();
  return [
    {
      url: "https://randahome.com",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://randahome.com/en",
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
    ...lugares.map((p) => ({
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
