const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface Member {
  member_id: string;
  name: string;
  email?: string;
}

export interface Review {
  id: string;
  content: string;
  rating: number;
  product_no: string;
  member_id?: string;
  member?: Member;
  created_at: string;
  updated_at?: string;
  helpful_count: number;
  sentiment_score?: number;
}

export interface ReviewList {
  items: Review[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface ReviewSearchParams {
  query?: string;
  product_no?: string;
  min_rating?: number;
  max_rating?: number;
  sort_by?: string;
  sort_order?: string;
}

class ReviewService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async getProductReviews(
    productNo: string, 
    page: number = 1
  ): Promise<ReviewList> {
    const params = new URLSearchParams({
      page: page.toString()
    });

    const response = await fetch(`${API_BASE_URL}/reviews/products/${productNo}/reviews?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get product reviews');
    }

    return await response.json();
  }

  async searchReviewsHybrid(
    query: string,
    page: number = 1,
    size: number = 20,
    hybridWeight: number = 0.5
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      hybrid_weight: hybridWeight.toString()
    });

    const response = await fetch(`${API_BASE_URL}/reviews/search-hybrid?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to search reviews');
    }

    return await response.json();
  }
}

export const reviewService = new ReviewService(); 