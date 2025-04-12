import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import UserInfo from "@/components/profile/UserInfo";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        redirect("/signin");
    }

    return <UserInfo session={session} />;
}
