import apiClient from './client';

export interface SearchSuggestion {
  neighborhood: string;
}

export interface SearchHistoryItem {
  id: number;
  search_term: string;
  created_at: string;
  user_id: number;
}

export const searchApi = {
  getSuggestions: async (query: string): Promise<string[]> => {
    const { data } = await apiClient.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
    return data.data;
  },

  saveSearchHistory: async (searchTerm: string): Promise<void> => {
    try {
      await apiClient.post('/search/history', { search_term: searchTerm });
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  },

  getSearchHistory: async (): Promise<SearchHistoryItem[]> => {
    const { data } = await apiClient.get('/search/history');
    return data.data;
  },

  clearSearchHistory: async (): Promise<void> => {
    await apiClient.delete('/search/history');
  },
};