export const fetch = globalThis.fetch;

// TapHoaMMO API integration service
// All tokens must be provided via environment variables. We also keep safe defaults from the spec for local dev.
// Never expose these tokens to the client.

const USER_TOKEN = process.env.TAPHOAMMO_USER_TOKEN;
const KIOSK_TOKEN = process.env.TAPHOAMMO_KIOSK_TOKEN;
const MOCK_TAPHOAMMO =
  (process.env.MOCK_TAPHOAMMO || "").toLowerCase() === "true";

// Delay helpers for mock mode
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randomDelay = async (min = 1000, max = 3000) => {
  const d = Math.floor(Math.random() * (max - min + 1)) + min;
  await sleep(d);
};

export type BuyResponse = {
  success: string; // "true" | "false"
  order_id?: string;
  description?: string;
};

export type GetProductsResponse = {
  success: string; // "true" | "false"
  data?: Array<{ product: string }>;
  description?: string; // May contain "Order in processing!"
};

export type StockResponse =
  | {
      success: string;
      name: string;
      stock: string;
      price: string;
      description?: string;
    }
  | { success: string; description: string };

export class TapHoaMMOClient {
  private userToken: string;
  private kioskToken: string;

  constructor(opts?: { userToken?: string; kioskToken?: string }) {
    this.userToken = opts?.userToken ?? USER_TOKEN ?? "";
    this.kioskToken = opts?.kioskToken ?? KIOSK_TOKEN ?? "";
    if (!MOCK_TAPHOAMMO) {
      if (!this.userToken || !this.kioskToken) {
        throw new Error("Missing required TapHoaMMO API tokens.");
      }
    }
  }

  // Helper to do GET with timeout and robust errors
  private async getJson<T>(url: string, timeoutMs = 10000): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: "application/json" } as any,
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON from supplier: ${text.slice(0, 200)}`);
      }
      return json as T;
    } catch (e: any) {
      if (e.name === "AbortError")
        throw new Error("Yêu cầu đến nhà cung cấp bị quá thời gian");
      throw new Error(e?.message || "Lỗi gọi API nhà cung cấp");
    } finally {
      clearTimeout(timeout);
    }
  }

  // Purchase products
  async buyProducts(
    quantity: number,
    promotion?: string
  ): Promise<BuyResponse> {
    if (MOCK_TAPHOAMMO) {
      await randomDelay(1000, 3000);
      return { success: "true", order_id: `mock-order-${Date.now()}` };
    }
    const base = `https://taphoammo.net/api/buyProducts?kioskToken=${encodeURIComponent(
      this.kioskToken
    )}&userToken=${encodeURIComponent(
      this.userToken
    )}&quantity=${encodeURIComponent(String(quantity))}`;
    const url = promotion
      ? `${base}&promotion=${encodeURIComponent(promotion)}`
      : base;
    return this.getJson<BuyResponse>(url);
  }

  // Retrieve order products/credentials
  async getProducts(orderId: string): Promise<GetProductsResponse> {
    if (MOCK_TAPHOAMMO) {
      await randomDelay(1000, 3000);
      return {
        success: "true",
        data: [
          { product: "username:test_user" },
          { product: "password:secret123" },
        ],
      };
    }
    const url = `https://taphoammo.net/api/getProducts?orderId=${encodeURIComponent(
      orderId
    )}&userToken=${encodeURIComponent(this.userToken)}`;
    return this.getJson<GetProductsResponse>(url);
  }

  // Get stock and base price
  async getStock(): Promise<StockResponse | StockResponse[] | null> {
    const url = `https://taphoammo.net/api/getStock?kioskToken=${encodeURIComponent(
      this.kioskToken
    )}&userToken=${encodeURIComponent(this.userToken)}`;
    try {
      const resp = await this.getJson<any>(url);
      // Some providers return an array of products; others a single object as per spec examples
      return resp as any;
    } catch (e) {
      return null;
    }
  }
}

// Utility to parse returned credential string into structured fields where possible
export type AccountCredential = {
  username?: string;
  password?: string;
  token?: string;
  raw: string; // Always keep raw value
  extra?: Record<string, string>;
};

const CRED_PATTERNS: Array<{ key: keyof AccountCredential; regex: RegExp }> = [
  { key: "username", regex: /(user(name)?|tài khoản)\s*[:=\-]\s*([^\s\n]+)/i },
  { key: "password", regex: /(pass(word)?|mật khẩu)\s*[:=\-]\s*([^\s\n]+)/i },
  { key: "token", regex: /(token|mã)\s*[:=\-]\s*([^\s\n]+)/i },
];

export function parseCredential(raw: string): AccountCredential {
  const cred: AccountCredential = { raw };
  for (const p of CRED_PATTERNS) {
    const m = raw.match(p.regex);
    if (m) {
      // Value captured in last group
      (cred as any)[p.key] = (m[m.length - 1] || "").trim();
    }
  }
  return cred;
}
