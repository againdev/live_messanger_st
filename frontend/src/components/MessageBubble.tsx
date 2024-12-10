"use client";
import {
  Avatar,
  Flex,
  Image,
  Paper,
  Text,
  useMantineTheme,
} from "@mantine/core";
import React from "react";
import { Message } from "../gql/graphql";

interface MessageProps {
  message: Message;
  currentUserId: number;
}

export const MessageBubble: React.FC<MessageProps> = ({
  message,
  currentUserId,
}) => {
  const theme = useMantineTheme();
  if (!message?.user?.id) return null;

  const isSendByCurrentUser = message.user.id === currentUserId;

  return (
    <Flex
      justify={isSendByCurrentUser ? "flex-end" : "flex-start"}
      align="center"
      m="md"
      mb={10}
    >
      {!isSendByCurrentUser && (
        <Avatar
          radius="xl"
          src={message.user.avatarUrl || null}
          alt={message.user.fullname}
        />
      )}
      <Flex direction="column" justify="center" align="center">
        {isSendByCurrentUser ? (
          <span>Me</span>
        ) : (
          <span>{message.user.fullname}</span>
        )}
        <Paper
          p={"md"}
          style={{
            marginLeft: isSendByCurrentUser ? 0 : 10,
            marginRight: isSendByCurrentUser ? 10 : 10,
            backgroundColor: isSendByCurrentUser
              ? theme.colors.blue[6]
              : "#f1f1f1",
            color: isSendByCurrentUser ? "#fff" : "inherit",
            borderRadius: 10,
          }}
        >
          {message.content}
          {message.imageUrl && (
            <Image
              width={"250"}
              height={"250"}
              fit="cover"
              src={"http://localhost:3000/" + message.imageUrl}
              alt="Upload content"
            />
          )}

          <Text
            style={
              isSendByCurrentUser ? { color: "#e0e0e4" } : { color: "gray" }
            }
          >
            {new Date(message.createdAt).toLocaleString()}
          </Text>
        </Paper>
      </Flex>
      {isSendByCurrentUser && (
        <Avatar
          mr="md"
          radius="xl"
          src={message.user.avatarUrl || null}
          alt={message.user.fullname}
        />
      )}
    </Flex>
  );
};
