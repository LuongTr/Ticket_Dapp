export interface Review {
  id: string;
  eventId: number;
  userAddress?: string; // camelCase for frontend
  user_address?: string; // snake_case from database
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  isVerified: boolean;
}

export interface ReviewStats {
  eventId: number;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
}

export interface CreateReviewRequest {
  eventId: number;
  rating: number;
  comment: string;
  signature: string;
  message: string;
}

class ReviewService {
  private static readonly API_BASE_URL = 'http://localhost:3001/api';

  /**
   * Get all reviews for a specific event
   */
  static async getReviews(eventId: number): Promise<Review[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/reviews/${eventId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for a specific event
   */
  static async getReviewStats(eventId: number): Promise<ReviewStats> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/reviews/${eventId}/stats`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch review statistics');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }

  /**
   * Submit a new review
   */
  static async submitReview(request: CreateReviewRequest): Promise<Review> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      return data.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  /**
   * Generate a signature message for review submission
   */
  static generateReviewMessage(eventId: number, action: 'create' | 'update' = 'create'): string {
    const timestamp = new Date().toISOString();
    return `Lumina Tickets: Review ${action} for event ${eventId} at ${timestamp}`;
  }

  /**
   * Update an existing review
   */
  static async updateReview(reviewId: string, request: CreateReviewRequest): Promise<Review> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update review');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  /**
   * Vote on a review (helpful/unhelpful)
   */
  static async voteOnReview(reviewId: string, voteType: 'helpful' | 'unhelpful', signature: string, message: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteType,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to vote on review');
      }
    } catch (error) {
      console.error('Error voting on review:', error);
      throw error;
    }
  }
}

export default ReviewService;
