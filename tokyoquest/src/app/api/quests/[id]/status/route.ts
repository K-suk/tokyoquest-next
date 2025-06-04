// app/api/quests/[id]/status/route.ts

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

  // 3) is_saved を取得
  const savedUrl = `${process.env.NEXT_PUBLIC_API_URL}/quests/${questId}/is_saved/`;
  const resSaved = await fetch(savedUrl, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });
  if (!resSaved.ok) {
    let message = "Failed to fetch save status";
    try {
      const errJson = await resSaved.json();
      message = errJson.detail || message;
    } catch {
      // ignore
    }
    return new NextResponse(message, { status: resSaved.status });
  }

  let savedData: any;
  try {
    savedData = await resSaved.json();
  } catch {
    return new NextResponse(
      "Internal Server Error: invalid JSON for save status",
      { status: 500 }
    );
  }

  // 4) is_completed を取得
  const completedUrl = `${process.env.NEXT_PUBLIC_API_URL}/quests/${questId}/is_completed/`;
  const resCompleted = await fetch(completedUrl, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });
  if (!resCompleted.ok) {
    let message = "Failed to fetch complete status";
    try {
      const errJson = await resCompleted.json();
      message = errJson.detail || message;
    } catch {
      // ignore
    }
    return new NextResponse(message, { status: resCompleted.status });
  }

  let completedData: any;
  try {
    completedData = await resCompleted.json();
  } catch {
    return new NextResponse(
      "Internal Server Error: invalid JSON for complete status",
      { status: 500 }
    );
  }

  // 5) Boolean 型にキャストして返却
  return NextResponse.json({
    is_saved: Boolean(savedData.is_saved),
    is_completed: Boolean(completedData.is_completed),
  });
}
