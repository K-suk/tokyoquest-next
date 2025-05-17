// src/app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CategoryFilter } from "@/components/CategoryFilter";
import Link from "next/link";
import React from "react";
import Image from "next/image";

type Quest = {
  id: number;
  title: string;
  description: string;
  imgUrl: string;
  tags: Tag[];
};

type Tag = {
  id: number;
  name: string;
};

interface HomePageProps {
  searchParams: {
    category?: string;
    page?: string;
    page_size?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // 1. 認証チェック
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return;
  }

  // 2. クエリパラメータを取得
  const { category, page = "1", page_size } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  // 3. API URL 組み立て
  const base = process.env.NEXT_PUBLIC_API_URL!;
  // 未完了一覧 or カテゴリ絞り込み
  const path = category ? "/quests" : "/incomplete/";
  const params = new URLSearchParams();
  params.set("page", String(currentPage));
  if (page_size) params.set("page_size", page_size);
  if (category) params.set("category", category);

  const url = `${base}${path}?${params.toString()}`;

  // 4. データ取得
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("クエストの取得に失敗しました");
  const data = await res.json();
  // DRF ページネーション結果から配列取り出し
  const quests: Quest[] = Array.isArray(data) ? data : data.results;

  // 5. 前後リンク用 URL 構築ヘルパー
  const makeLink = (targetPage: number) => {
    const q = new URLSearchParams();
    q.set("page", String(targetPage));
    if (page_size) q.set("page_size", page_size);
    if (category) q.set("category", category);
    return `/?${q.toString()}`;
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">クエスト一覧</h1>
      <CategoryFilter />

      <ul className="space-y-4">
        {quests.map((q) => (
          <li
            key={q.id}
            className="border rounded-lg p-4 hover:shadow transition"
          >
            <h2 className="text-xl font-semibold">{q.title}</h2>
            <p className="mt-1 text-gray-600">{q.description}</p>
            <Image
              src={q.imgUrl}
              width={500}
              height={500}
              alt={q.title}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {q.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* ページネーション */}
      <nav className="flex justify-between items-center mt-6">
        {data.previous ? (
          <Link href={makeLink(currentPage - 1)}>
            <button className="px-4 py-2 bg-gray-200 rounded">前へ</button>
          </Link>
        ) : (
          <span />
        )}
        <span>Page {currentPage}</span>
        {data.next ? (
          <Link href={makeLink(currentPage + 1)}>
            <button className="px-4 py-2 bg-gray-200 rounded">次へ</button>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}