// src/hooks/useUser.ts
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Session } from "next-auth";

export function useUser(session: Session | null) {
    // session がない or accessToken がない場合はフェッチしない
    const shouldFetch = !!session?.accessToken;
    const url = "http://127.0.0.1:8000/api/accounts/profile/";
    const key = shouldFetch ? [url] : null;

    const fetcher = async (endpoint: string) => {
        const res = await api.get(endpoint);
        return res.data;
    };

    const swr = useSWR(key, fetcher, {
        // session?.user を使い、session が null なら undefined を渡す
        fallbackData: session?.user ?? undefined,
        revalidateOnFocus: false,
        errorRetryCount: 1,
        errorRetryInterval: 5000,
    });

    return swr; // { data, error, mutate, ... }
}
