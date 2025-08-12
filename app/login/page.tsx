"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToastContext } from "@/src/components/ToastProvider";
import { useGlobalLoading } from "@/src/components/GlobalLoadingProvider";
import { signIn, getProviders, useSession } from "next-auth/react";
import LoadingSpinner from "@/src/components/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const error = searchParams.get("error");
  const { show } = useToastContext();
  const { withLoading } = useGlobalLoading();
  const { data: session, status } = useSession();

  const [providers, setProviders] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signingIn, setSigningIn] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already logged in
    if (status === "authenticated") {
      router.replace(next);
      return;
    }

    // Load providers
    getProviders().then((providers) => {
      setProviders(providers);
      setIsLoading(false);
    });
  }, [status, router, next]);

  useEffect(() => {
    // Handle OAuth errors
    if (error) {
      const errorMessages: Record<string, string> = {
        OAuthSignin: "Lỗi khi đăng nhập với nhà cung cấp",
        OAuthCallback: "Lỗi callback từ nhà cung cấp",
        OAuthCreateAccount: "Không thể tạo tài khoản",
        EmailCreateAccount: "Không thể tạo tài khoản với email",
        Callback: "Lỗi callback",
        OAuthAccountNotLinked: "Tài khoản chưa được liên kết",
        EmailSignin: "Không thể gửi email đăng nhập",
        CredentialsSignin: "Thông tin đăng nhập không hợp lệ",
        SessionRequired: "Vui lòng đăng nhập để tiếp tục",
        default: "Đã xảy ra lỗi khi đăng nhập",
      };

      show(errorMessages[error] || errorMessages.default);
    }
  }, [error, show]);

  async function handleProviderSignIn(
    providerId: string,
    providerName: string
  ) {
    setSigningIn(providerId);
    try {
      await withLoading(async () => {
        const result = await signIn(providerId, {
          callbackUrl: next,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        if (result?.url) {
          window.location.href = result.url;
        }
      }, `Đang đăng nhập với ${providerName}...`);
    } catch (error) {
      show("Không thể đăng nhập. Vui lòng thử lại.");
      console.error("Sign in error:", error);
    } finally {
      setSigningIn(null);
    }
  }

  // Show loading state while checking session or loading providers
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[calc(100dvh-80px)] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang tải...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-300/10 flex items-center justify-center">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">Chào mừng trở lại</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Đăng nhập để tiếp tục sử dụng ACC Store
          </p>
        </div>

        {/* Login Options */}
        <div className="p-6 space-y-4">
          {providers && Object.values(providers).length > 0 ? (
            <div className="space-y-3">
              {Object.values(providers).map((provider: any) => {
                const isSigningIn = signingIn === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    disabled={isSigningIn || signingIn !== null}
                    onClick={() =>
                      handleProviderSignIn(provider.id, provider.name)
                    }
                    className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-3 text-sm font-medium transition-all hover:bg-amber-50 dark:hover:bg-amber-300/10 hover:border-amber-300 dark:hover:border-amber-300/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSigningIn ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <ProviderIcon providerId={provider.id} />
                    )}
                    <span>
                      {isSigningIn
                        ? `Đang đăng nhập...`
                        : `Tiếp tục với ${provider.name}`}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-300/10 border border-amber-200 dark:border-amber-300/30">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Chưa cấu hình nhà cung cấp đăng nhập
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vui lòng liên hệ quản trị viên để thiết lập đăng nhập
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                Hoặc
              </span>
            </div>
          </div>

          {/* Back to Home */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            ← Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

// Provider icon component
function ProviderIcon({ providerId }: { providerId: string }) {
  const icons: Record<string, string> = {
    google: "🔍",
    facebook: "📘",
    github: "🐙",
    twitter: "🐦",
    discord: "🎮",
  };

  return (
    <span className="text-lg" aria-hidden>
      {icons[providerId] || "🔑"}
    </span>
  );
}
