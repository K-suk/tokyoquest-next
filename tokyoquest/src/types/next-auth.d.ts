// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken: string;
        refreshToken: string;
        error?: string;
        user: {
            id: string;
            email: string;
            first_name: string;
            last_name: string;
            contact_address?: string;
            level?: number;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken: string;
        refreshToken: string;
        accessTokenExpires: number;
        error?: string;
        user: Session["user"];
    }
}
