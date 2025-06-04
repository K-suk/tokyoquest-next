// app/api/quests/incomplete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL!;
// 例: "http://127.0.0.1:8000/api"

export async function GET(request: NextRequest) {
  // 1) HTTP-only Cookie から JWT を取り出す
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const authHeader = `Bearer ${token.accessToken}`;

  // 2) クエリパラメータをそのまま Django に転送
  const url = new URL(request.url);
  const queryString = url.search;
  // 例: "?page=1&page_size=20"

  // Django 側では 'incomplete' はルーター登録でパス '/' 配下にあるため、
  // 正しくは `${BACKEND_URL}/incomplete/` を叩く必要がある
  const djangoUrl = `${BACKEND_URL}/incomplete/${queryString}`;

  let res;
  try {
    res = await fetch(djangoUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
      // キャッシュしない
      cache: "no-store",
    });
  } catch (err) {
    console.error(">>> [Next.js] fetch error connecting to backend:", err);
    return new NextResponse("Service Unavailable", { status: 503 });
  }

  // 3) Django 側のステータスをそのまま返す
  if (!res.ok) {
    let message = "Failed to fetch incomplete quests";
    try {
      const errJson = await res.json();
      message = errJson.detail || message;
    } catch {
      // JSON parse 失敗時は既定メッセージのまま
    }
    return new NextResponse(message, { status: res.status });
  }

  // 4) 成功時に JSON をそのまま返す
  try {
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return new NextResponse("Internal Server Error: invalid JSON", {
      status: 500,
    });
  }
}
