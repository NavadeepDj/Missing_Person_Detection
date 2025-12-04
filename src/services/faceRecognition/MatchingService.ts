// Face matching service for comparing face embeddings
// Based on cosine similarity calculation from Python and Dart implementations

import { EmbeddingService } from './EmbeddingService';

export interface FaceMatch {
  personId: string;
  personName: string;
  similarity: number;
  confidence: number;
  photoUrl?: string;
  metadata?: {
    embeddingDistance: number;
    threshold: number;
  };
}

export interface MatchingResult {
  matches: FaceMatch[];
  processingTime: number;
  totalCandidates: number;
  threshold: number;
}

const BACKEND_URL = (typeof (globalThis as any) !== 'undefined' && (globalThis as any).ARC_FACE_BACKEND_URL) || 'http://localhost:8000';
const BACKEND_MODE = !!BACKEND_URL;

export class MatchingService {
  // Global default similarity threshold (70%)
  private static readonly DEFAULT_THRESHOLD = 0.70;

  static calculateSimilarityLocal(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Embeddings must have same dimension');
    let dot = 0;
    let n1 = 0;
    let n2 = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      n1 += a[i] * a[i];
      n2 += b[i] * b[i];
    }
    const denom = Math.sqrt(n1) * Math.sqrt(n2);
    if (denom === 0) return 0;
    return dot / denom;
  }

  // Find matches for a detected face embedding against a database of known faces
  static async findMatches(
    detectedEmbedding: number[],
    knownFaces: Array<{
      id: string;
      name: string;
      embedding: number[];
      photoUrl?: string;
    }>,
    threshold: number = this.DEFAULT_THRESHOLD
  ): Promise<MatchingResult> {
    const startTime = performance.now();

    try {
      if (!EmbeddingService.isValidEmbedding(detectedEmbedding)) {
        throw new Error('Invalid detected embedding');
      }

      const matches: FaceMatch[] = [];

      for (const knownFace of knownFaces) {
        if (!EmbeddingService.isValidEmbedding(knownFace.embedding)) {
          console.warn(`⚠️ Invalid embedding for person: ${knownFace.name}`);
          continue;
        }

        const similarity = this.calculateSimilarityLocal(detectedEmbedding, knownFace.embedding);
        const embeddingDistance = 1 - similarity;

        if (similarity >= threshold) {
          matches.push({
            personId: knownFace.id,
            personName: knownFace.name,
            similarity: similarity,
            confidence: this.calculateConfidence(similarity, threshold),
            photoUrl: knownFace.photoUrl,
            metadata: {
              embeddingDistance,
              threshold
            }
          });
        }
      }

      // Sort by similarity (highest first)
      matches.sort((a, b) => b.similarity - a.similarity);

      const processingTime = performance.now() - startTime;

      console.log(`🔍 Found ${matches.length} matches out of ${knownFaces.length} candidates in ${processingTime.toFixed(2)}ms`);

      return {
        matches,
        processingTime,
        totalCandidates: knownFaces.length,
        threshold
      };
    } catch (error) {
      console.error('❌ Error finding matches:', error);
      throw error;
    }
  }

  // Calculate confidence score based on similarity and threshold
  private static calculateConfidence(similarity: number, threshold: number): number {
    // Normalize confidence between 0 and 1
    // Similarity at threshold = 0.5 confidence, similarity = 1.0 = 1.0 confidence
    if (similarity <= threshold) return 0.0;

    const confidenceRange = 1.0 - threshold;
    const adjustedSimilarity = similarity - threshold;
    return Math.min(1.0, 0.5 + (adjustedSimilarity / confidenceRange) * 0.5);
  }

  // Verify if two faces match with detailed analysis
  static verifyMatch(
    embedding1: number[],
    embedding2: number[],
    threshold: number = this.DEFAULT_THRESHOLD
  ): {
    isMatch: boolean;
    similarity: number;
    confidence: number;
    recommendation: 'match' | 'possible_match' | 'no_match';
  } {
    const similarity = this.calculateSimilarityLocal(embedding1, embedding2);
    const confidence = this.calculateConfidence(similarity, threshold);

    let recommendation: 'match' | 'possible_match' | 'no_match';
    if (similarity >= 0.9) {
      recommendation = 'match';
    } else if (similarity >= threshold) {
      recommendation = 'possible_match';
    } else {
      recommendation = 'no_match';
    }

    return {
      isMatch: similarity >= threshold,
      similarity,
      confidence,
      recommendation
    };
  }

  // Batch process multiple embeddings
  static async batchFindMatches(
    detectedEmbeddings: number[][],
    knownFaces: Array<{
      id: string;
      name: string;
      embedding: number[];
      photoUrl?: string;
    }>,
    threshold: number = this.DEFAULT_THRESHOLD
  ): Promise<MatchingResult[]> {
    const results: MatchingResult[] = [];

    for (const embedding of detectedEmbeddings) {
      try {
        const result = await this.findMatches(embedding, knownFaces, threshold);
        results.push(result);
      } catch (error) {
        console.error('❌ Error in batch matching:', error);
        // Add empty result for failed processing
        results.push({
          matches: [],
          processingTime: 0,
          totalCandidates: knownFaces.length,
          threshold
        });
      }
    }

    return results;
  }

  // Get statistics about matching performance
  static getMatchingStatistics(results: MatchingResult[]): {
    totalProcessed: number;
    totalMatches: number;
    averageProcessingTime: number;
    matchRate: number;
    averageSimilarity: number;
  } {
    const totalProcessed = results.length;
    const totalMatches = results.reduce((sum, result) => sum + result.matches.length, 0);
    const totalProcessingTime = results.reduce((sum, result) => sum + result.processingTime, 0);
    const allSimilarities = results.flatMap(result => result.matches.map(match => match.similarity));
    const averageSimilarity = allSimilarities.length > 0
      ? allSimilarities.reduce((sum, sim) => sum + sim, 0) / allSimilarities.length
      : 0;

    return {
      totalProcessed,
      totalMatches,
      averageProcessingTime: totalProcessingTime / totalProcessed,
      matchRate: totalMatches / totalProcessed,
      averageSimilarity
    };
  }

  // Optional: use backend Python service to calculate similarity
  // Kept for future integration; frontend logic uses calculateSimilarityLocal.
  static async calculateSimilarityWithBackend(a: number[], b: number[]): Promise<number> {
    // If backend is configured, call /match endpoint
    try {
      if (BACKEND_MODE) {
        const resp = await fetch(`${BACKEND_URL}/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embedding1: a, embedding2: b })
        });
        if (!resp.ok) {
          console.warn('Backend match failed, falling back to local similarity');
          return this.calculateSimilarityLocal(a, b);
        }
        const json = await resp.json();
        return Number(json.similarity);
      }

      return this.calculateSimilarityLocal(a, b);
    } catch (error) {
      console.error('❌ Error calculating similarity with backend, falling back to local:', error);
      return this.calculateSimilarityLocal(a, b);
    }
  }
}