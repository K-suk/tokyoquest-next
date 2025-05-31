"use client";

import Link from "next/link";
import { useCompletedQuests } from "@/hooks/useCompletedQuests";
import { useSession } from "next-auth/react";
import QuestCard from "@/components/QuestCard";

export default function CompletedQuests() {
    const { data: session } = useSession();
    const { completedQuests, isLoading, isError } = useCompletedQuests(session);

    if (isLoading) {
        return <div className="mt-6 p-4">Loading Copleted Quests...</div>;
    }

    if (isError) {
        return <div className="mt-6 p-4 text-red-500">Failed to retrieve Completed Quests</div>;
    }

    if (!completedQuests?.length) {
        return <div className="mt-6 p-4">It is time to start your journey to explore tokyo with new way!!</div>;
    }

    return (
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Completed Quests</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {completedQuests.map((quest) => (
                    <Link href={`/quests/${quest.id}`} key={quest.id}>
                        <QuestCard quest={quest} />
                    </Link>
                ))}
            </div>
        </div>
    );
} 