import React from 'react';
import { Chat } from '../types';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, selectedChatId, onSelectChat }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="chat-list">
      {chats.length === 0 ? (
        <div className="empty-chat-list">
          <p>No chats yet. Create your first chat!</p>
        </div>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${selectedChatId === chat.id ? 'selected' : ''}`}
            onClick={() => onSelectChat(chat)}
          >
            <div className="chat-item-content">
              <div className="chat-title">{chat.title}</div>
              <div className="chat-date">{formatDate(chat.updated_at)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;