import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { dataStore } from "@/src/core/data-store";

const providers = [] as any[];

// Only add Google provider if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Only add Facebook provider if credentials are available
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

function resolveRole(email?: string | null): "admin" | "user" {
  if (!email) return "user";
  const envAdmins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (envAdmins.includes(email.toLowerCase())) return "admin";
  const existing = dataStore.getUserByEmail(email);
  if (existing?.role === "admin") return "admin";
  return "user";
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      try {
        // Ensure the user exists in the in-memory dataStore even after server restarts
        if (session?.user?.email) {
          const existing = dataStore.getUserByEmail(session.user.email);
          if (!existing) {
            dataStore.createUser({
              email: session.user.email,
              name: session.user.name || session.user.email.split("@")[0],
              role: resolveRole(session.user.email),
              status: "active",
              balance: 0,
              totalOrders: 0,
              totalSpent: 0,
              registrationSource: "session",
            });
          } else {
            // Update lastLoginAt occasionally
            const now = new Date();
            const lastLogin = existing.lastLoginAt || new Date(0);
            const timeDiff = now.getTime() - lastLogin.getTime();
            const fiveMinutes = 5 * 60 * 1000;
            if (timeDiff > fiveMinutes) {
              dataStore.updateUser(existing.id, { lastLoginAt: now });
            }
          }
        }
      } catch (e) {
        console.warn("session callback ensure user failed:", e);
      }
      // propagate role to session
      if (session?.user) {
        (session.user as any).role =
          (token as any)?.role || resolveRole(session.user.email);
      }
      return session;
    },
    async jwt({ token }) {
      // enrich token with role
      if (token?.email) {
        (token as any).role = resolveRole(token.email as string);
      }
      return token;
    },
    async signIn({ user, account }) {
      try {
        if (user.email && user.name) {
          const existingUser = dataStore.getUserByEmail(user.email);
          const role = resolveRole(user.email);
          if (!existingUser) {
            dataStore.createUser({
              email: user.email,
              name: user.name,
              role,
              status: "active",
              balance: 0,
              totalOrders: 0,
              totalSpent: 0,
              registrationSource: account?.provider || "unknown",
            });
          } else {
            dataStore.updateUser(existingUser.id, {
              lastLoginAt: new Date(),
              role: existingUser.role || role,
            });
          }
        }
        return true;
      } catch (error) {
        console.error("Error creating user in data store:", error);
        return true;
      }
    },
  },
};
