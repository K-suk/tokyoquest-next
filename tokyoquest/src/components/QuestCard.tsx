// src/components/QuestCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export type Quest = {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    is_saved: boolean;
};

interface QuestCardProps {
    quest: Quest;
}

export default function QuestCard({ quest }: QuestCardProps) {
    // サーバーから渡された is_saved を初期値にする
    const [saved, setSaved] = useState(quest.is_saved);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (saved || loading) {
            // すでに保存済み、または現在リクエスト中なら何もしない
            return;
        }
        setLoading(true);

        try {
            // Next.js API Route を呼び出す。ここで Cookie に入った JWT が自動で送信される
            const res = await fetch(`/api/quests/${quest.id}/actions/save/`, {
                method: "POST",
            });
            if (res.status === 401) {
                // 未認証なら /login へリダイレクト
                window.location.href = "/login";
                return;
            }
            if (!res.ok) {
                const errText = await res.text().catch(() => "Save failed");
                throw new Error(errText);
            }
            // 保存成功したら星を黄色に
            setSaved(true);
        } catch (err) {
            console.error(err);
            alert("Failed to save quest");
        } finally {
            setLoading(false);
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
                    disabled={saved || loading}
                    className={`absolute top-2 right-2 text-2xl ${saved ? "text-yellow-400" : "text-white"
                        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-label={saved ? "Saved" : "Save quest"}
                >
                    {saved ? "★" : "☆"}
                </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-3">
                <p className="line-clamp-2 font-bold">{quest.title}</p>
            </div>
        </div>
    );
}
