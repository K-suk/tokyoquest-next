import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import React from 'react';
import QuestCard, { Quest } from '@/components/QuestCard';
import Image from 'next/image';

interface HomePageProps {
  searchParams: {
    category?: string;
    page?: string;
    page_size?: string;
  };
}

// Sample categories with icons
const categories = [
  { id: 1, name: 'Night Life', icon: '/images/categories/night_life_category.png' },
  { id: 2, name: 'Shibuya', icon: '/images/categories/Shibuya_area_category.png' },
  { id: 3, name: 'Shinjuku', icon: '/images/categories/Shinjuku_area_category.png' },
  { id: 4, name: 'Food', icon: '/images/categories/food_category.png' },
  { id: 5, name: 'Akihabara', icon: '/images/categories/anime_category.png' },
  { id: 6, name: 'Family', icon: '/images/categories/family_category.png' },
  { id: 7, name: 'Bar', icon: '/images/categories/alcohol_category.png' },
  { id: 8, name: 'Asakusa', icon: '/images/categories/asakusa_category.png' },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return null;
  }

  const { category, page = '1', page_size = '20' } = searchParams;
  const currentPage = parseInt(page, 10) || 1;

  const base = process.env.NEXT_PUBLIC_API_URL!;
  const path = category ? '/quests' : '/incomplete/';
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', page_size);
  if (category) params.set('category', category);
  const url = `${base}${path}?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('クエストの取得に失敗しました');
  const data = await res.json();

  const quests: Quest[] = Array.isArray(data) ? data : data.results;

  // Helper to build pagination links
  const makeLink = (targetPage: number) => {
    const q = new URLSearchParams();
    q.set('page', String(targetPage));
    q.set('page_size', page_size);
    if (category) q.set('category', category);
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

      {/* All Quests - Responsive Grid */}
      <section className="px-4 mt-8">
        <h2 className="text-2xl font-bold mb-4">All Quests</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quests.map((q) => (
            <Link href={`/quests/${q.id}`} key={q.id}>
              <QuestCard key={q.id} quest={q} />
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

          {data.next ? (
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