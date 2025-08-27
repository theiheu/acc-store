import { notFound, redirect } from "next/navigation";
import ProductDetailClient from "../ProductDetailClient";

export default async function ProductCatchAllPage({
  params,
}: {
  params: Promise<{ parts?: string[] }>;
}) {
  const { parts = [] } = await params;

  // If no segment provided, go back to listing
  if (!parts || parts.length === 0) {
    redirect("/products");
  }

  // Use the last segment as id-or-slug candidate.
  // The ProductDetailClient will resolve it via /api/products/resolve.
  const candidate = parts[parts.length - 1];

  if (!candidate) {
    notFound();
  }

  return <ProductDetailClient initialId={candidate} />;
}

