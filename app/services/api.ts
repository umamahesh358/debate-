import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { jwtDecode } from 'jwt-decode';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000; // 30 seconds

// Token management
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface StoredAuth {
  user: any;
  tokens: TokenPair;
  expiresAt: number;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private tokenRefreshPromise: Promise<TokenPair> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
    this.loadStoredAuth();
  }

  // Setup axios interceptors
  private setupInterceptors(): void {
    // Request interceptor for adding auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const auth = this.getStoredAuth();

        if (auth && auth.tokens.accessToken) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${auth.tokens.accessToken}`
          };
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          try {
            // Try to refresh the token
            const newTokens = await this.refreshTokens();

            if (newTokens) {
              // Update the failed request with new token
              originalRequest._retry = true;
              originalRequest.headers = {
                ...originalRequest.headers,
                'Authorization': `Bearer ${newTokens.accessToken}`
              };

              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async register(userData: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/auth/register', userData);

      if (response.data.success) {
        this.storeAuth(response.data.data);
      }

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/auth/login', credentials);

      if (response.data.success) {
        this.storeAuth(response.data.data);
      }

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/auth/logout');
      this.clearAuth();
    } catch (error: any) {
      // Still clear auth even if API call fails
      this.clearAuth();
      throw this.handleError(error);
    }
  }

  async refreshTokens(): Promise<TokenPair> {
    // Prevent multiple simultaneous refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.doTokenRefresh();

    try {
      const tokens = await this.tokenRefreshPromise;
      return tokens;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async doTokenRefresh(): Promise<TokenPair> {
    const auth = this.getStoredAuth();

    if (!auth || !auth.tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: auth.tokens.refreshToken
    });

    if (response.data.success) {
      const newTokens = response.data.data.tokens;
      this.updateStoredTokens(newTokens);
      return newTokens;
    } else {
      throw new Error('Token refresh failed');
    }
  }

  getCurrentUser(): any | null {
    const auth = this.getStoredAuth();
    return auth?.user || null;
  }

  isAuthenticated(): boolean {
    const auth = this.getStoredAuth();

    if (!auth || !auth.tokens.accessToken) {
      return false;
    }

    // Check if token is expired
    try {
      const decoded: any = jwtDecode(auth.tokens.accessToken);
      const currentTime = Date.now() / 1000;

      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Storage methods
  private storeAuth(authData: any): void {
    const auth: StoredAuth = {
      user: authData.user,
      tokens: authData.tokens,
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    };

    localStorage.setItem('debate_platform_auth', JSON.stringify(auth));
  }

  private getStoredAuth(): StoredAuth | null {
    try {
      const stored = localStorage.getItem('debate_platform_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private updateStoredTokens(tokens: TokenPair): void {
    const auth = this.getStoredAuth();

    if (auth) {
      auth.tokens = tokens;
      auth.expiresAt = Date.now() + (15 * 60 * 1000);
      localStorage.setItem('debate_platform_auth', JSON.stringify(auth));
    }
  }

  private clearAuth(): void {
    localStorage.removeItem('debate_platform_auth');
  }

  private loadStoredAuth(): void {
    const auth = this.getStoredAuth();

    if (auth && auth.tokens.accessToken) {
      // Set default auth header for initial requests
      this.axiosInstance.defaults.headers.common = {
        'Authorization': `Bearer ${auth.tokens.accessToken}`
      };
    }
  }

  // Debate APIs
  async getTopics(params: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    search?: string;
    tags?: string[] | string;
  } = {}): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/debates/topics', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getTopicById(topicId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/debates/topics/${topicId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getRandomTopic(params: {
    category?: string;
    difficulty?: string;
    tags?: string[] | string;
  } = {}): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/debates/topics/random', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createDebateSession(data: {
    topicId: string;
    role: 'government' | 'opposition';
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/debates/sessions', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDebateSession(sessionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/debates/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateDebateSession(sessionId: string, data: any): Promise<any> {
    try {
      const response = await this.axiosInstance.put(`/debates/sessions/${sessionId}`, data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserDebates(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/debates/sessions', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDebateStats(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/debates/stats');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async generateSessionFeedback(sessionId: string, data: {
    transcript: any;
    metrics: any;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/debates/sessions/${sessionId}/feedback`, data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Learning APIs
  async getLearningModules(params: {
    page?: number;
    limit?: number;
    level?: number;
    category?: string;
  } = {}): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/learning/modules', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getLearningModule(moduleId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/learning/modules/${moduleId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateLearningProgress(data: {
    moduleId: string;
    status?: string;
    completion?: number;
    timeSpent?: number;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/learning/progress', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getLearningProgress(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/learning/progress', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getLearningPath(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/learning/path');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async completeLearningModule(data: {
    moduleId: string;
    completion?: number;
    timeSpent?: number;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/learning/complete', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Gamification APIs
  async getGamificationProfile(userId?: string): Promise<any> {
    try {
      const url = userId ? `/gamification/profile/${userId}` : '/gamification/profile';
      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async awardPoints(data: {
    userId?: string;
    points: number;
    eventType: string;
    description: string;
    metadata?: any;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/gamification/points', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getLeaderboard(params: {
    period?: string;
    category?: string;
    limit?: number;
  } = {}): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/gamification/leaderboard', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserAchievements(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/gamification/achievements', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getAvailableAchievements(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/gamification/achievements/available');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserStreaks(userId?: string): Promise<any> {
    try {
      const url = userId ? `/gamification/streaks/${userId}` : '/gamification/streaks';
      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Upload APIs
  async uploadVideo(file: File, sessionId?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('video', file);
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const response = await this.axiosInstance.post('/uploads/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 5 * 60 * 1000 // 5 minutes for video upload
      });

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async uploadAvatar(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await this.axiosInstance.post('/uploads/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60 * 1000 // 1 minute for avatar upload
      });

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getVideoUpload(uploadId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/uploads/video/${uploadId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deleteVideoUpload(uploadId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.delete(`/uploads/video/${uploadId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUploadHistory(params: {
    page?: number;
    limit?: number;
    type?: string;
  } = {}): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/uploads/history', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // User profile APIs
  async updateProfile(data: {
    displayName?: string;
    bio?: string;
    preferences?: any;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.put('/auth/profile', data);

      if (response.data.success) {
        // Update stored user data
        const auth = this.getStoredAuth();
        if (auth) {
          auth.user = { ...auth.user, ...data };
          this.storeAuth(auth);
        }
      }

      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.put('/auth/password', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Error handling
  private handleError(error: any): Error {
    if (error.response) {
      // API error response
      const message = error.response.data?.error || error.response.data?.message || 'API Error';
      const status = error.response.status;

      return new Error(`API Error (${status}): ${message}`);
    } else if (error.request) {
      // Network error
      return new Error('Network Error: Unable to reach the server');
    } else {
      // Other error
      return new Error(`Error: ${error.message}`);
    }
  }

  // Utility method to check API health
  async checkHealth(): Promise<{ status: string; latency: number }> {
    const startTime = Date.now();

    try {
      const response = await this.axiosInstance.get('/health', {
        timeout: 5000 // 5 second timeout
      });

      const latency = Date.now() - startTime;

      return {
        status: response.data.status || 'unknown',
        latency
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime
      };
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export individual methods for easier usage
export const {
  // Auth
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  updateProfile,
  changePassword,

  // Debates
  getTopics,
  getTopicById,
  getRandomTopic,
  createDebateSession,
  getDebateSession,
  updateDebateSession,
  getUserDebates,
  getDebateStats,
  generateSessionFeedback,

  // Learning
  getLearningModules,
  getLearningModule,
  updateLearningProgress,
  getLearningProgress,
  getLearningPath,
  completeLearningModule,

  // Gamification
  getGamificationProfile,
  awardPoints,
  getLeaderboard,
  getUserAchievements,
  getAvailableAchievements,
  getUserStreaks,

  // Uploads
  uploadVideo,
  uploadAvatar,
  getVideoUpload,
  deleteVideoUpload,
  getUploadHistory,

  // Utilities
  checkHealth
} = {
  register: (data: any) => apiClient.register(data),
  login: (credentials: any) => apiClient.login(credentials),
  logout: () => apiClient.logout(),
  getCurrentUser: () => apiClient.getCurrentUser(),
  isAuthenticated: () => apiClient.isAuthenticated(),
  updateProfile: (data: any) => apiClient.updateProfile(data),
  changePassword: (data: any) => apiClient.changePassword(data),

  getTopics: (params?: any) => apiClient.getTopics(params || {}),
  getTopicById: (topicId: string) => apiClient.getTopicById(topicId),
  getRandomTopic: (params?: any) => apiClient.getRandomTopic(params || {}),
  createDebateSession: (data: any) => apiClient.createDebateSession(data),
  getDebateSession: (sessionId: string) => apiClient.getDebateSession(sessionId),
  updateDebateSession: (sessionId: string, data: any) => apiClient.updateDebateSession(sessionId, data),
  getUserDebates: (params?: any) => apiClient.getUserDebates(params || {}),
  getDebateStats: () => apiClient.getDebateStats(),
  generateSessionFeedback: (sessionId: string, data: any) => apiClient.generateSessionFeedback(sessionId, data),

  getLearningModules: (params?: any) => apiClient.getLearningModules(params || {}),
  getLearningModule: (moduleId: string) => apiClient.getLearningModule(moduleId),
  updateLearningProgress: (data: any) => apiClient.updateLearningProgress(data),
  getLearningProgress: (params?: any) => apiClient.getLearningProgress(params || {}),
  getLearningPath: () => apiClient.getLearningPath(),
  completeLearningModule: (data: any) => apiClient.completeLearningModule(data),

  getGamificationProfile: (userId?: string) => apiClient.getGamificationProfile(userId),
  awardPoints: (data: any) => apiClient.awardPoints(data),
  getLeaderboard: (params?: any) => apiClient.getLeaderboard(params || {}),
  getUserAchievements: (params?: any) => apiClient.getUserAchievements(params || {}),
  getAvailableAchievements: () => apiClient.getAvailableAchievements(),
  getUserStreaks: (userId?: string) => apiClient.getUserStreaks(userId),

  uploadVideo: (file: File, sessionId?: string) => apiClient.uploadVideo(file, sessionId),
  uploadAvatar: (file: File) => apiClient.uploadAvatar(file),
  getVideoUpload: (uploadId: string) => apiClient.getVideoUpload(uploadId),
  deleteVideoUpload: (uploadId: string) => apiClient.deleteVideoUpload(uploadId),
  getUploadHistory: (params?: any) => apiClient.getUploadHistory(params || {}),

  checkHealth: () => apiClient.checkHealth()
};