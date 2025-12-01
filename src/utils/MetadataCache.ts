/**
 * MetadataCache - Cache track metadata to reduce API calls
 */

import type { Track } from '../types/lavalink';

interface CacheEntry {
  track: Track;
  timestamp: number;
}

export class MetadataCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number; // Time to live in ms

  constructor(maxSize: number = 1000, ttl: number = 3600000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get track from cache
   */
  get(identifier: string): Track | null {
    const entry = this.cache.get(identifier);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(identifier);
      return null;
    }

    return entry.track;
  }

  /**
   * Set track in cache
   */
  set(identifier: string, track: Track): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(identifier, {
      track,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if track exists in cache
   */
  has(identifier: string): boolean {
    return this.get(identifier) !== null;
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}
