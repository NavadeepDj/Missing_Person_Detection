import { FaceDetectionService } from './faceRecognition/FaceDetectionService';
import { EmbeddingService } from './faceRecognition/EmbeddingService';
import { databaseService } from './DatabaseService';

export interface ProcessedImageResult {
  success: boolean;
  embedding?: number[];
  confidence?: number;
  processingTime?: number;
  error?: string;
  faceDetected?: boolean;
}

export interface FaceStorageResult {
  success: boolean;
  caseId: string;
  embeddingId?: string;
  confidence?: number;
  processingTime?: number;
  databaseStorageTime?: number;
  error?: string;
}

export interface SimilarFaceResult {
  caseId: string;
  similarity: number;
  confidence: number;
  id: string;
  createdAt: string;
  metadata?: any;
}

export interface MatchResult {
  matches: SimilarFaceResult[];
  processingTime: number;
  totalCandidates: number;
  threshold: number;
}

export class FaceProcessingService {
  private static isInitialized = false;

  /**
   * Initialize all face recognition services
   */
  static async initializeServices(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('✅ Face processing services already initialized');
        return true;
      }

      console.log('🔄 Initializing face processing services...');

      // Initialize face detection
      const detectionInitialized = await FaceDetectionService.initializeModel();
      if (!detectionInitialized) {
        throw new Error('Failed to initialize face detection service');
      }

      // Initialize embedding service
      const embeddingInitialized = await EmbeddingService.initializeModel();
      if (!embeddingInitialized) {
        throw new Error('Failed to initialize embedding service');
      }

