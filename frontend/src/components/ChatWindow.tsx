"use client";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import React from "react";
import {
  EnterChatroomMutation,
  EnterChatroomMutationVariables,
  GetMessagesForChatroomQuery,
  GetMessagesForChatroomQueryVariables,
  GetUsersOfChatroomQuery,
  GetUsersOfChatroomQueryVariables,
  LeaveChatroomMutation,
  LeaveChatroomMutationVariables,
  LiveUsersInChatroomSubscription,
  LiveUsersInChatroomSubscriptionVariables,
  Message,
  NewMessageSubscription,
  NewMessageSubscriptionVariables,
  SendMessageMutation,
  SendMessageMutationVariables,
  User,
  UserStartedTypingMutationMutation,
  UserStartedTypingMutationMutationVariables,
  UserStartedTypingSubscription,
  UserStartedTypingSubscriptionVariables,
  UserStoppedTypingMutationMutation,
  UserStoppedTypingSubscription,
  UserStoppedTypingSubscriptionVariables,
} from "../gql/graphql";
import { useDropzone } from "react-dropzone";
import { SEND_MESSAGE } from "../graphql/mutations/SendMessage";
import { useParams } from "next/navigation";
import { useUserStore } from "../store/userStore";
import { USER_STARTED_TYPING_SUBSCRIPTION } from "../graphql/subscriptions/UserStartedTyping";
import { USER_STOPPED_TYPING_SUBSCRIPTION } from "../graphql/subscriptions/UserStoppedTyping";
import { USER_STOPPED_TYPING_MUTATION } from "../graphql/mutations/UserStoppedTypingMutation";
import { USER_STARTED_TYPING_MUTATION } from "../graphql/mutations/UserStartedTypingMutation";
import { useMediaQuery } from "@mantine/hooks";
import { LIVE_USERS_IN_CHATROOM } from "../graphql/subscriptions/LiveUsers";
import { ENTER_CHATROOM } from "../graphql/mutations/EnterChatroom";
import { LEAVE_CHATROOM } from "../graphql/mutations/LeaveChatroom";
import { GET_USERS_OF_CHATROOM } from "../graphql/queries/GetUsersOfChatroom";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Flex,
  Image,
  List,
  ScrollArea,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { OverlappingAvatars } from "./OverlappingAvatars";
import { GET_MESSAGES_FOR_CHATROOM } from "../graphql/queries/GetMessagesForChatroom";
import { MessageBubble } from "./MessageBubble";
import { IconMichelinBibGourmand } from "@tabler/icons-react";
import { GET_CHATROOMS_FOR_USER } from "../graphql/queries/GetChatroomsForUser";
import { NEW_MESSAGE_SUBSCRIPTION } from "../graphql/subscriptions/NewMessage";

