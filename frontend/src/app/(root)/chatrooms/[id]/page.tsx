import { JoinRoomOrChatwindow } from "@/src/components/JoinRoomOrChatwindow";

export default async function ChatroomsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  return <div></div>;
}
