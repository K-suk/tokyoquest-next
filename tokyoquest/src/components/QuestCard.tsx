'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export type Quest = {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    is_saved: boolean;        // ← 追加
};

interface QuestCardProps {
    quest: Quest;
}

export default function QuestCard({ quest }: QuestCardProps) {
    const { data: session } = useSession();
    // 初期状態をサーバーからの is_saved で決定
    const [saved, setSaved] = useState(quest.is_saved);

    const handleSave = async () => {
        if (saved) {
            // すでに保存済みなら何もしない、もしくは解除処理を入れても良い
            return;
        }
        if (!session?.accessToken) {
            await signOut({ callbackUrl: '/login' });
            return;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/quests/${quest.id}/save/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                }
            );
            if (!res.ok) throw new Error('Save failed');
            setSaved(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative rounded-lg overflow-hidden shadow-md">
            <div className="relative w-full h-[200px]">
                <Image
                    src={quest.imgUrl}
                    alt={quest.title}
                    fill
                    className="object-cover"
                />
                <button
                    onClick={handleSave}
                    className={`absolute top-2 right-2 text-2xl ${saved ? 'text-yellow-400' : 'text-white'
                        }`}
                    aria-label={saved ? 'Saved' : 'Save quest'}
                >
                    {saved ? '★' : '☆'}
                </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-3">
                <p className="line-clamp-2 font-bold">{quest.title}</p>
            </div>
        </div>
    );
}
