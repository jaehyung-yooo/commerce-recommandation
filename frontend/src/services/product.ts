const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface Product {
  id: string;
  product_no: string;
  name: string;
  price: number;
  rating?: number;
  image_url?: string;
  category: string;
  description: string;
  review_count: number;
  brand?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  category_code?: string;
  parent_category_id?: number;
  depth: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryList {
  items: Category[];
  total: number;
}

export interface ProductStatistics {
  product_no: number;
  total_reviews: number;
  average_rating: number;
  rating_distribution: string;
  last_review_date: string;
  review_velocity: number;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  category_id?: number;
  brand?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  tags?: string[];
  sort_by?: string;
  sort_order?: string;
}

export interface ProductList {
  items: Product[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface ReviewSearchParams {
  query: string;
  page?: number;
  size?: number;
  hybrid_weight?: number;
}

class ProductService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async searchProducts(params: ProductSearchParams, page: number = 1, size: number = 10): Promise<ProductList> {
    const searchParams = new URLSearchParams();
    
    // 검색 파라미터 추가
    if (params.query) searchParams.append('query', params.query);
    if (params.category) searchParams.append('category', params.category);
    if (params.category_id) searchParams.append('category_id', params.category_id.toString());
    if (params.brand) searchParams.append('brand', params.brand);
    if (params.min_price) searchParams.append('min_price', params.min_price.toString());
    if (params.max_price) searchParams.append('max_price', params.max_price.toString());
    if (params.min_rating) searchParams.append('min_rating', params.min_rating.toString());
    if (params.tags) searchParams.append('tags', params.tags.join(','));
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params.sort_order) searchParams.append('sort_order', params.sort_order);
    
    // 페이지네이션 파라미터
    searchParams.append('page', page.toString());
    searchParams.append('size', size.toString());

    const response = await fetch(`${API_BASE_URL}/products/search?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search products');
    }

    return await response.json();
  }

  async searchProductsByReviews(query: string, page: number = 1, size: number = 10): Promise<ProductList> {
    const response = await fetch(`${API_BASE_URL}/reviews/search-products-by-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        query: query,
        page: page,
        size: size,
        min_rating: 3.0,
        hybrid_weight: 0.6
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to search products by reviews');
    }

    return await response.json();
  }

  async getProductById(productNo: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${productNo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get product');
    }

    return await response.json();
  }

  async getSimilarProducts(productNo: string, size: number = 10): Promise<ProductList> {
    const response = await fetch(`${API_BASE_URL}/products/similar/${productNo}?size=${size}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get similar products');
    }

    return await response.json();
  }

  async getProductStatistics(productIds: string[]): Promise<ProductStatistics[]> {
    const response = await fetch(`${API_BASE_URL}/products/statistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ product_ids: productIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to get product statistics');
    }

    return await response.json();
  }

  async getCategories(): Promise<CategoryList> {
    const response = await fetch(`${API_BASE_URL}/products/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return await response.json();
  }
}

export const productService = new ProductService(); 