// app/api/quests/[id]/meta/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // params は async なので await してから使う
  const { id } = await params;
  const questId = Number(id);
  if (!Number.isInteger(questId) || questId <= 0) {
    return new NextResponse("Bad Request: invalid quest id", { status: 400 });
  }

  // サーバーサイドでトークンを取得
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const authHeader = `Bearer ${token.accessToken}`;

  // Django の quest_detail エンドポイントへ GET
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/quests/${questId}/`;
  let res;
  try {
    res = await fetch(apiUrl, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
  } catch (err) {
    console.error(">>> [Next.js] fetch error connecting to backend:", err);
    return new NextResponse("Service Unavailable", { status: 503 });
  }

  if (!res.ok) {
    const status = res.status;
    let message = "Quest not found";
    try {
      const errJson = await res.json();
      message = errJson.detail || message;
    } catch {
      // ignore
    }
    return new NextResponse(message, { status });
  }

  // レスポンスボディを JSON として返却
  try {
    const questDetailData = await res.json();
    return NextResponse.json(questDetailData);
  } catch {
    return new NextResponse("Internal Server Error: invalid JSON", {
      status: 500,
    });
  }
}
