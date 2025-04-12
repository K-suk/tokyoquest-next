import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { JWT } from "next-auth/jwt";

const backendURL = process.env.NEXT_PUBLIC_DJANGO_PUBLIC_API_URL as string;

async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        const res = await axios.post(`${backendURL}/token/refresh/`, {
            refresh: token.refreshToken,
        });

        const refreshed = res.data;

        return {
            ...token,
            accessToken: refreshed.access,
            refreshToken: refreshed.refresh ?? token.refreshToken,
            accessTokenExpires: Date.now() + 1 * 60 * 1000,
        };
    } catch (error) {
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ],
    callbacks: {
        // サインイン時：DjangoからJWT取得
        async signIn({ account, user }) {
            try {
                const res = await axios.post(`${backendURL}/accounts/google/`, {
                    access_token: account?.access_token,
                    id_token: account?.id_token,
                });

                user.access = res.data.access;
                user.refresh = res.data.refresh;
                user.user = res.data.user;

                return true;
            } catch (err) {
                console.error("JWT fetch failed:", err);
                return false;
            }
        },

        // JWT 作成 or 更新
        async jwt({ token, user }) {
            if (user?.access && user?.refresh) {
                return {
                    accessToken: user.access,
                    refreshToken: user.refresh,
                    accessTokenExpires: Date.now() + 1 * 60 * 1000,
                    user: user.user,
                };
            }

            if (
                token.accessTokenExpires &&
                Date.now() < token.accessTokenExpires
            ) {
                return token;
            }

            return await refreshAccessToken(token);
        },

        // セッションにトークンを渡す
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.error = token.error;
            session.user = token.user;
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
