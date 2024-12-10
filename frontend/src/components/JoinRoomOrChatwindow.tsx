"use client";

import { Box, Flex, Text } from "@mantine/core";
import { useParams } from "next/navigation";
import React from "react";
import { ChatWindow } from "./ChatWindow";

export const JoinRoomOrChatwindow = () => {
  const { id } = useParams<{ id: string }>();

  const [content, setContent] = React.useState<string | React.ReactNode>("");

  React.useEffect(() => {
    if (!id) {
      setContent("Please choose a room");
    } else {
      setContent(<ChatWindow />);
    }
  }, [setContent, id]);

  return (
    <Flex w="100%" h="100vh" align="center" justify="center">
      <Box>{content}</Box>
    </Flex>
  );
};
