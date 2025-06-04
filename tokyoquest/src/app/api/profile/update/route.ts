// app/api/profile/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL!; // 例: "http://127.0.0.1:8000/api"

export async function PATCH(request: NextRequest) {
  // 1) JWT から accessToken を取り出す
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const authHeader = `Bearer ${token.accessToken}`;

  // 2) クライアントから送られてきた JSON ボディをパース
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Bad Request: invalid JSON", { status: 400 });
  }

  const { first_name, last_name, contact_address } = body;

  // 3) 必要なフィールドが揃っているかを軽くチェック
  if (
    typeof first_name !== "string" ||
    typeof last_name !== "string" ||
    typeof contact_address !== "string"
  ) {
    return new NextResponse("Bad Request: missing or invalid fields", {
      status: 400,
    });
  }

  // 4) Django のプロフィール更新エンドポイントを呼び出す
  const apiUrl = `${BACKEND_URL}/accounts/update/`;
  const res = await fetch(apiUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ first_name, last_name, contact_address }),
  });

  if (!res.ok) {
    // Django からエラーが返ってきた場合、そのままステータスとメッセージを返却
    let message = "Failed to update profile";
    try {
      const errJson = await res.json();
      message = errJson.detail || message;
    } catch {
      // JSON パースできない場合は既定メッセージ
    }
    return new NextResponse(message, { status: res.status });
  }

  // 5) 成功時に更新後のユーザー情報を取得して返却（Django の実装次第）
  try {
    const updated = await res.json();
    return NextResponse.json(updated);
  } catch {
    // 仮に Django が空レスポンスを返す場合はステータスだけ返す
    return new NextResponse(null, { status: 204 });
  }
}
