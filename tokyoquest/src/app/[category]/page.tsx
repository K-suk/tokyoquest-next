import { notFound } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Quest = {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    tags: { id: number; name: string }[];
};

export default async function CategoryPage({ params }: { params: { category: string } }) {
    const { category } = await params; // await params as required by Next.js
    const decodedCategory = decodeURIComponent(category);

    // 認証トークン取得
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return notFound();

    // API URL組み立て
    const base = process.env.NEXT_PUBLIC_API_URL!;
    const url = `${base}/quests/search/?tag=${encodeURIComponent(decodedCategory)}`;

    // データ取得（認証ヘッダー付き）
    const res = await fetch(url, {
        cache: "no-store",
        headers: {
            'Authorization': 'Bearer ' + session.accessToken
        }
    });
    if (!res.ok) return notFound();
    const data = await res.json();
    const quests: Quest[] = Array.isArray(data) ? data : data.results;

    return (
        <main className="p-4">
            <h1 className="text-2xl font-bold mb-4">{decodedCategory} のクエスト</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quests.map((quest) => (
                    <div key={quest.id} className="relative rounded-lg overflow-hidden shadow-md">
                        <div className="relative w-full h-[180px]">
                            <Image
                                src={quest.imgUrl}
                                alt={quest.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-3">
                            <h3 className="font-bold truncate">{quest.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}