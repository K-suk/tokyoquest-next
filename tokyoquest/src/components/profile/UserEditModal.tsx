// app/profile/UserEditModal.tsx
"use client";

import { useState } from "react";
import { getSession } from "next-auth/react";

export default function UserEditModal({ user, token, onUpdated }: {
    user: any;
    token: string;
    onUpdated: () => void;
}) {
    const [firstName, setFirstName] = useState(user.first_name || "");
    const [lastName, setLastName] = useState(user.last_name || "");
    const [contactAddress, setContactAddress] = useState(user.contact_address || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async () => {
        setSaving(true);
        setMessage("");

        try {
            // 🔹 1回目の更新リクエスト
            let res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_PUBLIC_API_URL}/accounts/update/`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    contact_address: contactAddress,
                }),
            });

            // 🔹 もしトークン失効していたら refresh → 再試行
            if (res.status === 401) {

                const newSession = await getSession();

                res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_PUBLIC_API_URL}/accounts/update/`, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${newSession?.accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        contact_address: contactAddress,
                    }),
                });
            }

            if (!res.ok) throw new Error("更新に失敗しました");

            setMessage("プロフィールを更新しました！");
            onUpdated();
        } catch (err) {
            console.error(err);
            setMessage("更新に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-6 p-4 border rounded">
            <h3 className="text-lg font-semibold mb-2">プロフィール編集</h3>
            <div className="space-y-2">
                <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className="border p-2 w-full"
                />
                <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="border p-2 w-full"
                />
                <input
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    placeholder="Contact Address"
                    className="border p-2 w-full"
                />
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {saving ? "更新中..." : "更新する"}
                </button>
                {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
            </div>
        </div>
    );
}
