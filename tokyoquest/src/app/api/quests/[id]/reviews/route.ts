// app/api/quests/[id]/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // 1) クエストIDを検証
  const { params } = await Promise.resolve(context);
  const questId = Number(params.id);
  if (!Number.isInteger(questId) || questId <= 0) {
    return new NextResponse("Bad Request: invalid quest id", { status: 400 });
  }

  // 2) サーバーサイドでトークンを取得
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const authHeader = `Bearer ${token.accessToken}`;

  // 3) Django の get_reviews エンドポイントへ GET
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/quests/${questId}/reviews/`;
  const res = await fetch(apiUrl, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });

  if (!res.ok) {
    const status = res.status;
    let message = "Failed to fetch reviews";
    try {
      const errText = await res.text();
      console.error(`Failed to fetch reviews (${status}): ${errText}`);
    } catch {
      // ignore
    }
    return new NextResponse(message, { status });
  }

  // 4) レスポンスボディを JSON として返却
  try {
    const reviews = await res.json();
    return NextResponse.json(reviews);
  } catch {
    return new NextResponse("Internal Server Error: invalid JSON", {
      status: 500,
    });
  }
}
