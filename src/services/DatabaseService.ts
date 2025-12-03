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

    const name = metadata && (metadata as any).name ? String((metadata as any).name) : null;
    const age = metadata && typeof (metadata as any).age === 'number' ? (metadata as any).age : null;
    const status = metadata && (metadata as any).status ? String((metadata as any).status) : null;
    const dateReported = metadata && (metadata as any).dateReported ? String((metadata as any).dateReported) : null;
    const lastLocation = metadata && (metadata as any).location ? String((metadata as any).location) : null;

    const { data, error } = await this.supabase!
      .from('case_details')
      .insert([
        {
          Case_id: caseId,
          Face_embedding: embeddingJson,
          created_at: new Date().toISOString(),
          ...(name && { Name: name }),
          ...(age !== null && { Age: age }),
          ...(status && { Status: status }),
          ...(dateReported && { Date_reported: dateReported }),
          ...(lastLocation && { Last_location: lastLocation }),
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
      .select('id, Case_id, Face_embedding, created_at, metadata, Name, Age, Status, Date_reported, Last_location')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Parse JSON embeddings back to arrays
    const embeddings = data.map(item => {
      const baseMetadata = item.metadata ? JSON.parse(item.metadata) : {};

      const mergedMetadata = {
        ...baseMetadata,
        ...(item.Name && { name: item.Name }),
        ...(typeof item.Age === 'number' && { age: item.Age }),
        ...(item.Status && { status: item.Status }),
        ...(item.Date_reported && { dateReported: item.Date_reported }),
        ...(item.Last_location && { location: item.Last_location })
      };

      return {
        id: item.id,
        caseId: item.Case_id,
        embedding: JSON.parse(item.Face_embedding),
        createdAt: item.created_at,
        metadata: mergedMetadata
      };
    });

    console.log(`✅ Retrieved ${embeddings.length} face embeddings from Supabase`);
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

      const name = metadata && (metadata as any).name ? String((metadata as any).name) : null;
      const age = metadata && typeof (metadata as any).age === 'number' ? (metadata as any).age : null;
      const status = metadata && (metadata as any).status ? String((metadata as any).status) : null;
      const dateReported = metadata && (metadata as any).dateReported ? String((metadata as any).dateReported) : null;
      const lastLocation = metadata && (metadata as any).location ? String((metadata as any).location) : null;

      const updatePayload: Record<string, any> = {
        Face_embedding: embeddingJson,
        updated_at: new Date().toISOString(),
        ...(metadata && { metadata: JSON.stringify(metadata) })
      };

      if (name !== null) updatePayload.Name = name;
      if (age !== null) updatePayload.Age = age;
      if (status !== null) updatePayload.Status = status;
      if (dateReported !== null) updatePayload.Date_reported = dateReported;
      if (lastLocation !== null) updatePayload.Last_location = lastLocation;

      const { error } = await this.supabase
        .from('case_details')
        .update(updatePayload)
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
      return await this.getSupabaseStats();
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      throw error;
    }
  }



  private async getSupabaseStats(): Promise<{
    totalEmbeddings: number;
    latestEmbedding: string | null;
    storageUsed: number;
  }> {
    console.log('🗄️ Getting Supabase statistics...');

    const { count, error } = await this.supabase
      .from('case_details')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    const { data: latestRecord } = await this.supabase
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


  /**
   * Create a public alert when a citizen upload matches a missing person
   */
  async createAlert(params: {
    caseId: string;
    similarity: number;
    sourceRole: 'citizen' | 'system';
    latitude?: number;
    longitude?: number;
    photoUrl?: string;
  }): Promise<{ id: string; success: boolean; error?: string }> {
    const { caseId, similarity, sourceRole, latitude, longitude, photoUrl } = params;

    try {
      const metadata: any = {
        similarity,
        sourceRole,
      };

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        metadata.latitude = latitude;
        metadata.longitude = longitude;
      }

      const { data, error } = await this.supabase
        .from('alerts')
        .insert([
          {
            case_id: caseId,
            similarity,
            source_role: sourceRole,
            photo_url: photoUrl || null,
            location:
              typeof latitude === 'number' && typeof longitude === 'number'
                ? `${latitude},${longitude}`
                : null,
            metadata,
          },
        ])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return { id: data.id, success: true };
    } catch (error) {
      console.error('❌ Error creating alert:', error);
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get latest alerts for admin dashboard
   */
  async getRecentAlerts(limit: number = 20): Promise<
    Array<{
      id: string;
      caseId: string;
      similarity: number;
      sourceRole: string;
      createdAt: string;
      location?: string | null;
      photoUrl?: string | null;
      metadata?: any;
    }>
  > {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('id, case_id, similarity, source_role, created_at, location, photo_url, metadata')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (
        data?.map((item) => ({
          id: item.id,
          caseId: item.case_id,
          similarity: item.similarity,
          sourceRole: item.source_role,
          createdAt: item.created_at,
          location: item.location,
          photoUrl: item.photo_url,
          metadata: item.metadata,
        })) || []
      );
    } catch (error) {
      console.error('❌ Error loading alerts:', error);
      throw error;
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();