import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useSignOut, useUserId } from '@nhost/react';
import {
  GET_CHATS,
  GET_CHAT_MESSAGES,
  CREATE_CHAT,
  INSERT_MESSAGE,
  SEND_MESSAGE_TO_CHATBOT,
  SUBSCRIBE_TO_MESSAGES,
  SUBSCRIBE_TO_CHATS
} from '../graphql/operations';
import { Chat, Message } from '../types';
import ChatList from '../components/ChatList';
import ChatMessages from '../components/ChatMessages';
import MessageInput from '../components/MessageInput';
import { v4 as uuidv4 } from 'uuid';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { signOut } = useSignOut();
  const userId = useUserId();
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chatId || null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Queries with polling for real-time updates
  const { data: chatsData, loading: chatsLoading, refetch: refetchChats } = useQuery(GET_CHATS, {
    pollInterval: 3000, // Poll every 3 seconds
  });

  const { 
    data: messagesData, 
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery(GET_CHAT_MESSAGES, {
    variables: { chatId: selectedChatId },
    skip: !selectedChatId,
    fetchPolicy: 'network-only', // Always fetch fresh data
    pollInterval: 1000, // Poll every 1 second for messages
  });

  const [createChat] = useMutation(CREATE_CHAT, {
    onCompleted: () => {
      refetchChats();
    }
  });

  const [insertMessage] = useMutation(INSERT_MESSAGE, {
    onCompleted: () => {
      // Immediately refetch messages after inserting
      refetchMessages();
    }
  });

  const [sendMessageToChatbot] = useMutation(SEND_MESSAGE_TO_CHATBOT, {
    onCompleted: () => {
      // Start checking for response
      setTimeout(() => refetchMessages(), 500);
      setTimeout(() => refetchMessages(), 1500);
      setTimeout(() => refetchMessages(), 3000);
    }
  });

  // Subscriptions as backup for real-time updates
  useSubscription(SUBSCRIBE_TO_CHATS, {
    onSubscriptionData: () => {
      refetchChats();
    },
  });

  useSubscription(SUBSCRIBE_TO_MESSAGES, {
    variables: { chatId: selectedChatId },
    skip: !selectedChatId,
    onSubscriptionData: () => {
      refetchMessages();
    },
  });

  const chats: Chat[] = chatsData?.chats || [];
  const messages: Message[] = messagesData?.messages || [];

  useEffect(() => {
    if (chatId && chatId !== selectedChatId) {
      setSelectedChatId(chatId);
    }
  }, [chatId]);

  // Refetch messages when chat changes
  useEffect(() => {
    if (selectedChatId) {
      refetchMessages();
    }
  }, [selectedChatId]);

  const handleCreateNewChat = async () => {
    if (isCreatingChat) return;
    
    setIsCreatingChat(true);
    try {
      const { data } = await createChat({
        variables: { title: 'New Chat' },
      });
      
      if (data?.insert_chats_one) {
        const newChatId = data.insert_chats_one.id;
        setSelectedChatId(newChatId);
        navigate(`/chat/${newChatId}`);
        // Refetch chats to show the new one
        refetchChats();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChatId(chat.id);
    navigate(`/chat/${chat.id}`);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChatId || isSending) return;

    setIsSending(true);
    
    try {
      // First, insert the user message
      await insertMessage({
        variables: {
          chat_id: selectedChatId,
          content,
          role: 'user',
        },
      });

      // Force immediate refetch to show user message
      await refetchMessages();

      // Then send to chatbot
      await sendMessageToChatbot({
        variables: {
          chat_id: selectedChatId,
          message: content,
        },
      });

      // Keep refetching for a few seconds to catch the AI response
      const interval = setInterval(() => {
        refetchMessages();
      }, 1000);

      // Stop refetching after 10 seconds
      setTimeout(() => {
        clearInterval(interval);
      }, 10000);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  if (chatsLoading) {
    return <div className="loading-container">Loading chats...</div>;
  }

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Chats</h2>
          <button onClick={handleSignOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
        
        <div className="new-chat-section">
          <button
            onClick={handleCreateNewChat}
            disabled={isCreatingChat}
            className="new-chat-button"
          >
            {isCreatingChat ? 'Creating...' : 'New Chat +'}
          </button>
        </div>

        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      <div className="chat-main">
        {selectedChatId ? (
          <>
            <div className="chat-messages-container">
              <ChatMessages
                messages={messages}
                loading={messagesLoading && messages.length === 0}
              />
              {isSending && (
                <div style={{
                  textAlign: 'center',
                  padding: '10px',
                  color: '#666',
                  fontSize: '14px',
                  fontStyle: 'italic'
                }}>
                  AI is typing...
                </div>
              )}
            </div>
            <div className="message-input-container">
              <MessageInput 
                onSendMessage={handleSendMessage} 
                disabled={isSending}
              />
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Welcome to the Chatbot!</h3>
            <p>Select a chat from the sidebar or create a new one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;