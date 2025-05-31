"use client"

import { ArrowLeft, Star, Upload, Camera } from "lucide-react"
import Image from "next/image"
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import React, { useMemo, useState, useRef } from 'react';
import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react"

interface Review {
    id: number;
    rating: number;
    date: string;
    title: string;
    comment: string;
}

interface QuestDetail {
    id: number;
    title: string;
    description: string;
    imgUrl: string;
    badget?: string;
    location?: string;
    tips?: string;
    officialUrl?: string;
    averageRating: number;
    reviewCount: number;
    reviews: Review[];
    is_saved: boolean;
}

interface Props {
    quest: QuestDetail;
}

export default function TokyoQuestPage({ quest }: Props) {
    const router = useRouter();
    const { data: session } = useSession();
    const [saved, setSaved] = useState(false);

    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const submitReview = async () => {
        if (!session?.accessToken || submittingReview || newRating === 0) return;
        setSubmittingReview(true);
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/quests/${quest.id}/reviews/add/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ rating: newRating, comment: newComment }),
            }
        );
        if (res.ok) {
            setNewComment('');
            setNewRating(0);
            router.refresh();
        }
        setSubmittingReview(false);
    };
    const handleSave = async () => {
        if (!session?.accessToken) {
            await signOut({ callbackUrl: '/login' });
            return;
        }
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/quests/${quest.id}/save/`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            }
        );
        if (res.ok) setSaved(true);
    };

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
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleCompleteQuest = async () => {
        if (!selectedImage || !session?.accessToken) return;

        setIsUploading(true);
        try {
            // Base64データURLからBlobを作成
            const response = await fetch(selectedImage);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append('media', blob, 'quest-completion.jpg');

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/quests/${quest.id}/complete/`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    body: formData,
                }
            );

            if (res.ok) {
                router.push(`/`);
            } else {
                const errorData = await res.json();
                console.error('Error completing quest:', errorData);
                // エラーメッセージをユーザーに表示する処理を追加することもできます
            }
        } catch (error) {
            console.error('Error completing quest:', error);
        } finally {
            setIsUploading(false);
        }
    };

    // 1. クライアント側で平均点を計算する
    const averageRating = useMemo(() => {
        if (quest.reviews.length === 0) return 0;
        const sum = quest.reviews.reduce((acc, r) => acc + r.rating, 0);
        return sum / quest.reviews.length;
    }, [quest.reviews]);

    // 2. 星アイコンを出し分ける関数
    const renderStars = (rating: number) => {
        const filled = Math.round(rating);
        return [1, 2, 3, 4, 5].map(i => (
            <Star
                key={i}
                className={`w-4 h-4 ${i <= filled
                    ? 'fill-red-400 text-red-400'
                    : 'text-gray-300'}
        `}
            />
        ));
    };
    return (
        <div className="min-h-screen bg-white">

            {/* Rating Bar */}
            <div className="bg-black text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ArrowLeft className="w-5 h-5 cursor-pointer" onClick={() => router.back()} />
                    <div className="flex items-center gap-1">
                        {renderStars(averageRating)}
                        <span className="ml-1 text-sm">
                            {averageRating.toFixed(1)}
                        </span>
                        <span className="ml-2 text-sm underline">
                            {quest.reviews.length} Review{quest.reviews.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <button
                    onClick={(!quest.is_saved || saved) ? handleSave : undefined}
                    disabled={quest.is_saved}
                    className={`px-3 py-1 text-sm bg-black border border-white text-white rounded ${quest.is_saved ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
                        }`}
                >
                    {quest.is_saved ? 'saved' : 'save'}
                </button>
            </div>

            {/* Main Content */}
            <div className="p-4">
                {/* Hero Image */}
                <div className="mb-4">
                    <Image
                        src={quest.imgUrl}
                        alt="Akihabara anime district"
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                    />
                </div>

                {/* Quest Title */}
                <h1 className="text-xl font-bold mb-3">{quest.title}</h1>

                {/* Budget and Map */}
                <div className="mb-4 space-y-2">
                    <div className="text-sm">
                        <span className="font-medium">Budget:</span> {quest.badget}
                    </div>
                    <div className="text-sm">
                        <span className="font-medium">Map:</span>{" "}
                        <a href={quest.location} className="text-blue-500 underline text-xs" target="_blank">
                            {quest.location}
                        </a>
                    </div>
                </div>

                <Dialog.Root placement="center" motionPreset="slide-in-bottom">
                    <Dialog.Trigger asChild>
                        <Button variant="outline" size="sm" className="w-full bg-red-500 hover:bg-red-600 text-white mb-6 py-6 rounded font-medium">
                            Complete Quest
                        </Button>
                    </Dialog.Trigger>
                    <Portal>
                        <Dialog.Backdrop />
                        <Dialog.Positioner>
                            <Dialog.Content className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                                <Dialog.Header className="mb-4">
                                    <Dialog.Title className="text-xl font-bold">Complete Quest</Dialog.Title>
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
                                            className={`w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium ${(!selectedImage || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
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

                {/* Quest Detail */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold mb-3">Quest Detail</h2>
                    <p className="text-sm text-gray-700">
                        {quest.description}
                    </p>
                </section>

                {/* Only locals knows */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold mb-3">Only locals knows</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {quest.tips}
                    </p>
                </section>

                {/* Official Web site */}
                <section className="mb-6">
                    <h3 className="font-bold mb-2">Official Web site</h3>
                    <a href="#" className="text-blue-500 underline text-sm">
                        {quest.officialUrl}
                    </a>
                </section>

                {/* Review Section */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold mb-4">Review</h2>
                    {quest.reviews.map((r) => (
                        <div key={r.id} className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1">
                                    {/* rating に合わせて色を分ける例 */}
                                    {Array.from({ length: r.rating }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-red-400 text-red-400" />
                                    ))}
                                    {Array.from({ length: 5 - r.rating }).map((_, i) => (
                                        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">{r.date}</span>
                            </div>
                            <h4 className="font-bold mb-1">{r.title}</h4>
                            <p className="text-sm text-gray-700">{r.comment}</p>
                        </div>
                    ))}

                    {/* More Reviews Button */}
                    <div className="text-center mb-6">
                        <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-medium">
                            more reviews
                        </button>
                    </div>
                </section>

                {/* Leave Review */}
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
                                    : 'text-gray-300 hover:text-red-400'}`}
                            />
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="text-right">
                        <button
                            onClick={submitReview}
                            disabled={submittingReview || newRating === 0 || !newComment.trim()}
                            className={`bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded font-medium ${submittingReview || newRating === 0 || !newComment.trim()
                                ? 'opacity-50 cursor-not-allowed'
                                : ''}`}
                        >
                            {submittingReview ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}
