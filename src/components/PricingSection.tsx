"use client";

import Link from "next/link";
import { formatVND } from "@/src/utils/currency";
import { useToastContext } from "@/src/components/ToastProvider";

type DepositQuery = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

type Href = { pathname: string; query?: DepositQuery };

type Plan = {
  id: string;
  name: string;
  price: number;
  popular: boolean;
  features: string[];
  href: Href;
};

export default function PricingSection() {
  const plans: Plan[] = [
    {
      id: "starter",
      name: "Starter",
      price: 19000,
      popular: false,
      features: ["Cơ bản", "1 tài khoản", "Hỗ trợ qua email"],
      href: { pathname: "/deposit" },
    },
    {
      id: "premium",
      name: "Premium",
      price: 49000,
      popular: true,
      features: ["Đủ tính năng", "1 tài khoản", "Bảo hành 7 ngày"],
      href: { pathname: "/deposit" },
    },
    {
      id: "team",
      name: "Team",
      price: 99000,
      popular: false,
      features: ["Dành cho nhóm", "3 tài khoản", "Ưu tiên hỗ trợ"],
      href: { pathname: "/deposit" },
    },
  ];
  const { show } = useToastContext();

  function withUtm(query: DepositQuery, planId: string): Href {
    return {
      pathname: "/deposit",
      query: {
        ...query,
        utm_source: "homepage",
        utm_medium: "pricing",
        utm_campaign: planId,
      },
    };
  }

  return (
    <section className="w-full">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold">Bảng giá</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chọn gói phù hợp cho nhu cầu của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-white dark:bg-gray-900 shadow-sm overflow-hidden transition-colors
                ${
                  plan.popular
                    ? "border-amber-300 dark:border-amber-300/60"
                    : "border-gray-200 dark:border-gray-800"
                }
              `}
            >
              {plan.popular && (
                <div className="absolute right-3 top-3 rounded-full bg-amber-300 text-gray-900 text-xs font-medium px-2 py-0.5">
                  Phổ biến
                </div>
              )}

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{plan.name}</h3>
                  <div className="mt-2 text-3xl font-bold tabular-nums">
                    {formatVND(plan.price)}
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5">✅</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  onClick={() => show("Đã chuyển sang trang thanh toán")}
                  href={withUtm(plan.href.query ?? {}, plan.id)}
                  className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium
        ${
          plan.popular
            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
            : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        }
      `}
                >
                  Chọn gói
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
