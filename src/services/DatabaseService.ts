import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    try {
      // Initialize Supabase client with proper configuration
      this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        global: {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, apikey'
          }
        }
      });
      console.log('✅ Real Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Supabase:', error);
      throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getStorageKey(key: string): string {
    return `tracevision_${key}`;
  }

  /**
   * Store face embedding for a case in the database
   */
  async storeFaceEmbedding(
    caseId: string,
    faceEmbedding: number[],
    metadata?: {
      confidence?: number;
      processingTime?: number;
      faceDetectionData?: any;
    }
  ): Promise<{ id: string; success: boolean; error?: string }> {
    try {
      console.log('💾 Storing face embedding in real Supabase...', { caseId, embeddingLength: faceEmbedding.length });

      return await this.storeInSupabase(caseId, faceEmbedding, metadata);
    } catch (error) {
      console.error('❌ Error storing face embedding:', error);
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async storeInSupabase(
    caseId: string,
    faceEmbedding: number[],
    metadata?: {
      confidence?: number;
      processingTime?: number;
      faceDetectionData?: any;
    }
  ): Promise<{ id: string; success: boolean; error?: string }> {
    console.log('🗄️ Storing in Supabase...');

    // Convert embedding array to JSON string for storage
    const embeddingJson = JSON.stringify(faceEmbedding);

    const { data, error } = await this.supabase!
      .from('case_details')
      .insert([
        {
          Case_id: caseId,
          Face_embedding: embeddingJson,
          created_at: new Date().toISOString(),
          // Add metadata as JSON if needed
          ...(metadata && { metadata: JSON.stringify(metadata) })
        }
      ])
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Face embedding stored in Supabase successfully:', data.id);
    return {
      id: data.id,
      success: true
    };
  }

  private async storeInMockService(
    caseId: string,
    faceEmbedding: number[],
    metadata?: {
      confidence?: number;
      processingTime?: number;
      faceDetectionData?: any;
    }
  ): Promise<{ id: string; success: boolean; error?: string }> {
    console.log('🗄️ Storing in MockSupabaseService...');

    try {
      const result = await this.mockService.insert('case_details', {
        Case_id: caseId,
        Face_embedding: JSON.stringify(faceEmbedding),
        created_at: new Date().toISOString(),
        ...(metadata && { metadata: JSON.stringify(metadata) })
      }, { select: 'id' });

      if (result.error) {
        throw new Error(result.error);
      }

      const recordId = result.data.id || result.data[0]?.id;
      console.log('✅ Face embedding stored in MockSupabaseService successfully:', recordId);
      return {
        id: recordId,
        success: true
      };
    } catch (error) {
      console.error('❌ Error storing in MockSupabaseService:', error);
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Mock service error'
      };
    }
  }

  private storeInLocalStorage(
    caseId: string,
    faceEmbedding: number[],
    metadata?: {
      confidence?: number;
      processingTime?: number;
      faceDetectionData?: any;
    }
  ): { id: string; success: boolean; error?: string } {
    console.log('📁 Storing in localStorage...');

    const record = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      caseId,
      embedding: faceEmbedding,
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };

    // Store in localStorage
    const existingRecords = JSON.parse(localStorage.getItem(this.getStorageKey('embeddings')) || '[]');
    existingRecords.push(record);
    localStorage.setItem(this.getStorageKey('embeddings'), JSON.stringify(existingRecords));

    console.log('✅ Face embedding stored in localStorage successfully:', record.id);
    return {
      id: record.id,
      success: true
    };
  }

  /**
   * Retrieve all face embeddings from the database
   */
  async getAllFaceEmbeddings(): Promise<Array<{
    id: string;
    caseId: string;
    embedding: number[];
    createdAt: string;
    metadata?: any;
  }>> {
    try {
      console.log('📋 Retrieving all face embeddings from real Supabase...');
      return await this.getAllFromSupabase();
    } catch (error) {
      console.error('❌ Error retrieving face embeddings:', error);
      throw error;
    }
  }

  private async getAllFromSupabase(): Promise<Array<{
    id: string;
    caseId: string;
    embedding: number[];
    createdAt: string;
    metadata?: any;
  }>> {
    console.log('🗄️ Retrieving from Supabase...');

    const { data, error } = await this.supabase!
      .from('case_details')
      .select('id, Case_id, Face_embedding, created_at, metadata')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Parse JSON embeddings back to arrays
    const embeddings = data.map(item => ({
      id: item.id,
      caseId: item.Case_id,
      embedding: JSON.parse(item.Face_embedding),
      createdAt: item.created_at,
      metadata: item.metadata ? JSON.parse(item.metadata) : undefined
    }));

    console.log(`✅ Retrieved ${embeddings.length} face embeddings from Supabase`);
    return embeddings;
  }

  private async getAllFromMockService(): Promise<Array<{
    id: string;
    caseId: string;
    embedding: number[];
    createdAt: string;
    metadata?: any;
  }>> {
    console.log('🗄️ Retrieving from MockSupabaseService...');

    try {
      const result = await this.mockService.select('case_details', 'id, Case_id, Face_embedding, created_at, metadata', {
        order: [['created_at', 'desc']]
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Parse JSON embeddings back to arrays
      const embeddings = result.data.map((item: any) => ({
        id: item.id,
        caseId: item.Case_id,
        embedding: JSON.parse(item.Face_embedding),
        createdAt: item.created_at,
        metadata: item.metadata ? JSON.parse(item.metadata) : undefined
      }));

      console.log(`✅ Retrieved ${embeddings.length} face embeddings from MockSupabaseService`);
      return embeddings;
    } catch (error) {
      console.error('❌ Error retrieving from MockSupabaseService:', error);
      return [];
    }
  }

  private getAllFromLocalStorage(): Array<{
    id: string;
    caseId: string;
    embedding: number[];
    createdAt: string;
    metadata?: any;
  }> {
    console.log('📁 Retrieving from localStorage...');

    const records = JSON.parse(localStorage.getItem(this.getStorageKey('embeddings')) || '[]');

    const embeddings = records.map((record: any) => ({
      id: record.id,
      caseId: record.caseId,
      embedding: record.embedding,
      createdAt: record.createdAt,
      metadata: record.metadata
    }));

    console.log(`✅ Retrieved ${embeddings.length} face embeddings from localStorage`);
    return embeddings;
  }

  /**
   * Retrieve face embedding for a specific case
   */
  async getFaceEmbedding(caseId: string): Promise<{
    id: string;
    caseId: string;
    embedding: number[];
    createdAt: string;
    metadata?: any;
  } | null> {
    try {
      console.log('🔍 Retrieving face embedding for case:', caseId);

      const { data, error } = await this.supabase
        .from('case_details')
        .select('id, Case_id, Face_embedding, created_at, metadata')
        .eq('Case_id', caseId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          console.log('ℹ️ No face embedding found for case:', caseId);
          return null;
        }
        console.error('❌ Error retrieving face embedding:', error);
        throw error;
      }

      const result = {
        id: data.id,
        caseId: data.Case_id,
        embedding: JSON.parse(data.Face_embedding),
        createdAt: data.created_at,
        metadata: data.metadata ? JSON.parse(data.metadata) : undefined
      };

      console.log('✅ Face embedding retrieved successfully for case:', caseId);
      return result;
    } catch (error) {
      console.error('❌ Error retrieving face embedding:', error);
      throw error;
    }
  }

  /**
   * Update face embedding for a case
   */
  async updateFaceEmbedding(
    caseId: string,
    faceEmbedding: number[],
    metadata?: {
      confidence?: number;
      processingTime?: number;
      faceDetectionData?: any;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Updating face embedding for case:', caseId);

      const embeddingJson = JSON.stringify(faceEmbedding);

      const { error } = await this.supabase
        .from('case_details')
        .update({
          Face_embedding: embeddingJson,
          updated_at: new Date().toISOString(),
          ...(metadata && { metadata: JSON.stringify(metadata) })
        })
        .eq('Case_id', caseId);

      if (error) {
        console.error('❌ Error updating face embedding:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Face embedding updated successfully for case:', caseId);
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating face embedding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete face embedding for a case
   */
  async deleteFaceEmbedding(caseId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting face embedding for case:', caseId);

      const { error } = await this.supabase
        .from('case_details')
        .delete()
        .eq('Case_id', caseId);

      if (error) {
        console.error('❌ Error deleting face embedding:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Face embedding deleted successfully for case:', caseId);
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error deleting face embedding:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search for similar faces using cosine similarity
   */
  async findSimilarFaces(
    queryEmbedding: number[],
    threshold: number = 0.75
  ): Promise<Array<{
    caseId: string;
    similarity: number;
    id: string;
    createdAt: string;
    metadata?: any;
  }>> {
    try {
      console.log('🔍 Searching for similar faces...', { embeddingLength: queryEmbedding.length, threshold });

      // Get all stored embeddings
      const allEmbeddings = await this.getAllFaceEmbeddings();

      // Calculate cosine similarity for each embedding
      const similarities = allEmbeddings.map(stored => ({
        caseId: stored.caseId,
        id: stored.id,
        createdAt: stored.createdAt,
        metadata: stored.metadata,
        similarity: this.calculateCosineSimilarity(queryEmbedding, stored.embedding)
      }));

      // Filter by threshold and sort by similarity (highest first)
      const matches = similarities
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity);

      console.log(`✅ Found ${matches.length} similar faces above threshold ${threshold}`);
      return matches;
    } catch (error) {
      console.error('❌ Error searching for similar faces:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude1 = Math.sqrt(norm1);
    const magnitude2 = Math.sqrt(norm2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalEmbeddings: number;
    latestEmbedding: string | null;
    storageUsed: number;
  }> {
    try {
      console.log('📊 Getting storage statistics...');

      if (this.useLocalStorage || !this.supabase) {
        return this.getLocalStorageStats();
      }

      // Try MockSupabaseService first if enabled
      if (this.useMockService) {
        return await thisgetMockServiceStats();
      }

      try {
        return await this.getSupabaseStats();
      } catch (supabaseError) {
        console.warn('⚠️ Supabase stats failed, falling back to MockSupabaseService:', supabaseError);
        return await thisgetMockServiceStats();
      }
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      throw error;
    }
  }

  private async getMockServiceStats(): Promise<{
    totalEmbeddings: number;
    latestEmbedding: string | null;
    storageUsed: number;
  }> {
    console.log('🗄️ Getting MockSupabaseService statistics...');

    try {
      const countResult = await this.mockService.select('case_details', 'id', { count: true });

      if (countResult.error) {
        throw new Error(countResult.error);
      }

      const totalEmbeddings = countResult.count || 0;
      let latestEmbedding: string | null = null;

      if (totalEmbeddings > 0) {
        const latestResult = await this.mockService.select('case_details', 'created_at', {
          order: [['created_at', 'desc']],
          head: true
        });

        if (!latestResult.error && latestResult.data.length > 0) {
          latestEmbedding = latestResult.data[0].created_at;
        }
      }

      const stats = {
        totalEmbeddings,
        latestEmbedding,
        storageUsed: totalEmbeddings * 128 * 8 // Approximate storage (128 dims * 8 bytes)
      };

      console.log('✅ MockSupabaseService statistics:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting MockSupabaseService statistics:', error);
      return {
        totalEmbeddings: 0,
        latestEmbedding: null,
        storageUsed: 0
      };
    }
  }

  private async getSupabaseStats(): Promise<{
    totalEmbeddings: number;
    latestEmbedding: string | null;
    storageUsed: number;
  }> {
    console.log('🗄️ Getting Supabase statistics...');

    const { count, error } = await this.supabase!
      .from('case_details')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    const { data: latestRecord } = await this.supabase!
      .from('case_details')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const stats = {
      totalEmbeddings: count || 0,
      latestEmbedding: latestRecord?.created_at || null,
      storageUsed: count ? count * 128 * 8 : 0 // Approximate storage (128 dims * 8 bytes)
    };

    console.log('✅ Supabase statistics:', stats);
    return stats;
  }

  private getLocalStorageStats(): {
    totalEmbeddings: number;
    latestEmbedding: string | null;
    storageUsed: number;
  } {
    console.log('📁 Getting localStorage statistics...');

    const records = JSON.parse(localStorage.getItem(this.getStorageKey('embeddings')) || '[]');

    const stats = {
      totalEmbeddings: records.length,
      latestEmbedding: records.length > 0 ? records[records.length - 1].createdAt : null,
      storageUsed: records.length * 128 * 8 // Approximate storage
    };

    console.log('✅ LocalStorage statistics:', stats);
    return stats;
  }
}

// Singleton instance
export const databaseService = new DatabaseService();