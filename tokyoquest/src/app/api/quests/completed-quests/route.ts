import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(request: NextRequest) {
  // 1) サーバーサイドで JWT から accessToken を取得
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const authHeader = `Bearer ${token.accessToken}`;

  // 2) Django の「完了済みクエスト取得」エンドポイントを呼び出す
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/completed-quests/`;
  const res = await fetch(apiUrl, {
    headers: {
      Authorization: authHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Django から 401/404/500 などが返ってきた場合、そのままステータスとメッセージを返却
    let message = "Failed to fetch completed quests";
    try {
      const errJson = await res.json();
      message = errJson.detail || message;
    } catch {
      // JSON パース失敗時は既定のメッセージ
    }
    return new NextResponse(message, { status: res.status });
  }

  // 3) 正常にデータを取得 → クライアント向けにそのまま返す
  try {
    const completedData = await res.json();
    // 例えば completedData が QuestCompletionSerializer の配列であれば、
    // コンポーネントが想定するクエストIDやタイトルなどをそのまま含む想定です。
    return NextResponse.json(completedData);
  } catch {
    return new NextResponse("Internal Server Error: invalid JSON", {
      status: 500,
    });
  }
}
