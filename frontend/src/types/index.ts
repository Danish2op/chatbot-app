export interface User {
  id: string;
  email: string;
  displayName?: string;
}

export interface Chat {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  user_id: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}