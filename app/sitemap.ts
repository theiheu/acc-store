import { MetadataRoute } from "next";
import { dataStore } from "@/src/core/data-store";
import { slugify } from "@/src/utils/slug";
import { CATEGORIES } from "@/src/core/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
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

  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${baseUrl}/products/${encodeURIComponent(c.id)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  const productUrls: MetadataRoute.Sitemap = dataStore
    .getActiveProducts()
    .map((p) => {
      const category = p.category;
      const slug = slugify(p.title);
      return {
        url: `${baseUrl}/products/${encodeURIComponent(
          category
        )}/${encodeURIComponent(slug)}`,
        lastModified: p.updatedAt || p.createdAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

  return [...staticPages, ...categoryUrls, ...productUrls];
}
