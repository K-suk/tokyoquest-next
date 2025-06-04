// app/api/quests/[id]/actions/complete/route.ts

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
  const base64Image = body.base64Image;

  // ■ 4) Base64 形式チェック（data:image/ で始まること）
  if (
    typeof base64Image !== "string" ||
    !base64Image.startsWith("data:image/")
  ) {
    return new NextResponse(
      "Bad Request: base64Image must be a data:image/... string",
      { status: 400 }
    );
  }

  // ■ 5) サイズ上限チェック（例：5MBまで）
  const MAX_BASE64_LENGTH = (5 * 1024 * 1024 * 4) / 3; // 約5MB相当
  if (base64Image.length > MAX_BASE64_LENGTH) {
    return new NextResponse("Request Entity Too Large", { status: 413 });
  }

  // ■ 6) Base64 → Blob 化
  let blob: Blob;
  try {
    const response = await fetch(base64Image);
    blob = await response.blob();
  } catch {
    return new NextResponse(
      "Bad Request: unable to convert base64Image to Blob",
      { status: 400 }
    );
  }

  // ■ 7) FormData に媒体ファイルを追加
  const formData = new FormData();
  formData.append("media", blob, "completion.jpg");

  // ■ 8) Django の complete_quest エンドポイントへ POST
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/quests/${questId}/complete/`;
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  });

  if (!res.ok) {
    let errText: string;
    try {
      const errJson = await res.json();
      errText = errJson.detail || JSON.stringify(errJson);
    } catch {
      errText = "Complete failed";
    }
    return new NextResponse(errText, { status: res.status });
  }

  // ■ 9) キャッシュを再検証
  revalidatePath(`/quests/${questId}`);

  return NextResponse.json({ success: true });
}
