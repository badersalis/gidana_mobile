export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  profile_picture?: string;
  gender?: string;
  date_of_birth?: string;
  country?: string;
  member_since: string;
  active: boolean;
  locale: string;
  timezone: string;
  created_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender?: User;
}

export interface Conversation {
  id: number;
  property_id: number;
  owner_id: number;
  tenant_id: number;
  created_at: string;
  property?: Property;
  owner?: User;
  tenant?: User;
  last_message?: Message;
  messages?: Message[];
}

export interface PropertyImage {
  id: number;
  filename: string;
  property_id: number;
  is_main: boolean;
}

export interface Review {
  id: number;
  property_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  is_verified: boolean;
  created_at: string;
  user?: User;
}

export interface Property {
  id: number;
  title: string;
  description?: string;
  neighborhood: string;
  country: string;
  property_type: 'Studio' | 'Appartement' | 'Maison';
  transaction_type: 'À louer' | 'À vendre';
  rooms: number;
  bathrooms: number;
  shower_type?: 'interne' | 'externe';
  surface?: number;
  has_courtyard: boolean;
  has_water: boolean;
  has_electricity: boolean;
  exact_address?: string;
  whatsapp_contact?: string;
  phone_contact?: string;
  price: number;
  currency: string;
  is_available: boolean;
  owner_id: number;
  owner?: User;
  user?: User;
  images?: PropertyImage[];
  reviews?: Review[];
  average_rating: number;
  review_count: number;
  is_favorited: boolean;
  created_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  provider: 'Nita' | 'MPesa' | 'Visa' | 'Mastercard' | 'PayPal';
  nature?: string;
  balance: number;
  currency: string;
  selected: boolean;
  masked_phone?: string;
  masked_email?: string;
  masked_card?: string;
}

export type TransactionStatus = 'done' | 'failed' | 'ongoing';

export interface Transaction {
  id: number;
  user_id: number;
  wallet_id: number;
  amount: number;
  nature: 'expense' | 'income';
  service: string;
  service_provider: string;
  currency: string;
  status: TransactionStatus;
  created_at: string;
  wallet?: Wallet;
}

export interface Rental {
  id: number;
  property_id: number;
  tenant_id: number;
  start_date: string;
  end_date?: string;
  monthly_price: number;
  status: 'pending' | 'occupied' | 'available' | 'completed';
  created_at: string;
  property?: Property;
}

export interface Alert {
  id: number;
  user_id: number;
  neighborhood?: string;
  property_type?: string;
  min_rooms?: number;
  max_price?: number;
  transaction_type?: string;
  is_active: boolean;
  created_at: string;
}

export interface SearchHistory {
  id: number;
  search_term: string;
  created_at: string;
}

// Alias for SearchHistoryItem to maintain consistency
export type SearchHistoryItem = SearchHistory;

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Favorites: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type PropertyStackParamList = {
  PropertyList: undefined;
  PropertyDetail: { id: number };
  AddProperty: undefined;
  EditProperty: { id: number };
};