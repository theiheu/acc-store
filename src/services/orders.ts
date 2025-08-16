export type CreateOrderRequest = {
  productId: string;
  quantity?: number; // default 1
  promotion?: string;
  selectedOptionId?: string;
};

export type CreateOrderSuccess = {
  success: true;
  data: {
    orderId: string;
    status?: "Đang chờ xử lý" | "Hoàn thành" | string;
    credentials?: Array<any>;
  };
};

export type CreateOrderFailure = {
  success: false;
  error: string;
};

export type CreateOrderResponse = CreateOrderSuccess | CreateOrderFailure;

export type ApiCallResult<T> = {
  status: number;
  ok: boolean;
  body: T;
};

export async function createOrder(
  payload: CreateOrderRequest,
  timeoutMs = 15000
): Promise<ApiCallResult<CreateOrderResponse>> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, quantity: payload.quantity ?? 1 }),
      signal: controller.signal,
    });
    const body = (await res.json()) as CreateOrderResponse;
    return { status: res.status, ok: res.ok, body };
  } finally {
    clearTimeout(t);
  }
}
