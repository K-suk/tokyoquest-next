import useSWR from "swr";
import { Session } from "next-auth";
import { Quest } from "@/components/QuestCard";

export function useCompletedQuests(session: Session | null) {
  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch completed quests");
    const data = await res.json();
    // APIのレスポンスをQuest型に変換
    return data.map((item: any) => {
      const q = item.quest;
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        // API が camelCase なら q.imgUrl、snake_case なら q.image_url
        imgUrl: q.imgUrl ?? q.image_url ?? "",
        is_saved: false,
      } as Quest;
    });
  };

  const { data, error, mutate } = useSWR<Quest[]>(
    session?.accessToken
      ? `${process.env.NEXT_PUBLIC_API_URL}/completed-quests/`
      : null,
    fetcher
  );
  return {
    completedQuests: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
