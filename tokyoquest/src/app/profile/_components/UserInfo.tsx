// src/components/profile/UserInfo.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useUser } from "@/hooks/useUser";
import UserEditModal from "./UserEditModal";

export default function UserInfo() {
    const { data: session, status } = useSession();
    const { data: user, error, mutate } = useUser(session);

    if (status === "loading") {
        return <p>読み込み中…</p>;
    }

    if (status === "unauthenticated" || !session?.accessToken) {
        signOut({ callbackUrl: "/signin" });
        return null;
    }

    if (error) {
        return <p>ユーザーデータ取得に失敗しました</p>;
    }

    if (!user) {
        return <p>ユーザーデータを取得中…</p>;
    }

    return (
        <div>
            <h1>ようこそ, {user.first_name} {user.last_name} さん！</h1>
            <p>Email: {user.email}</p>
            <p>Contact Address: {user.contact_address}</p>
            <p>Level: {user.level}</p>
            <UserEditModal onUpdated={() => mutate()} />
        </div>
    );
}