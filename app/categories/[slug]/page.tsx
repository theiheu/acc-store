import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dataStore } from "@/src/core/data-store";
import CategoryLandingClient from "@/src/components/CategoryLandingClient";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = dataStore.getCategoryBySlug(params.slug);
  if (!category || !category.isActive) {
    return {
      title: "Danh mục không tồn tại",
      robots: { index: false },
    };
  }
  const title = `${category.name} - Mua giá rẻ, chất lượng | ${
    process.env.NEXT_PUBLIC_SITE_NAME || "Web bán acc"
  }`;
  const description =
    category.description ||
    `Khám phá các sản phẩm thuộc danh mục ${category.name}. Giá tốt, giao dịch nhanh chóng, an toàn.`;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/categories/${
    category.slug
  }`;
  const image = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/og/category/${
    category.slug
  }`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function CategoryLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = dataStore.getCategoryBySlug(params.slug);
  if (!category || !category.isActive) {
    notFound();
  }
  return (
    <CategoryLandingClient
      slug={params.slug}
      category={{
        id: category.id,
        name: category.name,
        description: category.description || "",
      }}
    />
  );
}
