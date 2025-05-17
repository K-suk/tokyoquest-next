// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    // すべてのマッチ対象パスでトークンをチェック
    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET, // 環境変数名に合わせてください
    });

    // ── ログインページへのアクセス制御 ──
    if (pathname === "/login") {
        if (token) {
            // すでにログイン済みならプロフィールへ
            const url = req.nextUrl.clone();
            url.pathname = "/profile";
            return NextResponse.redirect(url);
        }
        // 未ログインなら通常どおり /login へ
        return NextResponse.next();
    }

    // ── プロフィールページへのアクセス制御 ──
    if (pathname === "/profile") {
        if (!token) {
            // 未ログインならログインページへ
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
        // ログイン済みなら通常どおり /profile へ
        return NextResponse.next();
    }

    // 他のパスは何もしない
    return NextResponse.next();
}

// このミドルウェアを /login と /profile にだけ適用
export const config = {
    matcher: ["/login", "/profile"],
};
