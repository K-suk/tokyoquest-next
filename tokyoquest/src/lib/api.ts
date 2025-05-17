// src/lib/api.ts
import axios from "axios";
import { getSession } from "next-auth/react";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE,
});

// リクエスト前に必ず最新の accessToken をセット
api.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${session.accessToken}`,
        };
    }
    return config;
});

async function clientRefreshToken(refreshToken: string) {
    const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/token/refresh/`,
        {
            refresh: refreshToken,
        }
    );
    return res.data; // { access: "...", refresh?: "..." }
}

api.interceptors.response.use(
    (r) => r,
    async (error) => {
        const original = error.config;
        // _retry フラグで無限ループ防止
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            // getSession() から最新のリフレッシュトークンを拾う
            const session = await getSession();
            if (!session?.refreshToken) throw error;

            try {
                const { access, refresh } = await clientRefreshToken(
                    session.refreshToken
                );
                // NextAuth の内部でもリフレッシュする場合は別途コールバックが走りますが、
                // ここでは Authorization ヘッダーだけ更新して再試行します。
                original.headers.Authorization = `Bearer ${access}`;
                return axios(original);
            } catch {
                // リフレッシュできなければサインアウト
                await signOut({ callbackUrl: "/login" });
                throw error;
            }
        }
        return Promise.reject(error);
    }
);
