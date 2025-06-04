// app/profile/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import UserInfo from "@/app/profile/_components/UserInfo";

export default async function ProfilePage() {
    // 1) サーバーサイドでセッションをチェック
    const session = await getServerSession(authOptions);
    if (!session) {
        // 認証されていなければログインページへリダイレクト
        redirect("/login");
    }

    // 2) クライアントコンポーネント UserInfo をレンダー
    return <UserInfo />;
}
