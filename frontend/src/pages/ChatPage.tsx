import React, { useState, useEffect, useCallback } from 'react';
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
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  // Queries with polling for real-time updates
  const { data: chatsData, loading: chatsLoading, refetch: refetchChats } = useQuery(GET_CHATS, {
    pollInterval: 3000, // Poll every 3 seconds
  });

  const { 
    data: messagesData, 
    loading: messagesLoading,
    refetch: refetchMessages,
    startPolling,
    stopPolling,
  } = useQuery(GET_CHAT_MESSAGES, {
    variables: { chatId: selectedChatId },
    skip: !selectedChatId,
    fetchPolicy: 'cache-and-network', // Changed from network-only
    notifyOnNetworkStatusChange: true,
  });

  // Start aggressive polling when waiting for response
  useEffect(() => {
    if (isWaitingForResponse && selectedChatId) {
      startPolling(500); // Poll every 500ms when waiting for response
      
      // Stop aggressive polling after 15 seconds
      const timeout = setTimeout(() => {
        setIsWaitingForResponse(false);
        startPolling(2000); // Go back to normal polling
      }, 15000);
      
      return () => {
        clearTimeout(timeout);
      };
    } else if (selectedChatId) {
      startPolling(2000); // Normal polling every 2 seconds
    } else {
      stopPolling();
    }
  }, [isWaitingForResponse, selectedChatId, startPolling, stopPolling]);

  const [createChat] = useMutation(CREATE_CHAT, {
    onCompleted: () => {
      refetchChats();
    }
  });

  const [insertMessage] = useMutation(INSERT_MESSAGE, {
    onCompleted: () => {
      refetchMessages();
    },
    refetchQueries: [
      {
        query: GET_CHAT_MESSAGES,
        variables: { chatId: selectedChatId },
      },
    ],
  });

  const [sendMessageToChatbot] = useMutation(SEND_MESSAGE_TO_CHATBOT, {
    onCompleted: (data) => {
      console.log('Chatbot response received:', data);
      setIsWaitingForResponse(true);
      
      // Force refetch multiple times
      const refetchInterval = setInterval(() => {
        refetchMessages();
      }, 1000);
      
      // Clear interval after 10 seconds
      setTimeout(() => {
        clearInterval(refetchInterval);
        setIsWaitingForResponse(false);
      }, 10000);
    },
    onError: (error) => {
      console.error('Chatbot error:', error);
      setIsWaitingForResponse(false);
    }
  });

  // Subscriptions as backup for real-time updates
  useSubscription(SUBSCRIBE_TO_CHATS, {
    onSubscriptionData: ({ subscriptionData }) => {
      console.log('Chat subscription update:', subscriptionData);
      refetchChats();
    },
  });

  useSubscription(SUBSCRIBE_TO_MESSAGES, {
    variables: { chatId: selectedChatId },
    skip: !selectedChatId,
    onSubscriptionData: ({ subscriptionData }) => {
      console.log('Message subscription update:', subscriptionData);
      refetchMessages();
    },
  });

  const chats: Chat[] = chatsData?.chats || [];
  const messages: Message[] = messagesData?.messages || [];

  useEffect(() => {
    if (chatId && chatId !== selectedChatId) {
      setSelectedChatId(chatId);
    }
  }, [chatId, selectedChatId]);

  // Refetch messages when chat changes
  useEffect(() => {
    if (selectedChatId) {
      refetchMessages();
    }
  }, [selectedChatId, refetchMessages]);

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
    setIsWaitingForResponse(true);
    
    try {
      // First, insert the user message
      const { data: messageData } = await insertMessage({
        variables: {
          chat_id: selectedChatId,
          content,
          role: 'user',
        },
      });

      console.log('User message inserted:', messageData);

      // Force immediate refetch to show user message
      await refetchMessages();

      // Then send to chatbot
      console.log('Sending to chatbot...');
      const { data: chatbotData } = await sendMessageToChatbot({
        variables: {
          chat_id: selectedChatId,
          message: content,
        },
      });

      console.log('Chatbot mutation response:', chatbotData);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsWaitingForResponse(false);
    } finally {
      setIsSending(false);
      // Keep isWaitingForResponse true - it will be set to false by the effect
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
              {(isSending || isWaitingForResponse) && (
                <div style={{
                  textAlign: 'center',
                  padding: '10px',
                  color: '#666',
                  fontSize: '14px',
                  fontStyle: 'italic'
                }}>
                  {isSending ? 'Sending...' : 'AI is typing...'}
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