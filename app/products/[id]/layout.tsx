import type { Metadata } from "next";
import { dataStore } from "@/src/core/data-store";
import { slugify } from "@/src/utils/slug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = dataStore.getProduct(id);
  if (!p) return {};

  const title = `${p.title} | Mua tài khoản ${p.category} giá tốt`;
  const description =
    p.description || `Mua ${p.title} uy tín, giao dịch nhanh chóng.`;
  const canonical = `/products/${p.category}/${slugify(p.title)}`;
  const images = p.imageUrl ? [p.imageUrl] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images,
      type: "website",
      siteName: "ACC Store",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children as any;
}