export const ChatWindow = () => {
  const [messageContent, setMessageContent] = React.useState("");
  const [sendMessage, { data: sendMessageData }] = useMutation<
    SendMessageMutation,
    SendMessageMutationVariables
  >(SEND_MESSAGE);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        setSelectedFile(file);
      }
    },
  });

  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : null;
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((state) => state);
  const {
    data: typingData,
    loading: typingLoading,
    error: typingError,
  } = useSubscription<
    UserStartedTypingSubscription,
    UserStartedTypingSubscriptionVariables
  >(USER_STARTED_TYPING_SUBSCRIPTION, {
    variables: {
      chatroomId: parseInt(id!),
    },
  });

  const {
    data: stoppedTypingData,
    loading: stoppedTypingLoading,
    error: stoppedTypingError,
  } = useSubscription<
    UserStoppedTypingSubscription,
    UserStoppedTypingSubscriptionVariables
  >(USER_STOPPED_TYPING_SUBSCRIPTION, {
    variables: {
      chatroomId: parseInt(id!),
    },
  });

  const [
    userStartedTypingMutation,
    {
      data: dataStartedTyping,
      loading: loadingStartedTyping,
      error: errorStartedTyping,
    },
  ] = useMutation<
    UserStartedTypingMutationMutation,
    UserStartedTypingMutationMutationVariables
  >(USER_STARTED_TYPING_MUTATION, {
    onCompleted: () => {
      console.log("User started typing");
    },
    variables: {
      chatroomId: parseInt(id!),
    },
  });

  const [
    userStoppedTypingMutation,
    {
      data: dataStoppedTyping,
      loading: loadingStoppedTyping,
      error: errorStoppedTyping,
    },
  ] = useMutation<
    UserStoppedTypingMutationMutation,
    UserStoppedTypingMutationMutation
  >(USER_STOPPED_TYPING_MUTATION);

  const [typingUsers, setTypingUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    const user = typingData?.userStartedTyping;
    if (user && user.id) {
      setTypingUsers((prevUsers) => {
        if (!prevUsers.find((u) => u.id === user.id)) {
          return [...prevUsers, user];
        }
        return prevUsers;
      });
    }
  }, [typingData]);

  const typingTimeoutsRef = React.useRef<{ [key: number]: NodeJS.Timeout }>({});

  React.useEffect(() => {
    const user = stoppedTypingData?.userStoppedTyping;
    if (user && user.id) {
      clearTimeout(typingTimeoutsRef.current[user.id]);
      setTypingUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
    }
  }, [stoppedTypingData]);

  const userId = useUserStore((state) => state.id);

  const handleUserStartedTyping = async () => {
    await userStartedTypingMutation();

    if (userId && typingTimeoutsRef.current[userId]) {
      clearTimeout(typingTimeoutsRef.current[userId]);
    }
    if (userId) {
      typingTimeoutsRef.current[userId] = setTimeout(async () => {
        setTypingUsers((prevUsers) =>
          prevUsers.filter((user) => user.id !== userId)
        );
        await userStoppedTypingMutation();
      }, 5000);
    }
  };

  const isSmallDevice = useMediaQuery("(max-width: 760px)");

  const {
    data: liveUsersData,
    loading: liveUsersLoading,
    error: liveUsersError,
  } = useSubscription<
    LiveUsersInChatroomSubscription,
    LiveUsersInChatroomSubscriptionVariables
  >(LIVE_USERS_IN_CHATROOM, {
    variables: {
      chatroomId: parseInt(id!),
    },
  });

  const [liveUsers, setLiveUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    if (liveUsersData?.liveUsersInChatroom) {
      setLiveUsers(liveUsersData.liveUsersInChatroom);
    }
  }, [liveUsersData?.liveUsersInChatroom]);

  const [enterChatroom] = useMutation<
    EnterChatroomMutation,
    EnterChatroomMutationVariables
  >(ENTER_CHATROOM);
  const [leaveChatroom] = useMutation<
    LeaveChatroomMutation,
    LeaveChatroomMutationVariables
  >(LEAVE_CHATROOM);
  const chatroomId = parseInt(id!);

  const handleEnter = async () => {
    await enterChatroom({ variables: { chatroomId } })
      .then((response) => {
        if (response.data.enterChatroom) {
          console.log("Successfully started chatroom!");
        }
      })
      .catch((error) => {
        console.log("Error entering chatroom:", error);
      });
  };

  const handleLeave = async () => {
    await leaveChatroom({ variables: { chatroomId } })
      .then((response) => {
        if (response.data.leaveChatroom) {
          console.log("Successfully lefy chatroom!");
        }
      })
      .catch((error) => console.log("Error leaving chatroom:", error));
  };

  const [isUserPartOfChatroom, setIsUserPartOfChatroom] =
    React.useState<() => boolean | undefined>();

  const { data: dataOfUsersOfChatroom } = useQuery<
    GetUsersOfChatroomQuery,
    GetUsersOfChatroomQueryVariables
  >(GET_USERS_OF_CHATROOM, {
    variables: {
      chatroomId: parseInt(id!),
    },
  });

  React.useEffect(() => {
    setIsUserPartOfChatroom(() =>
      dataOfUsersOfChatroom?.getUsersOfChatroom.some(
        (user) => user.id === userId
      )
    );
  }, [dataOfUsersOfChatroom?.getUsersOfChatroom, userId]);

  React.useEffect(() => {
    handleEnter();
    if (liveUsersData?.liveUsersInChatroom) {
      setLiveUsers(liveUsersData.liveUsersInChatroom);
      setIsUserPartOfChatroom(() =>
        dataOfUsersOfChatroom?.getUsersOfChatroom.some(
          (user) => user.id === userId
        )
      );
    }
  }, [chatroomId]);

  React.useEffect(() => {
    handleEnter();
    if (liveUsersData?.liveUsersInChatroom) {
      setLiveUsers(liveUsersData.liveUsersInChatroom);
    }

    return () => {
      handleLeave();
    };
  }, [chatroomId]);

  React.useEffect(() => {
    window.addEventListener("beforeunload", handleLeave);
    return () => {
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, []);

  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);

  const { data, loading, error } = useQuery<
    GetMessagesForChatroomQuery,
    GetMessagesForChatroomQueryVariables
  >(GET_MESSAGES_FOR_CHATROOM, { variables: { chatroomId: chatroomId } });

  const [messages, setMessages] = React.useState<Message[]>([]);

  React.useEffect(() => {
    if (data?.getMessagesForChatroom) {
      setMessages(data.getMessagesForChatroom);
    }
  }, [data?.getMessagesForChatroom]);

  const handleSendMessage = async () => {
    await sendMessage({
      variables: {
        chatroomId: chatroomId,
        content: messageContent,
        image: selectedFile,
      },
      refetchQueries: [
        {
          query: GET_CHATROOMS_FOR_USER,
          variables: {
            userId: userId,
          },
        },
      ],
    });
    setMessageContent("");
    setSelectedFile(null);
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      console.log("Scrolling to bottom");
      const scrollElement = scrollAreaRef.current;
      console.log(scrollElement.scrollHeight, scrollElement.scrollHeight);
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  React.useEffect(() => {
    if (data?.getMessagesForChatroom) {
      const uniqueMessages = Array.from(
        new Set(data.getMessagesForChatroom.map((m) => m.id))
      ).map((id) => data.getMessagesForChatroom.find((m) => m.id === id));
      setMessages(uniqueMessages);
      scrollToBottom();
    }
  }, [data?.getMessagesForChatroom]);

  const {
    data: dataSub,
    loading: loadingSub,
    error: errorSub,
  } = useSubscription<NewMessageSubscription, NewMessageSubscriptionVariables>(
    NEW_MESSAGE_SUBSCRIPTION,
    {
      variables: {
        chatroomId: parseInt(id!),
      },
    }
  );

  React.useEffect(() => {
    scrollToBottom();
    if (dataSub?.newMessage) {
      if (!messages.find((m) => m.id === dataSub.newMessage?.id)) {
        setMessages((prevMessages) => [...prevMessages, dataSub.newMessage]);
      }
    }
  }, [dataSub?.newMessage, messages]);

  return (
    <Flex
      justify="center"
      ml={isSmallDevice ? "100px" : "0"}
      w={isSmallDevice ? "calc(100vw - 100px)" : "1000px"}
      style={{
        height: "100vh",
      }}
    >
      {!liveUsersLoading && isUserPartOfChatroom ? (
        <Card withBorder shadow="xl" p={0} w="100%">
          <Flex direction="column" pos="relative" h="100%" w="100%">
            <Flex direction="column" bg="#f1f1f0">
              <Flex
                direction="row"
                justify="space-around"
                align="center"
                my="sm"
              >
                <Flex direction="column" align="start">
                  <Text mb="xs" c="dimmed" style={{ fontStyle: "italic" }}>
                    Chat with
                  </Text>
                  {dataOfUsersOfChatroom?.getUsersOfChatroom && (
                    <OverlappingAvatars
                      users={dataOfUsersOfChatroom.getUsersOfChatroom}
                    />
                  )}
                </Flex>
                <Flex direction={"column"} justify="space-around" align="start">
                  <List w={150}>
                    <Text mb="xs" c="dimmed" style={{ fontStyle: "italic" }}>
                      Live users
                    </Text>

                    {liveUsersData?.liveUsersInChatroom?.map((user) => (
                      <Flex key={user.id} pos="relative" w={25} h={25} my="xs">
                        <Avatar
                          radius="xl"
                          size={25}
                          src={user.avatarUrl ? user.avatarUrl : null}
                        />

                        <Flex
                          pos="absolute"
                          bottom={0}
                          right={0}
                          w={10}
                          h={10}
                          bg="green"
                          style={{ borderRadius: 10 }}
                        ></Flex>
                        <Text ml="sm">{user.fullname}</Text>
                      </Flex>
                    ))}
                  </List>
                </Flex>
              </Flex>
              <Divider size="sm" w="100%" />
            </Flex>
            <ScrollArea
              viewportRef={scrollAreaRef}
              h="70vh"
              offsetScrollbars
              type="always"
              w="100%"
              p="md"
            >
              {loading ? (
                <Text c="dimmed">Loading...</Text>
              ) : (
                messages.map((message) => {
                  return (
                    <MessageBubble
                      key={message?.id}
                      message={message}
                      currentUserId={userId}
                    />
                  );
                })
              )}
            </ScrollArea>

            <Flex
              style={{
                width: "100%",
                position: "absolute",
                bottom: 0,
                backgroundColor: "#f1f1f0",
              }}
              direction="column"
              bottom={0}
              align="start"
            >
              <Divider size="sm" w="100%" />
              <Flex
                w={"100%"}
                mx="md"
                my="xs"
                align={"center"}
                justify="center"
                direction={"column"}
                pos="relative"
                p="sm"
              >
                <Flex
                  pos={"absolute"}
                  bottom={50}
                  direction="row"
                  align={"center"}
                  bg="#f1f1f0"
                  style={{
                    borderRadius: 5,
                    boxShadow: "0px 0px 5px 0px #000000",
                  }}
                  p={typingUsers.length === 0 ? 0 : "sm"}
                >
                  <Avatar.Group>
                    {typingUsers.map((user) => (
                      <Tooltip key={user.id} label={user.fullname}>
                        <Avatar
                          radius={"xl"}
                          src={user.avatarUrl ? user.avatarUrl : null}
                        />
                      </Tooltip>
                    ))}
                  </Avatar.Group>

                  {typingUsers.length > 0 && (
                    <Text c="dimmed">is typing...</Text>
                  )}
                </Flex>

                <Flex w={"100%"} mx="md" align={"center"} justify="center">
                  <Flex {...getRootProps()} align="center">
                    {selectedFile && (
                      <Image
                        mr="md"
                        width={"50"}
                        height="50"
                        src={previewUrl}
                        alt="Preview"
                        radius={"md"}
                      />
                    )}
                    <Button leftSection={<IconMichelinBibGourmand />}></Button>
                    <input {...getInputProps()} />
                  </Flex>

                  <TextInput
                    onKeyDown={handleUserStartedTyping}
                    style={{ flex: 0.7 }}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.currentTarget.value)}
                    placeholder="Type your message..."
                    rightSection={
                      <Button
                        onClick={handleSendMessage}
                        color="blue"
                        leftSection={<IconMichelinBibGourmand />}
                      >
                        Send
                      </Button>
                    }
                  />
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      ) : (
        <></>
      )}
    </Flex>
  );
};
