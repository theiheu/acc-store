import { MetadataRoute } from "next";
import { dataStore } from "@/src/core/data-store";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Active category landing pages
  try {
    const categories = dataStore.getActiveCategories();
    for (const c of categories) {
      routes.push({
        url: `${baseUrl}/categories/${encodeURIComponent(c.slug)}`,
        lastModified: c.updatedAt || c.createdAt || now,
        changeFrequency: "daily",
        priority: 0.85,
      });
    }
  } catch {}

  return routes;
}
