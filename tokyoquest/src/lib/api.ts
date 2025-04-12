// lib/api.ts
const BASEADDRESS = process.env.DJANGO_PUBLIC_API_URL;

export async function fetchUserProfile(token: string) {
    const res = await fetch(`${BASEADDRESS}/api/accounts/profile/`, {
        headers: {
            Authorization: `JWT ${token}`,
        },
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch user profile");
    }

    return res.json();
}
