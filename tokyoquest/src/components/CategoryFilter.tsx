"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = ["All", "Shibuya", "Akihabara", "Shinjuku", "Asakusa"];

export function CategoryFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const current = searchParams.get("category") || "All";

    const onSelect = (cat: string) => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        if (cat === "All") {
            params.delete("category");
        } else {
            params.set("category", cat);
        }
        const query = params.toString();
        router.push(query ? `/?${query}` : `/`, { shallow: true });
    };

    return (
        <div className="flex space-x-2 mb-4">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onSelect(cat)}
                    className={`px-3 py-1 rounded ${current === cat ? "bg-blue-500 text-white" : "bg-gray-200"
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
