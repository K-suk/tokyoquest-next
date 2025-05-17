import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserInfo from "@/app/profile/_components/UserInfo";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    return <UserInfo session={session} />;
}
