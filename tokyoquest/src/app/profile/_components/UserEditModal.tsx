"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface UserEditModalProps {
    onUpdated: () => void;
}

export default function UserEditModal({ onUpdated }: UserEditModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [contactAddress, setContactAddress] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

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