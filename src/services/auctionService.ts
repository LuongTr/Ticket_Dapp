/**
 * Auction Service for Lumina NFT Ticketing
 * Handles auction operations through backend API calls
 */

const API_BASE_URL = 'http://localhost:3001/api/marketplace';

export interface AuctionData {
  id: number;
  ticketId: number;
  eventId: number;
  sellerAddress: string;
  startingPrice: number;
  currentPrice: number;
  highestBidder?: string;
  bidCount: number;
  endTime: string;
  startTime?: string;
  status: 'active' | 'ended';
  createdAt: string;
  ipfsHash?: string;
  // Additional fields for display
  event_title?: string;
  event_date?: string;
  event_location?: string;
  event_image_url?: string;
  event_category?: string;
}

export interface BidData {
  id: number;
  auctionId: number;
  bidderAddress: string;
  bidAmount: number;
  bidTime: string;
  bid_hash?: string;
  // Legacy compatibility
  bidder_address?: string;
  bid_amount?: number;
  bid_time?: string;
}

export interface CreateAuctionData {
  ticketId: number;
  eventId: number;
  startingPrice: number;
  endTime: string;
  startTime?: string;
}

export interface PlaceBidData {
  bidAmount: number;
  message: string;
  signature: string;
}

class AuctionService {
  /**
   * Create a new auction via backend API
   * @param auctionData - Auction creation data
   * @returns Promise with created auction data
   */
  async createAuction(auctionData: CreateAuctionData): Promise<AuctionData> {
    try {
      console.log('🏛️ Creating auction via backend API...');

      const response = await fetch(`${API_BASE_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auctionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create auction');
      }

      const result = await response.json();
      console.log('✅ Auction created successfully:', result.data);

      return result.data;
    } catch (error) {
      console.error('❌ Failed to create auction:', error);
      throw error;
    }
  }

  /**
   * Get auction by ID via backend API
   * @param auctionId - Auction ID to fetch
   * @returns Promise with auction data
   */
  async getAuction(auctionId: number): Promise<AuctionData | null> {
    try {
      console.log(`🔍 Fetching auction ${auctionId} via backend API...`);

      const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch auction');
      }

      const result = await response.json();
      console.log(`✅ Auction ${auctionId} retrieved successfully`);

      return result.data;
    } catch (error) {
      console.error(`❌ Failed to get auction ${auctionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all auctions via backend API
   * @param filters - Optional filters for auctions
   * @returns Promise with array of auction data
   */
  async getAuctions(filters?: {
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    eventId?: number;
    sellerAddress?: string;
  }): Promise<AuctionData[]> {
    try {
      console.log('🔍 Fetching auctions via backend API...');

      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `${API_BASE_URL}/auctions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch auctions');
      }

      const result = await response.json();
      console.log(`✅ Retrieved ${result.data.length} auctions`);

      return result.data;
    } catch (error) {
      console.error('❌ Failed to get auctions:', error);
      throw error;
    }
  }

  /**
   * Place a bid on an auction via backend API
   * @param auctionId - Auction ID
   * @param bidData - Bid data including signature
   * @returns Promise with updated auction data
   */
  async placeBid(auctionId: number, bidData: PlaceBidData): Promise<AuctionData> {
    try {
      console.log(`💰 Placing bid on auction ${auctionId} via backend API...`);

      const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bidData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place bid');
      }

      const result = await response.json();
      console.log(`✅ Bid placed successfully on auction ${auctionId}`);

      return result.data;
    } catch (error) {
      console.error(`❌ Failed to place bid on auction ${auctionId}:`, error);
      throw error;
    }
  }

  /**
   * Get bids for an auction via backend API
   * @param auctionId - Auction ID
   * @returns Promise with array of bid data
   */
  async getAuctionBids(auctionId: number): Promise<BidData[]> {
    try {
      console.log(`📋 Fetching bids for auction ${auctionId} via backend API...`);

      const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}/bids`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch auction bids');
      }

      const result = await response.json();
      console.log(`✅ Retrieved ${result.data.length} bids for auction ${auctionId}`);

      return result.data;
    } catch (error) {
      console.error(`❌ Failed to get bids for auction ${auctionId}:`, error);
      throw error;
    }
  }

  /**
   * Get auctions by seller address via backend API
   * @param sellerAddress - Seller wallet address
   * @returns Promise with array of seller's auctions
   */
  async getAuctionsBySeller(sellerAddress: string): Promise<AuctionData[]> {
    try {
      console.log(`👤 Getting auctions for seller ${sellerAddress} via backend API...`);

      const response = await fetch(`${API_BASE_URL}/sellers/${sellerAddress}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch seller auctions');
      }

      const result = await response.json();
      console.log(`✅ Retrieved ${result.data.length} auctions for seller ${sellerAddress}`);

      return result.data;
    } catch (error) {
      console.error(`❌ Failed to get auctions for seller ${sellerAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get auctions where user has bids via backend API
   * @param bidderAddress - Bidder wallet address
   * @returns Promise with array of auctions with user bids
   */
  async getAuctionsByBidder(bidderAddress: string): Promise<AuctionData[]> {
    try {
      console.log(`💰 Getting auctions with bids from ${bidderAddress} via backend API...`);

      const response = await fetch(`${API_BASE_URL}/bidders/${bidderAddress}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch bidder auctions');
      }

      const result = await response.json();
      console.log(`✅ Retrieved ${result.data.length} auctions with bids from ${bidderAddress}`);

      return result.data;
    } catch (error) {
      console.error(`❌ Failed to get auctions for bidder ${bidderAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get auction statistics
   * @param auctionId - Auction ID
   * @returns Promise with auction stats
   */
  async getAuctionStats(auctionId: number): Promise<{
    bidCount: number;
    currentPrice: number;
    highestBidder?: string;
    timeRemaining: number; // milliseconds
  }> {
    try {
      const auction = await this.getAuction(auctionId);
      if (!auction) {
        throw new Error('Auction not found');
      }

      const timeRemaining = Math.max(0, new Date(auction.endTime).getTime() - Date.now());

      return {
        bidCount: auction.bidCount,
        currentPrice: auction.currentPrice,
        highestBidder: auction.highestBidder,
        timeRemaining,
      };
    } catch (error) {
      console.error(`❌ Failed to get auction stats for ${auctionId}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const auctionService = new AuctionService();
export default auctionService;
