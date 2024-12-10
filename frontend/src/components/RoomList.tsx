"use client";
import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Card,
  Flex,
  Group,
  Loader,
  ScrollArea,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconPlus, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import {
  DeleteChatroomMutation,
  DeleteChatroomMutationVariables,
  GetChatroomsForUserQuery,
  GetChatroomsForUserQueryVariables,
} from "../gql/graphql";
import { DELETE_CHATROOM } from "../graphql/mutations/DeleteChatroom";
import { GET_CHATROOMS_FOR_USER } from "../graphql/queries/GetChatroomsForUser";
import { useGeneralStore } from "../store/generalStore";
import { useUserStore } from "../store/userStore";
import { OverlappingAvatars } from "./OverlappingAvatars";

export const RoomList = () => {
  const toggleCreateRoomModal = useGeneralStore(
    (state) => state.toggleCreateRoomModal
  );
  const userId = useUserStore((state) => state.id);

  const { data, loading, error } = useQuery<
    GetChatroomsForUserQuery,
    GetChatroomsForUserQueryVariables
  >(GET_CHATROOMS_FOR_USER, {
    variables: {
      userId: userId,
    },
  });

  const isSmallDevice = useMediaQuery("(max-width: 768px)");

  const defaultTextStyles: React.CSSProperties = {
    textOverflow: isSmallDevice ? "unset" : "ellipsis",
    whiteSpace: isSmallDevice ? "unset" : "nowrap",
    overflow: isSmallDevice ? "unset" : "hidden",
  };

  const defaultFlexStyles: React.CSSProperties = {
    maxWidth: isSmallDevice ? "unset" : "200px",
  };

  const [activeRoomId, setActiveRoomId] = React.useState<number | null>(
    parseInt(useParams<{ id: string }>().id || "0")
  );

  const router = useRouter();

  const [deleteChatroom] = useMutation<
    DeleteChatroomMutation,
    DeleteChatroomMutationVariables
  >(DELETE_CHATROOM, {
    variables: {
      chatroomId: activeRoomId,
    },
    refetchQueries: [
      {
        query: GET_CHATROOMS_FOR_USER,
        variables: {
          userId: userId,
        },
      },
    ],
    onCompleted: (data) => {
      router.push("/");
    },
    onError: () => {
      console.log(activeRoomId);
    },
  });

  return (
    <Flex
      direction={"row"}
      w={isSmallDevice ? "calc(100% - 100px)" : "550px"}
      h="100vh"
      ml="100px"
    >
      <Card shadow="md" w={"100%"} p={0}>
        <Flex direction="column" align="start" w="100%">
          <Group
            style={{ width: "100%" }}
            justify="space-between"
            ml={"md"}
            mt={"md"}
          >
            <Button
              onClick={toggleCreateRoomModal}
              variant="light"
              leftSection={<IconPlus />}
            >
              Create a room
            </Button>
          </Group>
          <ScrollArea h={"83vh"} w={"100%"}>
            <Flex direction={"column"}>
              <Flex justify={"center"} align="center" h="100%" mih={"75px"}>
                {loading && (
                  <Flex align={"center"}>
                    <Loader mr={"md"}>
                      <Text c="dimmed" style={{ fontStyle: "italic" }}>
                        Loading...
                      </Text>
                    </Loader>
                  </Flex>
                )}
              </Flex>
              {data?.getChatroomsForUser.map((chatroom) => (
                <Link
                  style={{
                    transition: "background-color 0.3s",
                    cursor: "pointer",
                  }}
                  href={`/chatrooms/${chatroom.id}`}
                  key={chatroom.id}
                  onClick={() => setActiveRoomId(parseInt(chatroom.id || "0"))}
                >
                  <Card
                    style={
                      activeRoomId === parseInt(chatroom.id || "0")
                        ? { backgroundColor: "#f0f1f1" }
                        : undefined
                    }
                    mih={120}
                    py={"md"}
                    withBorder
                    shadow={"md"}
                  >
                    <Flex justify={"space-around"}>
                      {chatroom.users && (
                        <Flex align={"center"}>
                          <OverlappingAvatars users={chatroom.users} />
                        </Flex>
                      )}
                      {chatroom.messages && chatroom.messages.length > 0 ? (
                        <Flex
                          style={defaultFlexStyles}
                          direction="column"
                          align="start"
                          w="100%"
                          h="100%"
                        >
                          <Flex direction="column">
                            <Text size="lg" style={defaultTextStyles}>
                              {chatroom.name}
                            </Text>
                            <Text style={defaultTextStyles}>
                              {chatroom.messages[0].content}
                            </Text>
                            <Text c="dimmed" style={defaultTextStyles}>
                              {new Date(
                                chatroom.messages[0].createdAt
                              ).toLocaleDateString()}
                            </Text>
                          </Flex>
                        </Flex>
                      ) : (
                        <Flex align="center" justify="center">
                          <Text style={{ fontStyle: "italic" }} c="dimmed">
                            No Messages
                          </Text>
                        </Flex>
                      )}
                      <Flex h="100%" align="end" justify="end">
                        <Button
                          p={0}
                          variant="light"
                          color="red"
                          onClick={(e) => {
                            e.preventDefault();
                            deleteChatroom();
                          }}
                        >
                          <IconX />
                        </Button>
                      </Flex>
                    </Flex>
                  </Card>
                </Link>
              ))}
            </Flex>
          </ScrollArea>
        </Flex>
      </Card>
    </Flex>
  );
};
