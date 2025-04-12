"use client";

import useSWR from "swr";
import { useState } from "react";
import UserEditModal from "./UserEditModal";
import { getSession, signOut } from "next-auth/react";

const fetcher = async (url: string, accessToken: string): Promise<any> => {
    let res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (res.status === 401) {

        // 最新のセッションを取得する(この中でrefresh tokenから更新処理などが起きる)
        const newSession = await getSession();

        res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${newSession?.accessToken}`,
            },
        });

        if (res.status === 401) {
            console.error("🔐 Refresh token expired. Logging out...");
            await signOut({ callbackUrl: "/signin" });
            return;
        }

        if (!res.ok) {
            throw new Error("リフレッシュ後のリクエストに失敗しました");
        }

        return res.json();
    }

    if (!res.ok) {
        throw new Error("ユーザーデータ取得に失敗しました");
    }

    return res.json();
};

export default function UserInfo({ session }: { session: any }) {
    const [fallbackUser] = useState(session.user);
    const shouldFetch = !!session?.accessToken;

    const key = shouldFetch
        ? [`${process.env.NEXT_PUBLIC_DJANGO_PUBLIC_API_URL}/accounts/profile/`, session.accessToken]
        : null;

    const {
        data: user,
        error,
        mutate,
    } = useSWR(
        key,
        ([url, token]) => fetcher(url, token),
        {
            fallbackData: fallbackUser,
            revalidateOnFocus: false,
        }
    );

    if (error) return <p>ユーザーデータの取得に失敗しました</p>;
    if (!user) return <p>読み込み中...</p>;

    return (
        <div>
            <h1>ようこそ, {user?.first_name ?? "ゲスト"} {user?.last_name ?? ""} さん！</h1>
            <p>Email: {user?.email}</p>
            <p>Contact Address: {user?.contact_address}</p>
            <p>Level: {user?.level}</p>
            <UserEditModal
                user={user}
                token={session.accessToken}
                onUpdated={() => mutate(undefined, true)}
            />
        </div>
    );
}