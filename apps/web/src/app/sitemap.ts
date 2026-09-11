import type { MetadataRoute } from "next";

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
    {
      url: "https://randahome.com/tienda",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
