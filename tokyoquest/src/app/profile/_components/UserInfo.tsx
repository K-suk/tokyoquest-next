// components/profile/UserInfo.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import CompletedQuests from "./CompletedQuests";

const NAME_REGEX = /^[A-Za-z\s-]+$/;
const ADDRESS_REGEX = /^[A-Za-z0-9\s@._,-]+$/;

type PublicUser = {
    first_name: string;
    last_name: string;
    email: string;
    contact_address: string;
    level: number;
};

export default function UserInfo() {
    const router = useRouter();

    const [user, setUser] = useState<PublicUser | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [contactAddress, setContactAddress] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        // マウント時に /api/profile/get を叩いてユーザー情報を取得
        async function fetchUser() {
            try {
                const res = await fetch("/api/profile/get", { cache: "no-store" });
                if (res.status === 401) {
                    // トークンが無効ならサインアウトして /login にリダイレクト
                    await signOut({ callbackUrl: "/login" });
                    return;
                }
                if (!res.ok) {
                    throw new Error("Failed to load user data");
                }
                const data: PublicUser = await res.json();
                setUser(data);
                setFirstName(data.first_name);
                setLastName(data.last_name);
                setContactAddress(data.contact_address);
            } catch {
                setError(true);
            } finally {
                setLoadingProfile(false);
            }
        }
        fetchUser();
    }, [router]);

    if (loadingProfile) {
        return (
            <div className="min-h-screen flex flex-col justify-center">
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
                <span className="flex justify-center mb-4">Loading User Data...</span>
            </div>
        );
    }

    if (error || !user) {
        return <p className="p-4 text-red-500">Failed to load user data.</p>;
    }

    // 入力チェック関数
    const validateInputs = (): { valid: boolean; errorMsg?: string } => {
        if (!NAME_REGEX.test(firstName)) {
            return { valid: false, errorMsg: "Invalid character in first name" };
        }
        if (!NAME_REGEX.test(lastName)) {
            return { valid: false, errorMsg: "Invalid character in last name" };
        }
        if (!ADDRESS_REGEX.test(contactAddress)) {
            return { valid: false, errorMsg: "Invalid character in contact address" };
        }
        return { valid: true };
    };

    // フォーム送信ハンドラ
    const handleSubmit = async () => {
        setSaving(true);
        setMessage("");

        const { valid, errorMsg } = validateInputs();
        if (!valid) {
            setMessage(errorMsg);
            setSaving(false);
            return;
        }

        try {
            // Client → Next.js API Route 経由で更新
            const res = await fetch("/api/profile/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    contact_address: contactAddress,
                }),
            });
            if (res.status === 401) {
                // トークンが無効なら signOut してログインページへ
                await signOut({ callbackUrl: "/login" });
                return;
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Failed to update");
            }
            setMessage("Profile updated successfully.");
            // 更新後に再度 /api/profile/get を叩いて最新情報を取得
            const refreshed = await fetch("/api/profile/get", { cache: "no-store" });
            if (refreshed.ok) {
                const data: PublicUser = await refreshed.json();
                setUser(data);
                setFirstName(data.first_name);
                setLastName(data.last_name);
                setContactAddress(data.contact_address);
            }
        } catch (err: any) {
            console.error(err);
            setMessage(err.message || "Failed to update");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full bg-white">
                {/* プロフィールセクション */}
                <div className="relative">
                    <div className="h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 relative overflow-hidden">
                        <Image
                            src="/images/tokyo_profile_bg.jpg"
                            alt="Tokyo skyline with Tokyo Tower"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40" />
                        <div className="absolute inset-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-9 lg:py-12 flex flex-col justify-center text-white">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 lg:mb-8 opacity-90">
                                {user.email}
                            </p>
                            <div className="space-y-1 sm:space-y-2 text-sm sm:text-base lg:text-lg">
                                <div>Level : {user.level}</div>
                                <div>Contact : {user.contact_address}</div>
                            </div>

                            <Dialog.Root placement="center" motionPreset="slide-in-bottom">
                                <Dialog.Trigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="font-bold bg-red-500 hover:bg-red-600 text-white mt-4 sm:mt-6 lg:mt-8 w-fit px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base rounded-md"
                                    >
                                        Edit
                                    </Button>
                                </Dialog.Trigger>
                                <Portal>
                                    <Dialog.Backdrop />
                                    <Dialog.Positioner>
                                        <Dialog.Content className="mx-8">
                                            <Dialog.Header>
                                                <Dialog.Title className="text-4xl md:text-5xl font-bold text-center">
                                                    Profile Edit
                                                </Dialog.Title>
                                                <Dialog.CloseTrigger asChild>
                                                    <CloseButton size="sm" />
                                                </Dialog.CloseTrigger>
                                            </Dialog.Header>
                                            <Dialog.Body>
                                                <div className="space-y-5">
                                                    <input
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        placeholder="First Name"
                                                        className="border p-2 w-full mt-2 rounded-md"
                                                        disabled={saving}
                                                        required
                                                    />
                                                    <input
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        placeholder="Last Name"
                                                        className="border p-2 w-full mt-2 rounded-md"
                                                        disabled={saving}
                                                        required
                                                    />
                                                    <input
                                                        value={contactAddress}
                                                        onChange={(e) => setContactAddress(e.target.value)}
                                                        placeholder="Contact Address"
                                                        className="border p-2 w-full mt-2 rounded-md"
                                                        disabled={saving}
                                                        required
                                                    />
                                                    <button
                                                        onClick={handleSubmit}
                                                        disabled={saving}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md"
                                                    >
                                                        {saving ? "Updating..." : "Update"}
                                                    </button>
                                                    {message && (
                                                        <p className="text-sm text-green-600 mt-2">{message}</p>
                                                    )}
                                                </div>
                                            </Dialog.Body>
                                        </Dialog.Content>
                                    </Dialog.Positioner>
                                </Portal>
                            </Dialog.Root>
                        </div>
                    </div>
                </div>

                {/* Completed Quests Section */}
                <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-8 bg-gray-50 min-h-screen">
                    <CompletedQuests />
                </div>
            </div>
        </div>
    );
}
