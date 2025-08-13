import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { dataStore } from "@/src/core/data-store";

const providers = [];

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

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
    async signIn({ user, account, profile }) {
      try {
        // When user signs in, create or update them in the data store
        if (user.email && user.name) {
          // Check if user already exists
          const existingUser = dataStore.getUserByEmail(user.email);

          if (!existingUser) {
            // Create new user in data store
            const newUser = dataStore.createUser({
              email: user.email,
              name: user.name,
              role: "user",
              status: "active",
              balance: 0,
              totalOrders: 0,
              totalSpent: 0,
              registrationSource: account?.provider || "unknown",
            });

            console.log("New user created in data store:", newUser.email);
          } else {
            // Update last login time
            dataStore.updateUser(existingUser.id, {
              lastLoginAt: new Date(),
            });

            console.log("Existing user login updated:", existingUser.email);
          }
        }

        return true;
      } catch (error) {
        console.error("Error creating user in data store:", error);
        // Don't block login if data store fails
        return true;
      }
    },
  },
};
