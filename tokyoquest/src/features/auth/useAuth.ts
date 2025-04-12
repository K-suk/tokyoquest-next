"use client";

import { useCallback } from "react";
import axios from "axios";
import { CredentialResponse } from "@react-oauth/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useAuth = () => {
    const handleLoginSuccess = useCallback(
        async (credentialResponse: CredentialResponse) => {
            if (!credentialResponse.credential) {
                // remove in production
                console.error("Google認証エラー: トークンがありません");
                return;
            }

            // remove in production
            console.log("Google Token:", credentialResponse.credential);

            try {
                const response = await axios.post(
                    `${API_URL}/auth/convert-token/`,
                    new URLSearchParams({
                        grant_type: "convert_token",
                        client_id: process.env.NEXT_PUBLIC_DJANGO_CLIENT_ID!,
                        client_secret:
                            process.env.NEXT_PUBLIC_DJANGO_CLIENT_SECRET!,
                        backend: "google-oauth2",
                        token: credentialResponse.credential,
                    }),
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                    }
                );

                // remove in production
                console.log("Django Access Token:", response.data.access_token);
                localStorage.setItem(
                    "access_token",
                    response.data.access_token
                );
            } catch (error) {
                console.error("Djangoへのトークン送信エラー:", error);
            }
        },
        []
    );

    return { handleLoginSuccess };
};
