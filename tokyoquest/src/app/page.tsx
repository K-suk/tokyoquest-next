// app/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import QuestCard, { Quest } from "@/components/QuestCard";
import Image from "next/image";
import { cookies } from "next/headers";

interface HomePageProps {
  searchParams: {
    category?: string;
    page?: string;
    page_size?: string;
  };
}

// Sample categories with icons
const categories = [
  { id: 1, name: "Night Life", icon: "/images/categories/night_life_category.png" },
  { id: 2, name: "Shibuya", icon: "/images/categories/Shibuya_area_category.png" },
  { id: 3, name: "Shinjuku", icon: "/images/categories/Shinjuku_area_category.png" },
  { id: 4, name: "Food", icon: "/images/categories/food_category.png" },
  { id: 5, name: "Akihabara", icon: "/images/categories/anime_category.png" },
  { id: 6, name: "Family", icon: "/images/categories/family_category.png" },
  { id: 7, name: "Bar", icon: "/images/categories/alcohol_category.png" },
  { id: 8, name: "Asakusa", icon: "/images/categories/asakusa_category.png" },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  // 1) サーバーセッションをチェック
  const session = await getServerSession(authOptions);
  if (!session) {
    // 未ログインなら画面をレンダリングせず、クライアント側で /login にリダイレクト想定
    return null;
  }

  // 2) クエリパラメータを読み取る
  const category = searchParams.category;
  const page = searchParams.page ?? "1";
  const page_size = searchParams.page_size ?? "20";
  const currentPage = parseInt(page, 10) || 1;

  // 3) Next.js API Route を叩いてデータを取得する
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("page_size", page_size);
  if (category) {
    params.set("category", category);
  }

  // Django 側のルーター設定に合わせてパスを切り替え
  // ──────────────────────────────────────────
  // ・カテゴリ検索がある → /api/quests/?page=… で QuestViewSet の list アクションを叩く
  // ・そうでない（未完了クエスト一覧）→ /api/incomplete/?page=… を叩く
  //    ※　Django 側の router.register(r'incomplete', QuestViewSet) によって
  //       「/incomplete/」エンドポイントが作られている
  const endpointPath = category ? "/api/quests" : "/api/quests/incomplete";
  // サーバーコンポーネント内から fetch するため、絶対 URL を指定する
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}${endpointPath}?${params.toString()}`;

  // HTTP-only Cookie をヘッダーに含める
  const cookieHeader = cookies().toString();
  const res = await fetch(url, {
    headers: {
      cookie: cookieHeader,
    },
    next: { revalidate: 60 },
  });

  if (res.status === 401) {
    return <p className="p-4 text-center">ログインが必要です。</p>;
  }
  if (!res.ok) {
    throw new Error("Failed to get quests");
  }

  const data = await res.json();
  // data が配列ならそのまま、ページネーション付きレスポンス ({"results": [...], "next": "...", …}) なら results を使う
  const quests: Quest[] = Array.isArray(data) ? data : data.results;

  // 4) Pagination 用リンク生成
  const makeLink = (targetPage: number) => {
    const q = new URLSearchParams();
    q.set("page", String(targetPage));
    q.set("page_size", page_size);
    if (category) q.set("category", category);
    return `/?${q.toString()}`;
  };

  return (
    <main className="pb-6">
      {/* Famous Categories */}
      <section className="px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">Famous Categories</h2>
        <div className="grid grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 relative mb-1">
                <Image
                  src={cat.icon}
                  alt={cat.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <span className="text-sm text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* All Quests */}
      <section className="px-4 mt-8">
        <h2 className="text-2xl font-bold mb-4">All Quests</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quests.map((q) => (
            <Link href={`/quests/${q.id}`} key={q.id}>
              <QuestCard quest={q} />
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-8 px-4">
          {currentPage > 1 ? (
            <Link
              href={makeLink(currentPage - 1)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Previous
            </Link>
          ) : (
            <div />
          )}

          <span className="text-gray-700">Page {currentPage}</span>

          {"next" in data && data.next ? (
            <Link
              href={makeLink(currentPage + 1)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Next
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>
    </main>
  );
}
