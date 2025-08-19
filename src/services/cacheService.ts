"use client";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 100;
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
  }

  // Generate cache key from parameters
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  // Check if cache entry is valid
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() < entry.expiresAt;
  }

  // Check if cache entry is stale but not expired
  private isStale(entry: CacheEntry<any>, staleTTL: number = this.defaultTTL / 2): boolean {
    return Date.now() > (entry.timestamp + staleTTL) && Date.now() < entry.expiresAt;
  }

  // Evict oldest entries if cache is full
  private evictIfNeeded(): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  // Get data from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isValid(entry)) {
      return entry.data;
    }

    // Remove expired entry
    this.cache.delete(key);
    return null;
  }

  // Set data in cache
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.evictIfNeeded();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
  }

  // Get or fetch data with caching
  async getOrFetch<T>(
    prefix: string,
    params: Record<string, any>,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const key = this.generateKey(prefix, params);
    const ttl = options.ttl || this.defaultTTL;
    const staleWhileRevalidate = options.staleWhileRevalidate || false;

    // Check cache first
    const cached = this.get<T>(key);
    if (cached) {
      const entry = this.cache.get(key)!;
      
      // If stale-while-revalidate is enabled and data is stale, fetch in background
      if (staleWhileRevalidate && this.isStale(entry)) {
        this.fetchInBackground(key, fetcher, ttl);
      }
      
      return cached;
    }

    // Check if there's already a pending request for this key
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Fetch data
    const fetchPromise = this.fetchAndCache(key, fetcher, ttl);
    this.pendingRequests.set(key, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  // Fetch data and cache it
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // If fetch fails, try to return stale data if available
      const staleData = this.cache.get(key);
      if (staleData) {
        console.warn(`Fetch failed for ${key}, returning stale data:`, error);
        return staleData.data;
      }
      throw error;
    }
  }

  // Fetch in background without blocking
  private async fetchInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
    } catch (error) {
      console.warn(`Background fetch failed for ${key}:`, error);
    }
  }

  // Invalidate cache entry
  invalidate(prefix: string, params?: Record<string, any>): void {
    if (params) {
      const key = this.generateKey(prefix, params);
      this.cache.delete(key);
    } else {
      // Invalidate all entries with this prefix
      const keysToDelete = Array.from(this.cache.keys())
        .filter(key => key.startsWith(prefix + ':'));
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; size: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      size: JSON.stringify(entry.data).length,
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses to calculate
      entries,
    };
  }

  // Preload data
  async preload<T>(
    prefix: string,
    params: Record<string, any>,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const key = this.generateKey(prefix, params);
    if (!this.cache.has(key)) {
      try {
        await this.fetchAndCache(key, fetcher, ttl);
      } catch (error) {
        console.warn(`Preload failed for ${key}:`, error);
      }
    }
  }

  // Batch preload multiple data sets
  async batchPreload<T>(
    requests: Array<{
      prefix: string;
      params: Record<string, any>;
      fetcher: () => Promise<T>;
      ttl?: number;
    }>
  ): Promise<void> {
    const promises = requests.map(({ prefix, params, fetcher, ttl }) =>
      this.preload(prefix, params, fetcher, ttl)
    );
    
    await Promise.allSettled(promises);
  }
}

// Create singleton instance
export const cacheService = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
});

// Specialized cache for analytics data
export const analyticsCacheService = new CacheService({
  ttl: 2 * 60 * 1000, // 2 minutes for analytics (more frequent updates)
  maxSize: 50,
});

// Cache keys constants
export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard_stats',
  REVENUE_DATA: 'revenue_data',
  USER_GROWTH_DATA: 'user_growth_data',
  CONVERSION_RATE_DATA: 'conversion_rate_data',
  PRODUCT_PERFORMANCE_DATA: 'product_performance_data',
  TOP_CUSTOMERS_DATA: 'top_customers_data',
  ANALYTICS_OVERVIEW: 'analytics_overview',
} as const;
