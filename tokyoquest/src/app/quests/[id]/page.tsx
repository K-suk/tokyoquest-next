// app/quests/[id]/page.tsx
import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import QuestDetailClient from './components/QuestDetailClient';

interface QuestDetail {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    budget?: string;
    mapUrl?: string;
    onlyLocals?: string;
    officialUrl?: string;
    averageRating: number;
    reviewCount: number;
    reviews: {
        id: number;
        rating: number;
        date: string;
        title: string;
        comment: string;
    }[];
}

interface Params {
    params: { id: string };
}

export default async function QuestDetailPage({ params }: Params) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
        // ログインしていなければ何も返さない or リダイレクト
        return null;
    }

    // Django の quest_detail エンドポイントを叩く
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/quests/${params.id}/`,
        {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
            cache: 'no-store', // 常に最新を取得
        }
    );
    if (!res.ok) {
        return <p className="p-4 text-center">Quest not found.</p>;
    }

    const quest: QuestDetail = await res.json();

    return <QuestDetailClient quest={quest} />;
}
