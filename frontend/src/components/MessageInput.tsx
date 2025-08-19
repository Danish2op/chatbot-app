import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled) return;

    const messageToSend = message.trim();
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setMessage(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Waiting for response..." : "Type your message..."}
            disabled={disabled}
            rows={1}
            className="message-textarea"
            style={{
              resize: 'none',
              overflow: 'hidden',
              minHeight: '24px',
              maxHeight: '120px',
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? 'not-allowed' : 'text'
            }}
          />
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="send-button"
            style={{
              opacity: (!message.trim() || disabled) ? 0.5 : 1,
              cursor: (!message.trim() || disabled) ? 'not-allowed' : 'pointer'
            }}
          >
            {disabled ? '⏳' : '→'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;