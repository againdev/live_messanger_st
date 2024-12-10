import { gql } from "@apollo/client";

export const LIVE_USERS_IN_CHATROOM = gql`
  subscription LiveUsersInChatroom($chatroomId: Float!) {
    liveUsersInChatroom(chatroomId: $chatroomId) {
      id
      fullname
      avatarUrl
      email
    }
  }
`;
