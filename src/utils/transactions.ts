export function formatTransactionDescription(desc?: string, type?: string): string {
  const d = String(desc || "");
  if (type === "purchase") {
    // Remove leading "Mua sản phẩm " (case-insensitive) if present
    return d.replace(/^Mua sản phẩm\s*/i, "");
  }
  return d;
}