      this.isInitialized = true;
      console.log('✅ All face processing services initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing face processing services:', error);
      return false;
    }
  }

  /**
   * Process an image to generate face embedding
   */
  static async processImage(imageUrl: string): Promise<ProcessedImageResult> {
    const startTime = performance.now();

    try {
      console.log('🔍 Processing image for face detection and embedding...');

      // Ensure services are initialized
      if (!this.isInitialized) {
        const initialized = await this.initializeServices();
        if (!initialized) {
          throw new Error('Failed to initialize face processing services');
        }
      }

      // Load image and get ImageData
      const image = await this.loadImage(imageUrl);
      const imageData = this.getImageData(image);

      console.log('📷 Image loaded, detecting faces...');

      // Detect faces
      const detectionResult = await FaceDetectionService.detectFaces(imageData);

      if (!detectionResult || detectionResult.faces.length === 0) {
        console.log('ℹ️ No faces detected in the image');
        return {
          success: false,
          faceDetected: false,
          error: 'No faces detected in the image'
        };
      }

      console.log(`✅ Detected ${detectionResult.faces.length} face(s), generating embeddings...`);

      // Use the first detected face
      const face = detectionResult.faces[0];

      // Generate embedding
      const embeddingResult = await EmbeddingService.generateEmbedding(face.imageData);

      if (!embeddingResult) {
        throw new Error('Failed to generate face embedding');
      }

      const processingTime = performance.now() - startTime;

      console.log('🎯 Face embedding generated successfully', {
        confidence: embeddingResult.confidence,
        processingTime: processingTime.toFixed(2)
      });

      return {
        success: true,
        embedding: embeddingResult.embedding,
        confidence: embeddingResult.confidence,
        processingTime: embeddingResult.processingTime,
        faceDetected: true
      };
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('❌ Error processing image:', error);
      return {
        success: false,
        faceDetected: false,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Store face embedding in database for a case
   */
  static async storeFaceEmbedding(
    caseId: string,
    embedding: number[],
    confidence: number,
    processingTime: number,
    extraMetadata?: {
      name?: string;
      age?: number;
      status?: string;
      dateReported?: string;
      location?: string;
    }
  ): Promise<FaceStorageResult> {
    const startTime = performance.now();

    try {
      console.log('💾 Storing face embedding for case:', caseId);

      const metadata = {
        ...(extraMetadata || {}),
        confidence,
        processingTime,
        storedAt: new Date().toISOString()
      };

      const result = await databaseService.storeFaceEmbedding(caseId, embedding, metadata);
      const databaseStorageTime = performance.now() - startTime;

      if (result.success) {
        console.log('✅ Face embedding stored successfully', {
          caseId,
          embeddingId: result.id,
          confidence,
          databaseStorageTime: databaseStorageTime.toFixed(2)
        });

        return {
          success: true,
          caseId,
          embeddingId: result.id,
          confidence,
          processingTime,
          databaseStorageTime
        };
      } else {
        throw new Error(result.error || 'Failed to store embedding in database');
      }
    } catch (error) {
      const databaseStorageTime = performance.now() - startTime;
      console.error('❌ Error storing face embedding:', error);
      return {
        success: false,
        caseId,
        databaseStorageTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process image and store embedding in database (complete pipeline)
   */
  static async processAndStoreFaceEmbedding(
    imageUrl: string,
    caseId: string,
    extraMetadata?: {
      name?: string;
      age?: number;
      status?: string;
      dateReported?: string;
      location?: string;
    }
  ): Promise<FaceStorageResult> {
    try {
      console.log('🔄 Starting complete face processing pipeline for case:', caseId);

      // Step 1: Process image to generate embedding
      const processResult = await this.processImage(imageUrl);

      if (!processResult.success || !processResult.embedding) {
        return {
          success: false,
          caseId,
          error: processResult.error || 'Failed to generate face embedding'
        };
      }

      // Step 2: Store embedding in database
      const storageResult = await this.storeFaceEmbedding(
        caseId,
        processResult.embedding,
        processResult.confidence || 0.0,
        processResult.processingTime || 0.0,
        extraMetadata
      );

      console.log('🎉 Complete face processing pipeline finished successfully', {
        caseId,
        embeddingLength: processResult.embedding.length,
        confidence: processResult.confidence,
        processingTime: processResult.processingTime,
        databaseStorageTime: storageResult.databaseStorageTime
      });

      return storageResult;
    } catch (error) {
      console.error('❌ Error in complete face processing pipeline:', error);
      return {
        success: false,
        caseId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find similar faces in database
   */
  static async findSimilarFaces(
    queryEmbedding: number[],
    threshold: number = 0.75
  ): Promise<MatchResult> {
    try {
      console.log('🔍 Searching for similar faces in database...');

      // Get all stored embeddings and calculate similarities
      const matches = await databaseService.findSimilarFaces(queryEmbedding, threshold);

      const result: MatchResult = {
        matches: matches.map(match => ({
          caseId: match.caseId,
          similarity: match.similarity,
          confidence: this.calculateConfidence(match.similarity, threshold),
          id: match.id,
          createdAt: match.createdAt,
          metadata: match.metadata
        })),
        processingTime: 0, // Database service doesn't track processing time yet
        totalCandidates: matches.length,
        threshold
      };

      console.log(`✅ Found ${result.matches.length} similar faces`, {
        threshold,
        topMatch: result.matches[0]?.caseId || 'None',
        topSimilarity: result.matches[0]?.similarity || 0
      });

      return result;
    } catch (error) {
      console.error('❌ Error finding similar faces:', error);
      throw error;
    }
  }

  /**
   * Get all stored face embeddings
   */
  static async getAllStoredEmbeddings(): Promise<Array<{
    id: string;
    caseId: string;
    embedding: number[];
    createdAt: string;
    metadata?: any;
  }>> {
    try {
      console.log('📋 Retrieving all stored face embeddings...');
      return await databaseService.getAllFaceEmbeddings();
    } catch (error) {
      console.error('❌ Error retrieving stored embeddings:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStatistics(): Promise<{
    totalEmbeddings: number;
    latestEmbedding: string | null;
    storageUsed: number;
  }> {
    try {
      console.log('📊 Getting database statistics...');
      return await databaseService.getDatabaseStats();
    } catch (error) {
      console.error('❌ Error getting database statistics:', error);
      throw error;
    }
  }

  /**
   * Helper method to load image from URL
   */
  private static async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));

      img.src = url;
    });
  }

  /**
   * Helper method to get ImageData from HTMLImageElement
   */
  private static getImageData(img: HTMLImageElement): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Calculate confidence score based on similarity and threshold
   */
  private static calculateConfidence(similarity: number, threshold: number): number {
    if (similarity <= threshold) return 0.0;

    const confidenceRange = 1.0 - threshold;
    const adjustedSimilarity = similarity - threshold;
    return Math.min(1.0, 0.5 + (adjustedSimilarity / confidenceRange) * 0.5);
  }

  /**
   * Dispose all services
   */
  static dispose(): void {
    console.log('🧹 Disposing face processing services...');
    FaceDetectionService.dispose();
    EmbeddingService.dispose();
    this.isInitialized = false;
  }
}