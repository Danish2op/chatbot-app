import { gql } from '@apollo/client';

// Chat Queries
export const GET_CHATS = gql`
  query GetChats {
    chats(order_by: { updated_at: desc }) {
      id
      title
      created_at
      updated_at
      user_id
    }
  }
`;

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($chatId: uuid!) {
    messages(
      where: { chat_id: { _eq: $chatId } }
      order_by: { created_at: asc }
    ) {
      id
      content
      role
      created_at
      chat_id
      user_id
    }
  }
`;

// Chat Mutations
export const CREATE_CHAT = gql`
  mutation CreateChat($title: String!) {
    insert_chats_one(object: { title: $title }) {
      id
      title
      created_at
      updated_at
      user_id
    }
  }
`;

export const INSERT_MESSAGE = gql`
  mutation InsertMessage($chat_id: uuid!, $content: String!, $role: String!) {
    insert_messages_one(object: { 
      chat_id: $chat_id, 
      content: $content, 
      role: $role 
    }) {
      id
      content
      role
      created_at
      chat_id
      user_id
    }
  }
`;

// Hasura Action for sending message to chatbot
export const SEND_MESSAGE_TO_CHATBOT = gql`
  mutation SendMessageToChatbot($chat_id: uuid!, $message: String!) {
    sendMessage(chat_id: $chat_id, message: $message) {
      success
      message
      error
    }
  }
`;

// Subscriptions
export const SUBSCRIBE_TO_MESSAGES = gql`
  subscription SubscribeToMessages($chatId: uuid!) {
    messages(
      where: { chat_id: { _eq: $chatId } }
      order_by: { created_at: asc }
    ) {
      id
      content
      role
      created_at
      chat_id
      user_id
    }
  }
`;

export const SUBSCRIBE_TO_CHATS = gql`
  subscription SubscribeToChats {
    chats(order_by: { updated_at: desc }) {
      id
      title
      created_at
      updated_at
      user_id
    }
  }
`;