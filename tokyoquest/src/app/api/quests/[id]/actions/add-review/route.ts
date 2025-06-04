// app/api/quests/[id]/actions/add-review/route.ts

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // ■ 1) クエストIDを検証
  const { params } = await Promise.resolve(context);
  const questId = Number(params.id);
  if (!Number.isInteger(questId) || questId <= 0) {
    return new NextResponse("Bad Request: invalid quest id", { status: 400 });
  }

  // ■ 2) サーバーサイドでトークンを取得
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const authHeader = `Bearer ${token.accessToken}`;

  // ■ 3) ボディを JSON としてパース
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Bad Request: invalid JSON", { status: 400 });
  }
  const { rating, comment } = body;

  // ■ 4) rating の型・範囲チェック
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return new NextResponse(
      "Bad Request: rating must be an integer between 1 and 5",
      { status: 400 }
    );
  }

  // ■ 5) comment の型チェック（空白のみは不可、最大 500 文字）
  if (
    typeof comment !== "string" ||
    comment.trim().length === 0 ||
    comment.length > 500
  ) {
    return new NextResponse(
      "Bad Request: comment must be a non-empty string (max 500 characters)",
      { status: 400 }
    );
  }

  // ■ 6) Django の add_review エンドポイントへ POST
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/quests/${questId}/reviews/add/`;
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ rating: ratingNum, comment: comment.trim() }),
  });

  if (!res.ok) {
    let errText: string;
    try {
      const errJson = await res.json();
      errText = errJson.detail || JSON.stringify(errJson);
    } catch {
      errText = "Add review failed";
    }
    return new NextResponse(errText, { status: res.status });
  }

  // ■ 7) キャッシュを再検証
  revalidatePath(`/quests/${questId}`);

  return NextResponse.json({ success: true });
}
