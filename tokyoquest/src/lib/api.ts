// src/lib/api.ts
import axios from "axios";
import { getSession, signOut } from "next-auth/react";

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

// リフレッシュ用ヘルパー
async function clientRefreshToken(refreshToken: string) {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/token/refresh/`,
    { refresh: refreshToken }
  );
  return res.data; // { access: "...", refresh?: "..." }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // 401 エラーかつリトライ前なら
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // セッション情報取得
      const session = await getSession();

      // リフレッシュトークンがなければ即サインアウト
      if (!session?.refreshToken) {
        await signOut({ callbackUrl: "/login" });
        return Promise.reject(error);
      }

      try {
        // リフレッシュ試行
        const { access, refresh } = await clientRefreshToken(
          session.refreshToken
        );

        // 新しいトークンで再試行
        original.headers.Authorization = `Bearer ${access}`;
        return axios(original);
      } catch (refreshError) {
        // リフレッシュ失敗 → サインアウト＆ログイン画面へ
        await signOut({ callbackUrl: "/login" });
        return Promise.reject(refreshError);
      }
    }

    // それ以外の401も即リダイレクト
    if (error.response?.status === 401) {
      // window での直接リダイレクト（SSR 時には無効なので signOut も併用）
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      } else {
        await signOut({ callbackUrl: "/login" });
      }
    }

    return Promise.reject(error);
  }
);
