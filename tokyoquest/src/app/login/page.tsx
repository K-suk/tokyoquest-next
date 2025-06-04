// app/login/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LoginForm from "./components/LoginForm";

export default async function LoginPage() {
    const session = await getServerSession(authOptions);
    if (session) {
        // すでにログイン済みなら /profile へリダイレクト
        redirect("/profile");
    }
    // 未ログインならサインインフォームを表示
    return <LoginForm />;
}
