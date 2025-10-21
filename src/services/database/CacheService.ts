// Local storage service for offline functionality and caching
// Provides fallback when Supabase is not available

import type { MissingPerson, Alert } from '@/types';

export interface CacheData {
  missingPersons: MissingPerson[];
  alerts: Alert[];
  embeddings: Array<{
    personId: string;
    embedding: number[];
    photoId: string;
  }>;
  lastSync: string;
}

export class CacheService {
  private static readonly CACHE_KEY = 'tracevision_cache';
  private static readonly CACHE_VERSION = '1.0.0';

  // Save data to localStorage
  static save(data: Partial<CacheData>): void {
    try {
      const existingCache = this.load();
      const updatedCache = {
        ...existingCache,
        ...data,
        lastSync: new Date().toISOString(),
        version: this.CACHE_VERSION
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(updatedCache));
      console.log('💾 Data saved to cache');
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }

  // Load data from localStorage
  static load(): Partial<CacheData> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return {};

      const data = JSON.parse(cached) as CacheData & { version: string };

      // Check cache version compatibility
      if (data.version !== this.CACHE_VERSION) {
        console.warn('⚠️ Cache version mismatch, clearing cache');
        this.clear();
        return {};
      }

      console.log('📂 Cache loaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Error loading cache:', error);
      this.clear();
      return {};
    }
  }

  // Clear all cache
  static clear(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  // Missing Persons operations
  static saveMissingPersons(persons: MissingPerson[]): void {
    this.save({ missingPersons: persons });
  }

  static getMissingPersons(): MissingPerson[] {
    const cache = this.load();
    return cache.missingPersons || [];
  }

  static addMissingPerson(person: MissingPerson): void {
    const persons = this.getMissingPersons();
    persons.push(person);
    this.saveMissingPersons(persons);
  }

  static updateMissingPerson(id: string, updates: Partial<MissingPerson>): void {
    const persons = this.getMissingPersons();
    const index = persons.findIndex(p => p.id === id);
    if (index !== -1) {
      persons[index] = { ...persons[index], ...updates };
      this.saveMissingPersons(persons);
    }
  }



  // Embeddings operations
  static saveEmbeddings(embeddings: Array<{
    personId: string;
    embedding: number[];
    photoId: string;
  }>): void {
    this.save({ embeddings });
  }

  static getEmbeddings(): Array<{
    personId: string;
    embedding: number[];
    photoId: string;
  }> {
    const cache = this.load();
    return cache.embeddings || [];
  }

  static addEmbedding(data: {
    personId: string;
    embedding: number[];
    photoId: string;
  }): void {
    const embeddings = this.getEmbeddings();
    embeddings.push(data);
    this.saveEmbeddings(embeddings);
  }

  // Get embeddings for matching (optimized for face recognition)
  static getEmbeddingsForMatching(): Array<{
    id: string;
    name: string;
    embedding: number[];
  }> {
    const persons = this.getMissingPersons();
    const embeddings = this.getEmbeddings();

    return embeddings.map(embedding => {
      const person = persons.find(p => p.id === embedding.personId);

      return {
        id: embedding.personId,
        name: person?.name || 'Unknown',
        embedding: embedding.embedding
      };
    }).filter(item => item.name !== 'Unknown');
  }

  // Alerts operations
  static saveAlerts(alerts: Alert[]): void {
    this.save({ alerts });
  }

  static getAlerts(): Alert[] {
    const cache = this.load();
    return cache.alerts || [];
  }

  static addAlert(alert: Alert): void {
    const alerts = this.getAlerts();
    alerts.unshift(alert); // Add to beginning (newest first)
    this.saveAlerts(alerts);
  }

  static updateAlert(id: string, updates: Partial<Alert>): void {
    const alerts = this.getAlerts();
    const index = alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      alerts[index] = { ...alerts[index], ...updates };
      this.saveAlerts(alerts);
    }
  }

  // Cache statistics
  static getCacheStats(): {
    size: string;
    missingPersonsCount: number;
    embeddingsCount: number;
    alertsCount: number;
    lastSync: string | null;
  } {
    const cache = this.load();
    const cacheString = localStorage.getItem(this.CACHE_KEY) || '';

    return {
      size: this.formatBytes(new Blob([cacheString]).size),
      missingPersonsCount: cache.missingPersons?.length || 0,
      embeddingsCount: cache.embeddings?.length || 0,
      alertsCount: cache.alerts?.length || 0,
      lastSync: cache.lastSync || null
    };
  }

  // Utility: Format bytes to human readable
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if cache is recent (within specified hours)
  static isCacheRecent(maxAgeHours: number = 24): boolean {
    const cache = this.load();
    if (!cache.lastSync) return false;

    const lastSync = new Date(cache.lastSync);
    const now = new Date();
    const diffInHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    return diffInHours <= maxAgeHours;
  }

  // Export cache for backup
  static exportCache(): string | null {
    try {
      const cache = this.load();
      return JSON.stringify(cache, null, 2);
    } catch (error) {
      console.error('❌ Error exporting cache:', error);
      return null;
    }
  }

  // Import cache from backup
  static importCache(cacheJson: string): boolean {
    try {
      const data = JSON.parse(cacheJson);
      this.save(data);
      console.log('📥 Cache imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing cache:', error);
      return false;
    }
  }
}