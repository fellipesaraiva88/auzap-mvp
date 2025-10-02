import api from '@/lib/api';

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai' | 'agent';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  contactId: string;
  instanceId: string;
  status: 'active' | 'pending' | 'resolved' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  aiActive: boolean;
  intent?: string;
  contact?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  messages: Message[];
  aiActions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListConversationsParams {
  status?: string;
  instanceId?: string;
  limit?: number;
  offset?: number;
}

class ConversationsService {
  async list(params?: ListConversationsParams) {
    const { data } = await api.get<{ conversations: Conversation[]; total: number }>(
      '/conversations',
      { params }
    );
    return data;
  }

  async getById(id: string) {
    const { data } = await api.get<Conversation>(`/conversations/${id}`);
    return data;
  }

  async getMessages(conversationId: string) {
    const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
    return data;
  }

  async sendMessage(conversationId: string, content: string) {
    const { data } = await api.post<Message>(`/conversations/${conversationId}/messages`, {
      content,
    });
    return data;
  }

  async assumeConversation(conversationId: string) {
    const { data } = await api.post(`/conversations/${conversationId}/assume`);
    return data;
  }

  async resolveConversation(conversationId: string) {
    const { data } = await api.post(`/conversations/${conversationId}/resolve`);
    return data;
  }

  async closeConversation(conversationId: string) {
    const { data } = await api.post(`/conversations/${conversationId}/close`);
    return data;
  }
}

export const conversationsService = new ConversationsService();
