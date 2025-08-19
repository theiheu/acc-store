// Auto inventory syncing scheduler
// Periodically sync stock and base price from TapHoaMMO for products that
// have supplier.provider = "taphoammo" and supplier.autoSync = true.

import { dataStore } from "@/src/core/data-store";
import type { AdminProduct } from "@/src/core/admin";
import { TapHoaMMOClient } from "@/src/services/taphoammo";

const DEFAULT_INTERVAL_MS = Number(
  process.env.AUTO_SYNC_INTERVAL_MS || 5 * 60 * 1000
); // 5 minutes
const ENABLED =
  (process.env.AUTO_SYNC_ENABLED || "true").toLowerCase() !== "false";

function pickNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function syncOneProduct(p: AdminProduct) {
  if (!p.supplier?.kioskToken) return;
  try {
    const client = new TapHoaMMOClient({ kioskToken: p.supplier.kioskToken });
    const resp = await client.getStock();

    let stock: number | undefined;
    let basePrice: number | undefined;

    if (Array.isArray(resp)) {
      const item: any = resp[0];
      stock = pickNumber(item?.stock, p.stock ?? 0);
      basePrice = pickNumber(
        item?.price,
        p.supplier?.basePrice !== undefined
          ? p.supplier.basePrice
          : p.price ?? 0
      );
    } else if (resp && (resp as any).success === "true") {
      const obj: any = resp;
      stock = pickNumber(obj?.stock, p.stock ?? 0);
      basePrice = pickNumber(
        obj?.price,
        p.supplier?.basePrice !== undefined
          ? p.supplier.basePrice
          : p.price ?? 0
      );
    }

    if (typeof stock === "number" || typeof basePrice === "number") {
      const markup = p.supplier?.markupPercent ?? 0;
      const newPrice =
        basePrice && markup
          ? Math.round(basePrice * (1 + markup / 100))
          : p.price;
      dataStore.updateProduct(
        p.id,
        {
          stock: typeof stock === "number" ? stock : p.stock,
          price: typeof newPrice === "number" ? newPrice : p.price,
          supplier: {
            provider: "taphoammo",
            kioskToken: p.supplier.kioskToken,
            basePrice: basePrice ?? p.supplier?.basePrice,
            markupPercent: markup,
            lastStock: stock ?? p.supplier?.lastStock,
            lastSyncedAt: new Date(),
            autoSync: true,
          },
        },
        "system",
        "AutoSync"
      );
      console.log(
        `AutoSync: synced ${p.title} (stock=${stock}, basePrice=${basePrice}, price=${newPrice})`
      );
    }
  } catch (e) {
    console.error(`AutoSync: error syncing product ${p.id}`, e);
  }
}

async function runOneCycle() {
  try {
    const products = dataStore.getProducts();
    const candidates = products.filter(
      (p) =>
        p.isActive &&
        p.supplier?.provider === "taphoammo" &&
        p.supplier?.autoSync
    );
    if (candidates.length === 0) return;
    console.log(`AutoSync: running for ${candidates.length} products`);
    for (const p of candidates) {
      // Run sequentially to avoid rate limits
      // Could be parallel with Promise.allSettled if supplier allows
      // eslint-disable-next-line no-await-in-loop
      await syncOneProduct(p);
    }
  } catch (e) {
    console.error("AutoSync: cycle error", e);
  }
}

let intervalId: NodeJS.Timeout | null = null;

export function ensureAutoSyncStarted() {
  if (!ENABLED) return;
  // Only start once per process
  if ((globalThis as any).__autoSyncStarted) return;
  (globalThis as any).__autoSyncStarted = true;
  if (intervalId) return;
  intervalId = setInterval(runOneCycle, DEFAULT_INTERVAL_MS);
  // Kick off an immediate run at startup
  runOneCycle().catch(() => {});
  console.log(`AutoSync: started. Interval=${DEFAULT_INTERVAL_MS}ms`);
}

export function stopAutoSync() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    (globalThis as any).__autoSyncStarted = false;
    console.log("AutoSync: stopped");
  }
}
