// src/types/next-auth.d.ts

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    // クライアントに渡すのは公開してもよいユーザー情報だけにする
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      contact_address?: string;
      level?: number;
    };
    // accessToken や refreshToken は削除
    // error もクライアントに出さないので削除
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // サーバーサイド（API Route 内など）でのみ使う情報
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
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
