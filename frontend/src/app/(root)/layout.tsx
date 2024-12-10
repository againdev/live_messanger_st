import { AddChatroom } from "@/src/components/AddChatroom";
import { AuthOverlay } from "@/src/components/AuthOverlay";
import { JoinRoomOrChatwindow } from "@/src/components/JoinRoomOrChatwindow";
import { ProfileSettings } from "@/src/components/ProfileSettings";
import { RoomList } from "@/src/components/RoomList";
import { Sidebar } from "@/src/components/Sidebar";
import { Flex } from "@mantine/core";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen">
      <AuthOverlay />
      <Sidebar />
      <ProfileSettings />
      <AddChatroom />
      <Flex direction={{ base: "column", sm: "row" }} w={"100vw"}>
        <RoomList />
        <JoinRoomOrChatwindow />
      </Flex>
      {children}
    </main>
  );
}
