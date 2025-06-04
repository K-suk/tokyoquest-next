// app/api/category/[category]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECRET = process.env.NEXTAUTH_SECRET!;

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  // ① params は await して展開
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);

  // ② HTTP-only Cookie から NextAuth の JWT を取り出す
  const token = await getToken({ req: request, secret: SECRET });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // ③ Django の /quests/search/?tag=<decodedCategory> を叩く
  const apiUrl = `${
    process.env.NEXT_PUBLIC_API_URL
  }/quests/search/?tag=${encodeURIComponent(decodedCategory)}`;

  let res;
  try {
    res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    console.error(">>> [category API] fetch error:", err);
    return new NextResponse("Service Unavailable", { status: 503 });
  }

  if (!res.ok) {
    let message = "Failed to fetch quests by category";
    try {
      const errJson = await res.json();
      message = errJson.detail || message;
    } catch {
      // ignore
    }
    return new NextResponse(message, { status: res.status });
  }

  try {
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return new NextResponse("Internal Server Error: invalid JSON", {
      status: 500,
    });
  }
}
