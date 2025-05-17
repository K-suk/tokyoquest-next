"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/profile");
        }
    }, [status, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md text-center">
                <h1 className="text-3xl font-bold mb-6">ログイン</h1>
                <button
                    onClick={() => signIn("google", { callbackUrl: "/profile" })}
                    className="flex items-center justify-center w-full py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 488 512"
                        className="w-5 h-5"
                    >
                        <path
                            fill="currentColor"
                            d="M488 261.8c0-17.8-1.6-35.5-4.7-52.6H249v99.6h134.3c-5.8 31.5-23.4 58.3-49.8 76.2v63.4h80.5c47.1-43.4 74-107.4 74-186.6zM249 480c67.5 0 124.3-22.4 165.7-60.8l-80.5-63.4c-22.4 15-51 24-85.2 24-65.5 0-121-44.3-140.8-103.6H23.5v65.1C64.8 436.1 150 480 249 480zM108.2 286.4c-4.8-14.4-7.6-29.7-7.6-45.4s2.8-31 7.6-45.4V130.5H23.5C8.3 167.4 0 206.9 0 246.9s8.3 79.5 23.5 116.4l84.7-76.9zM249 97.3c35.3 0 67.1 12.1 92 35.8l69-69C373.7 25.7 316.9 0 249 0 150 0 64.8 43.9 23.5 109.5l84.7 76.9C128 141.6 183.5 97.3 249 97.3z"
                        />
                    </svg>
                    <span className="ml-2 text-lg">Google でログイン</span>
                </button>
            </div>
        </div>
    );
}