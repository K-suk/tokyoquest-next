// app/api/quests/saved/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL!; // 例: "http://127.0.0.1:8000/api"

export async function GET(request: NextRequest) {
  // 1) JWT-cookie を検証して accessToken を取り出す
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const authHeader = `Bearer ${token.accessToken}`;

  // 2) Django の get_saved_quests ビューを呼ぶ
  const apiUrl = `${BACKEND_URL}/quests/saved/`;
  const res = await fetch(apiUrl, {
    headers: { Authorization: authHeader },
    cache: "no-store",
  });

  if (res.status === 401) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!res.ok) {
    let message = "Failed to fetch saved quests";
    try {
      const errJson = await res.json();
      message = errJson.detail || message;
    } catch {
      // ignore
    }
    return new NextResponse(message, { status: res.status });
  }

  // 3) レスポンスをそのまま返却
  try {
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return new NextResponse("Internal Server Error: invalid JSON", {
      status: 500,
    });
  }
}
