// app/[category]/page.tsx

import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

type Quest = {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    tags: { id: number; name: string }[];
};

interface Props {
    params: { category: string };
}

export default async function CategoryPage({ params }: Props) {
    // （1） params は非同期 API になったので await して展開
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);

    // （2）cookie を await して文字列化
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // （3）getToken() で HTTP-only Cookie から JWT を取り出す
    const token = await getToken({
        req: { headers: { cookie: cookieHeader } },
        secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.accessToken) {
        // 未ログイン or トークン切れなら /login へ飛ばす
        redirect("/login");
    }

    // （4）Next.js の API Route を絶対 URL で叩く
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const apiUrl = `${baseUrl}/api/category/${encodeURIComponent(category)}`;
    const res = await fetch(apiUrl, {
        headers: { cookie: cookieHeader },
        cache: "no-store",
    });

    if (res.status === 401) {
        redirect("/login");
    }
    if (!res.ok) {
        return notFound();
    }

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
