import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { JWT } from "next-auth/jwt";

const backendURL = process.env.NEXT_PUBLIC_API_URL as string;

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
    // Secret for NextAuth.js
    secret: process.env.NEXTAUTH_SECRET,

    // Use JWT strategy for sessions
    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
    },

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ],
    callbacks: {
        // Called when user signs in
        async signIn({ account, user }) {
            try {
                const res = await axios.post(`${backendURL}/accounts/google/`, {
                    access_token: account?.access_token,
                    id_token: account?.id_token,
                });

                // Attach tokens and user info for jwt callback
                (user as any).access = res.data.access;
                (user as any).refresh = res.data.refresh;
                (user as any).user = res.data.user;

                return true;
            } catch (err) {
                console.error("JWT fetch failed:", err);
                return false;
            }
        },

        // Called to create or update JWT
        async jwt({ token, user }) {
            // Initial sign-in
            if (user && (user as any).access) {
                return {
                    accessToken: (user as any).access,
                    refreshToken: (user as any).refresh,
                    accessTokenExpires: Date.now() + 30 * 60 * 1000,
                    user: (user as any).user,
                };
            }

            // Return previous token if it's still valid
            if (
                token.accessTokenExpires &&
                Date.now() < token.accessTokenExpires
            ) {
                return token;
            }

            // Access token has expired, try to refresh it
            return await refreshAccessToken(token as JWT);
        },

        // Make JWT available in session
        async session({ session, token }) {
            session.accessToken = (token as any).accessToken;
            session.refreshToken = (token as any).refreshToken;
            session.error = (token as any).error;
            session.user = (token as any).user;
            return session;
        },
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
