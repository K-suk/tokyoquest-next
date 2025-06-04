// src/app/quests/[id]/components/QuestDetailClient.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { ArrowLeft, Star, Upload, Camera } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';
import Link from 'next/link';

interface QuestMeta {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    badget?: string;
    location?: string;
    tips?: string;
    officialUrl?: string;
    exampleUrl?: string;
}

interface StatusResponse {
    is_saved: boolean;
    is_completed: boolean;
}

interface Review {
    id: number;
    user: string;
    quest: number;
    rating: number;
    comment: string;
    created_at: string;
}

interface Props {
    questMeta: QuestMeta;
    questId: number;
}

export default function QuestDetailClient({ questMeta, questId }: Props) {
    const router = useRouter();

    // ■ 動的ステータス（Save / Complete）を取得
    const { data: statusData, error: statusError } = useSWR<StatusResponse>(
        `/api/quests/${questId}/status/`,
        async (url) => {
            const res = await fetch(url, { cache: 'no-store' });
            if (res.status === 401) {
                router.push('/login');
                throw new Error('Unauthorized');
            }
            if (!res.ok) {
                const text = await res.text();
                console.error('Failed to fetch status:', res.status, text);
                throw new Error('Failed to fetch status');
            }
            return res.json();
        }
    );

    // ■ 動的レビュー一覧を取得
    const { data: reviews, error: reviewsError } = useSWR<Review[]>(
        `/api/quests/${questId}/reviews/`,
        async (url) => {
            const res = await fetch(url, { cache: 'no-store' });
            if (res.status === 401) {
                router.push('/login');
                throw new Error('Unauthorized');
            }
            if (!res.ok) {
                const text = await res.text();
                console.error('Failed to fetch reviews:', res.status, text);
                throw new Error('Failed to fetch reviews');
            }
            return res.json();
        },
        { refreshInterval: 30000 }
    );

    // ■ レビュー投稿フォーム用ステート
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);

    // ■ Complete Quest 用ステート
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /** 平均レーティングを計算 */
    const averageRating = useMemo(() => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / reviews.length;
    }, [reviews]);

    /** 星アイコンを描画 */
    const renderStars = (rating: number) => {
        const filled = Math.round(rating);
        return [1, 2, 3, 4, 5].map((i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i <= filled ? 'fill-red-400 text-red-400' : 'text-gray-300'
                    }`}
            />
        ));
    };

    /** Save ボタン押下時 */
    const handleSave = async () => {
        try {
            const res = await fetch(`/api/quests/${questId}/actions/save/`, {
                method: 'POST',
            });
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Save failed');
            }
            // Save 後にステータスを再取得
            mutate(`/api/quests/${questId}/status/`);
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to save a quest');
        }
    };

    /** Complete Quest ボタン押下時 */
    const handleCompleteQuest = async () => {
        if (!selectedImage) return;
        setIsUploading(true);
        try {
            const res = await fetch(`/api/quests/${questId}/actions/complete/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64Image: selectedImage }),
            });
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Complete failed');
            }
            // Complete 後にステータスを再取得し、トップに戻る
            mutate(`/api/quests/${questId}/status/`);
            router.push('/');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to complete quest');
        } finally {
            setIsUploading(false);
        }
    };

    /** 画像選択時に Base64 をセット */
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleCaptureImage = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    /** レビュー投稿 */
    const submitReview = async () => {
        if (submittingReview || newRating === 0 || !newComment.trim()) return;
        setSubmittingReview(true);
        try {
            const res = await fetch(`/api/quests/${questId}/actions/add-review/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: newRating, comment: newComment }),
            });
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Add review failed');
            }
            // 投稿後にレビュー一覧を再取得
            mutate(`/api/quests/${questId}/reviews/`);
            setNewComment('');
            setNewRating(0);
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to post a review');
        } finally {
            setSubmittingReview(false);
        }
    };

    // -----------------------------------------
    // ■ ローディング・認証チェック
    // -----------------------------------------
    if (!statusData || statusError) {
        // statusError があれば未ログインか取得失敗 → ログインページへ
        if (statusError) router.push('/login');
        return (
            <div className="min-h-screen flex flex-col justify-center">
                <div role="status" className="flex justify-center items-center mb-4">
                    <svg
                        aria-hidden="true"
                        className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M100 50.5908C100 78.2051 77.6142
                         100.591 50 100.591C22.3858 100.591 0
                         78.2051 0 50.5908C0 22.9766 22.3858
                         0.59082 50 0.59082C77.6142 0.59082 100
                         22.9766 100 50.5908ZM9.08144 50.5908C9.08144
                         73.1895 27.4013 91.5094 50 91.5094C72.5987
                         91.5094 90.9186 73.1895 90.9186
                         50.5908C90.9186 27.9921 72.5987 9.67226 50
                         9.67226C27.4013 9.67226 9.08144 27.9921 9.08144
                         50.5908Z"
                            fill="currentColor"
                        />
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624
                         35.9116 97.0079 33.5539C95.2932 28.8227
                         92.871 24.3692 89.8167 20.348C85.8452
                         15.1192 80.8826 10.7238 75.2124
                         7.41289C69.5422 4.10194 63.2754 1.94025
                         56.7698 1.05124C51.7666 0.367541 46.6976
                         0.446843 41.7345 1.27873C39.2613 1.69328
                         37.813 4.19778 38.4501 6.62326C39.0873
                         9.04874 41.5694 10.4717 44.0505
                         10.1071C47.8511 9.54855 51.7191 9.52689
                         55.5402 10.0491C60.8642 10.7766 65.9928
                         12.5457 70.6331 15.2552C75.2735 17.9648
                         79.3347 21.5619 82.5849 25.841C84.9175
                         28.9121 86.7997 32.2913 88.1811
                         35.8758C89.083 38.2158 91.5421 39.6781
                         93.9676 39.0409Z"
                            fill="currentFill"
                        />
                    </svg>
                </div>
                <span className="flex justify-center mb-4">Loading Quest...</span>
            </div>
        );
    }

    // -----------------------------------------
    // ■ UI 描画
    // -----------------------------------------
    return (
        <div className="min-h-screen bg-white">
            {/* =========================================== */}
            {/* 1. レーティングバー & Save ボタン */}
            <div className="bg-black text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ArrowLeft
                        className="w-5 h-5 cursor-pointer"
                        onClick={() => router.back()}
                    />
                    <div className="flex items-center gap-1">
                        {renderStars(averageRating)}
                        <span className="ml-1 text-sm">{averageRating.toFixed(1)}</span>
                        <span className="ml-2 text-sm underline">
                            {reviews?.length ?? 0} Review
                            {reviews && reviews.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                <button
                    onClick={!statusData.is_saved ? handleSave : undefined}
                    disabled={statusData.is_saved}
                    className={`px-3 py-1 text-sm bg-black border border-white text-white rounded
            ${statusData.is_saved
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-800'
                        }`}
                >
                    {statusData.is_saved ? 'Saved' : 'Save'}
                </button>
            </div>

            {/* =========================================== */}
            {/* 2. メインコンテンツ（静的メタデータ部分） */}
            <div className="p-4">
                <div className="mb-4">
                    <Image
                        src={questMeta.imgUrl}
                        alt="Quest Hero"
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                    />
                </div>
                <h1 className="text-xl font-bold mb-3">{questMeta.title}</h1>
                <div className="mb-4 space-y-2">
                    <div className="text-sm">
                        <span className="font-medium">Budget:</span> {questMeta.badget}
                    </div>
                    <div className="text-sm">
                        <span className="font-medium">Map:</span>{' '}
                        <Link
                            href={questMeta.location || ''}
                            className="text-blue-500 underline text-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {questMeta.location}
                        </Link>
                    </div>
                </div>

                {/* =========================================== */}
                {/* 3. Complete Quest モーダル（動的部分） */}
                <Dialog.Root placement="center" motionPreset="slide-in-bottom">
                    <Dialog.Trigger asChild>
                        <Button
                            disabled={statusData.is_completed}
                            className={`w-full bg-red-500 hover:bg-red-600 text-white mb-6 py-6 rounded font-medium
                ${statusData.is_completed ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {statusData.is_completed ? 'Completed' : 'Complete Quest'}
                        </Button>
                    </Dialog.Trigger>
                    <Portal>
                        <Dialog.Backdrop />
                        <Dialog.Positioner>
                            <Dialog.Content className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                                <Dialog.Header className="mb-4">
                                    <Dialog.Title className="text-xl font-bold">
                                        Complete Quest
                                    </Dialog.Title>
                                    <Dialog.CloseTrigger asChild>
                                        <CloseButton size="sm" />
                                    </Dialog.CloseTrigger>
                                </Dialog.Header>
                                <Dialog.Body>
                                    <div className="space-y-4">
                                        <p className="text-gray-600 mb-4">
                                            Take a photo or upload an image to complete this quest!
                                        </p>

                                        <div className="flex gap-4 mb-4">
                                            <button
                                                onClick={handleCaptureImage}
                                                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                                            >
                                                <Camera className="w-5 h-5" />
                                                Take Photo
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                                            >
                                                <Upload className="w-5 h-5" />
                                                Upload Image
                                            </button>
                                        </div>

                                        {selectedImage && (
                                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200">
                                                <Image
                                                    src={selectedImage}
                                                    alt="Quest completion proof"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleCompleteQuest}
                                            disabled={!selectedImage || isUploading}
                                            className={`w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium
                        ${(!selectedImage || isUploading)
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : ''
                                                }`}
                                        >
                                            {isUploading ? 'Completing...' : 'Complete Quest'}
                                        </Button>
                                    </div>
                                </Dialog.Body>
                            </Dialog.Content>
                        </Dialog.Positioner>
                    </Portal>
                </Dialog.Root>

                {/* =========================================== */}
                {/* 4. Quest Detail（静的部分） */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold mb-3">Quest Detail</h2>
                    <p className="text-sm text-gray-700">{questMeta.description}</p>
                </section>

                {/* =========================================== */}
                {/* 5. Only locals knows（静的部分） */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold mb-3">Only locals knows</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {questMeta.tips}
                    </p>
                </section>

                {/* =========================================== */}
                {/* 6. Official Web site（静的部分） */}
                <section className="mb-6">
                    <h3 className="font-bold mb-2">Official Web site</h3>
                    <Link
                        href={questMeta.officialUrl || ''}
                        className="text-blue-500 underline text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {questMeta.officialUrl || 'No Official Website exists...'}
                    </Link>
                </section>

                {/* =========================================== */}
                {/* 7. Review Section（動的部分） */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold mb-4">Review</h2>
                    {reviews ? (
                        reviews.length > 0 ? (
                            reviews.map((r) => (
                                <div key={r.id} className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: r.rating }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="w-4 h-4 fill-red-400 text-red-400"
                                                />
                                            ))}
                                            {Array.from({ length: 5 - r.rating }).map((_, i) => (
                                                <Star
                                                    key={`empty-${i}`}
                                                    className="w-4 h-4 text-gray-300"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {r.created_at}
                                        </span>
                                    </div>
                                    <h4 className="font-bold mb-1">{r.user}</h4>
                                    <p className="text-sm text-gray-700">{r.comment}</p>
                                </div>
                            ))
                        ) : (
                            <div>Be the first person to explore this quest!</div>
                        )
                    ) : (
                        <div className="min-h-[200px] flex flex-col justify-center">
                            <div
                                role="status"
                                className="flex justify-center items-center mb-4"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142
                             100.591 50 100.591C22.3858 100.591 0
                             78.2051 0 50.5908C0 22.9766 22.3858
                             0.59082 50 0.59082C77.6142 0.59082 100
                             22.9766 100 50.5908ZM9.08144 50.5908C9.08144
                             73.1895 27.4013 91.5094 50 91.5094C72.5987
                             91.5094 90.9186 73.1895 90.9186
                             50.5908C90.9186 27.9921 72.5987 9.67226 50
                             9.67226C27.4013 9.67226 9.08144 27.9921 9.08144
                             50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624
                             35.9116 97.0079 33.5539C95.2932 28.8227
                             92.871 24.3692 89.8167 20.348C85.8452
                             15.1192 80.8826 10.7238 75.2124
                             7.41289C69.5422 4.10194 63.2754 1.94025
                             56.7698 1.05124C51.7666 0.367541 46.6976
                             0.446843 41.7345 1.27873C39.2613 1.69328
                             37.813 4.19778 38.4501 6.62326C39.0873
                             9.04874 41.5694 10.4717 44.0505
                             10.1071C47.8511 9.54855 51.7191 9.52689
                             55.5402 10.0491C60.8642 10.7766 65.9928
                             12.5457 70.6331 15.2552C75.2735 17.9648
                             79.3347 21.5619 82.5849 25.841C84.9175
                             28.9121 86.7997 32.2913 88.1811
                             35.8758C89.083 38.2158 91.5421 39.6781
                             93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                            </div>
                            <span className="flex justify-center mb-4">
                                Loading Reviews...
                            </span>
                        </div>
                    )}
                </section>

                {/* =========================================== */}
                {/* 8. Leave Review（動的部分） */}
                <section>
                    <h2 className="text-lg font-bold mb-4">Leave Review</h2>
                    <textarea
                        placeholder="Tell us about your experience!"
                        className="mb-4 min-h-[120px] w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    ></textarea>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                                key={i}
                                onClick={() => setNewRating(i)}
                                stroke={i <= newRating ? 'none' : 'currentColor'}
                                fill={i <= newRating ? '#f87171' : 'none'}
                                className={`w-6 h-6 cursor-pointer${i <= newRating
                                        ? 'text-red-400'
                                        : 'text-gray-300 hover:text-red-400'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="text-right">
                        <button
                            onClick={submitReview}
                            disabled={submittingReview || newRating === 0 || !newComment.trim()}
                            className={`bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded font-medium${submittingReview || newRating === 0 || !newComment.trim()
                                    ? ' opacity-50 cursor-not-allowed'
                                    : ''
                                }`}
                        >
                            {submittingReview ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
