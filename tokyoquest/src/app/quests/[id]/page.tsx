// app/quests/[id]/page.tsx

import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import QuestDetailClient from "./components/QuestDetailClient";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const revalidate = 86400; // 24時間キャッシュ（ISR）

interface QuestMeta {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    budget?: string;
    mapUrl?: string;
    onlyLocals?: string;
    officialUrl?: string;
}

interface Props {
    params: { id: string };
}

export default async function QuestDetailPage({ params }: Props) {
    // ① params は非同期APIになったので await してから使う
    const { id } = await params;

    // ② サーバーセッションをチェック
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    // ③ 内部の Next.js API Route を叩く（絶対URL＋Cookie を明示的に渡す）
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cookieHeader = cookies().toString();

    const res = await fetch(`${baseUrl}/api/quests/${id}/meta/`, {
        headers: {
            // HTTP-only Cookie を明示的に渡す
            cookie: cookieHeader,
        },
        next: { revalidate },
    });

    if (res.status === 401) {
        redirect("/login");
    }
    if (!res.ok) {
        return <p className="p-4 text-center">Quest が見つかりません。</p>;
    }
    const questMeta: QuestMeta = await res.json();

    // ④ クライアントコンポーネントをレンダー
    return <QuestDetailClient questMeta={questMeta} questId={Number(id)} />;
}
