// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, Account, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { JWT } from "next-auth/jwt";

const backendURL = process.env.NEXT_PUBLIC_API_URL!;

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await axios.post(
      `${backendURL}/token/refresh/`,
      { refresh: token.refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    const refreshed = res.data; // { access: "...", refresh: "..."? }
    return {
      ...token,
      accessToken: refreshed.access,
      refreshToken: refreshed.refresh ?? token.refreshToken,
      accessTokenExpires: Date.now() + 30 * 60 * 1000,
    };
  } catch (error) {
    console.error("⚠️ RefreshAccessTokenError", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: User;
      account?: Account;
    }) {
      // First‐time sign in: exchange Google id_token for Django JWTs
      if (account && user) {
        try {
          const { data } = await axios.post(
            `${backendURL}/accounts/google/`,
            { access_token: account.access_token },
            { headers: { "Content-Type": "application/json" } }
          );
          return {
            ...token,
            accessToken: data.access,
            refreshToken: data.refresh,
            accessTokenExpires: Date.now() + 30 * 60 * 1000,
            user: {
              id: data.user.id,
              first_name: data.user.first_name,
              last_name: data.user.last_name,
              email: data.user.email,
            },
          };
        } catch (err) {
          console.error("⚠️ Error exchanging Google token:", err);
          return { ...token, error: "DjangoExchangeError" };
        }
      }

      // If still valid, just return the existing token
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Otherwise, refresh via Django
      if (token.refreshToken) {
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }: { session: any; token: JWT }) {
      // Do NOT copy token.accessToken or token.refreshToken into `session`.
      // Only expose public user info:
      session.user = {
        name: `${(token.user as any).first_name} ${
          (token.user as any).last_name
        }`.trim(),
        email: (token.user as any).email,
      };
      // That’s it—no session.accessToken here.
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
