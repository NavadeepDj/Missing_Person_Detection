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

export class MatchingService {
  private static readonly DEFAULT_THRESHOLD = 0.75;

  // Calculate cosine similarity between two face embeddings
  // Matches Python: 1 - cosine(embedding1, embedding2)
  // Matches Dart: calculateSimilarity method
  static calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0.0;
    let norm1 = 0.0;
    let norm2 = 0.0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0.0 || norm2 === 0.0) {
      return 0.0;
    }

    // Cosine similarity: (A·B) / (||A|| × ||B||)
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
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

        const similarity = this.calculateSimilarity(detectedEmbedding, knownFace.embedding);
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
    const similarity = this.calculateSimilarity(embedding1, embedding2);
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
}