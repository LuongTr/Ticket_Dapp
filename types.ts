export interface Review {
  id: string;
  userAddress: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface NftEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  priceETH: number;
  imageUrl: string;
  organizer: string;
  totalTickets: number;
  soldTickets: number;
  category: 'Music' | 'Tech' | 'Art' | 'Sports' | 'Other';
  reviews: Review[];
}

export interface Ticket {
  id: string;
  eventId: string;
  ownerAddress: string;
  purchaseDate: string;
  qrCodeData: string;
  isUsed: boolean;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balanceETH: number;
}

export enum ViewState {
  HOME = 'HOME',
  EXPLORE = 'EXPLORE',
  MY_EVENTS = 'MY_EVENTS',
  CREATE = 'CREATE',
  DASHBOARD = 'DASHBOARD',
  EVENT_DETAILS = 'EVENT_DETAILS',
}

declare global {
  interface Window {
    ethereum: any;
  }
}