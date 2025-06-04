// src/app/api/profile/get/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL!;
// 例: "http://127.0.0.1:8000/api"
// もし NEXT_PUBLIC_API_URL を設定していなければ、undefined になるので
// ここで強制的にビルドエラーになります。必ず .env.local に書いておくこと。

export async function GET(request: NextRequest) {
  // 1) JWT から accessToken を取り出す
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const authHeader = `Bearer ${token.accessToken}`;

  // 2) Django の /accounts/profile/ に中継
  const apiUrl = `${BACKEND_URL}/accounts/profile/`;
  console.log(">>> [Next.js] Forwarding to:", apiUrl);
  console.log(">>> [Next.js] Using Auth header:", authHeader);

  let res;
  try {
    res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
      cache: "no-store",
    });
  } catch (err) {
    console.error(">>> [Next.js] fetch error connecting to backend:", err);
    // もし Django サーバーが起動していなかったり、ホスト名が違う場合はこちらに来る
    return new NextResponse("Service Unavailable: cannot reach backend", {
      status: 503,
    });
  }

  if (!res.ok) {
    // Django から 401 や 500 が返ってくればそのまま流す
    let message = "Failed to fetch profile";
    try {
      const errJson = await res.json();
      message = errJson.detail || message;
    } catch {
      // JSON パースできなければ既定メッセージ
    }
    return new NextResponse(message, { status: res.status });
  }

  // 3) 成功時に JSON をそのまま返却
  try {
    const userData = await res.json();
    return NextResponse.json(userData);
  } catch {
    return new NextResponse("Internal Server Error: invalid JSON", {
      status: 500,
    });
  }
}
