import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
}

// Function to clean message content from escape sequences
const cleanMessageContent = (content: string): string => {
  if (!content || typeof content !== 'string') return content;
  
  return content
    .replace(/\\b/g, '')           // Remove \b markers
    .replace(/\\\\b/g, '')         // Remove escaped \b
    .replace(/\\\\n/g, '\n')       // Convert \\n to actual newlines
    .replace(/\\n/g, '\n')         // Convert \n to actual newlines
    .replace(/\\r/g, '')           // Remove carriage returns
    .replace(/  +/g, ' ')          // Remove multiple spaces
    .trim();
};

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="messages-loading">
        <div className="loading-spinner">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <div className="welcome-message">
            <h3>Start a conversation</h3>
            <p>Send a message to begin chatting with the AI assistant.</p>
          </div>
        </div>
      ) : (
        messages.map((message) => {
          const cleanedContent = cleanMessageContent(message.content);
          return (
            <div
              key={message.id}
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {cleanedContent.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < cleanedContent.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="message-time">
                  {new Date(message.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;