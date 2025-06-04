// app/api/quests/[id]/actions/save/route.ts

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

  // ■ 3) Django の save_quest ビューを呼び出す
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/quests/${questId}/save/`;
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
  });

  if (!res.ok) {
    let errText: string;
    try {
      const errJson = await res.json();
      errText = errJson.detail || JSON.stringify(errJson);
    } catch {
      errText = "Save failed";
    }
    return new NextResponse(errText, { status: res.status });
  }

  // ■ 4) キャッシュを再検証
  revalidatePath(`/quests/${questId}`);

  return NextResponse.json({ success: true });
}
