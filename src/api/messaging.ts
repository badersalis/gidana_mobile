import apiClient from './client';
import { Conversation, Message } from '../types';

export const messagingApi = {
  getConversations: () =>
    apiClient.get<{ data: Conversation[] }>('/conversations'),

  startConversation: (propertyId: number) =>
    apiClient.post<{ data: Conversation }>('/conversations', { property_id: propertyId }),

  getConversation: (id: number) =>
    apiClient.get<{ data: Conversation }>(`/conversations/${id}`),

  sendMessage: (conversationId: number, content: string) =>
    apiClient.post<{ data: Message }>(`/conversations/${conversationId}/messages`, { content }),

  deleteMessage: (conversationId: number, msgId: number) =>
    apiClient.delete(`/conversations/${conversationId}/messages/${msgId}`),
};
