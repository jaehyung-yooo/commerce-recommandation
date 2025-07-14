const API_BASE_URL = 'http://localhost:8000/api/v1';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
}

interface User {
  email: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // 페이지 로드 시 로컬 스토리지에서 토큰 복원
    this.token = localStorage.getItem('access_token');
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const result: AuthResponse = await response.json();
    this.token = result.access_token;
    localStorage.setItem('access_token', result.access_token);
    return result;
  }

  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return await response.json();
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      this.logout();
      return null;
    }

    return await response.json();
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // API 요청에 사용할 인증 헤더
  getAuthHeaders(): Record<string, string> {
    if (!this.token) return {};
    return {
      'Authorization': `Bearer ${this.token}`,
    };
  }
}

export const authService = new AuthService();
export type { LoginData, RegisterData, User, AuthResponse }; 