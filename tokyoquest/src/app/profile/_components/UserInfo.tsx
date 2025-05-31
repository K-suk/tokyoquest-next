// src/components/profile/UserInfo.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
// import UserEditModal from "./UserEditModal";
import CompletedQuests from "./CompletedQuests";
import Image from "next/image";
import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react"
import { api } from "@/lib/api";

export default function UserInfo() {
    const { data: session, status } = useSession();
    const { data: user, error } = useUser(session);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [contactAddress, setContactAddress] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name);
            setLastName(user.last_name);
            setContactAddress(user.contact_address);
        }
    }, [user]);

    if (status === "loading") {
        return <p>Loading...</p>;
    }

    if (status === "unauthenticated" || !session?.accessToken) {
        signOut({ callbackUrl: "/signin" });
        return null;
    }

    if (error) {
        return <p>Failed to load user data</p>;
    }

    if (!user) {
        return <p>Retrieving user data...</p>;
    }

    const handleSubmit = async () => {
        setSaving(true);
        setMessage("");
        try {
            await api.patch("http://127.0.0.1:8000/api/accounts/update/", {
                first_name: firstName,
                last_name: lastName,
                contact_address: contactAddress,
            });
            setMessage("プロフィールを更新しました！");
        } catch (err) {
            console.error(err);
            setMessage("更新に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Full Screen Container */}
            <div className="w-full bg-white">
                {/* Profile Section */}
                <div className="relative">
                    {/* Background Image */}
                    <div className="h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 relative overflow-hidden">
                        <Image
                            src="/images/tokyo_profile_bg.jpg"
                            alt="Tokyo skyline with Tokyo Tower"
                            fill
                            className="object-cover"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-40" />

                        {/* Profile Content */}
                        <div className="absolute inset-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-9 lg:py-12 flex flex-col justify-center text-white">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 lg:mb-8 opacity-90">{user.email}</p>

                            <div className="space-y-1 sm:space-y-2 text-sm sm:text-base lg:text-lg">
                                <div>Level : {user.level}</div>
                                <div>Contact : {user.contact_address}</div>
                            </div>

                            <Dialog.Root placement="center" motionPreset="slide-in-bottom">
                                <Dialog.Trigger asChild>
                                    <Button variant="outline" size="sm" className="font-bold bg-red-500 hover:bg-red-600 text-white mt-4 sm:mt-6 lg:mt-8 w-fit px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base rounded-md">
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
                                                <div>
                                                    <div className="space-y-5">
                                                        <input
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            placeholder="First Name"
                                                            className="border p-2 w-full mt-2 rounded-md"
                                                        />
                                                        <input
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            placeholder="Last Name"
                                                            className="border p-2 w-full mt-2 rounded-md"
                                                        />
                                                        <input
                                                            value={contactAddress}
                                                            onChange={(e) => setContactAddress(e.target.value)}
                                                            placeholder="Contact Address"
                                                            className="border p-2 w-full mt-2 rounded-md"
                                                        />
                                                        <button
                                                            onClick={handleSubmit}
                                                            disabled={saving}
                                                            className="bg-blue-600 text-white px-4 py-2 rounded-md"
                                                        >
                                                            {saving ? "Updating..." : "Update"}
                                                        </button>
                                                        {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
                                                    </div>
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
                    {/* Quest Grid - Mobile: 2 cols, iPad: 3 cols, Laptop: 4 cols */}
                    <CompletedQuests />
                </div>
            </div>
        </div>
    );
}