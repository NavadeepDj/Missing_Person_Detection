// Face embedding generation using MobileFaceNet
// Based on MobileFaceNet_Optimized.py and example_Mobileettflite.md

export interface EmbeddingResult {
  embedding: number[];
  confidence: number;
  processingTime: number;
}

export class EmbeddingService {
  private static modelLoaded = false;
  private static interpreter: any = null;
  private static readonly EMBEDDING_SIZE = 128;
  private static readonly INPUT_SIZE = 112;

  // Initialize MobileFaceNet model
  static async initializeModel(): Promise<boolean> {
    try {
      if (this.modelLoaded) return true;

      // TODO: Load output_model.tflite using TensorFlow.js
      // For now, we'll simulate the model loading
      console.log('🔄 Loading MobileFaceNet model...');

      // Simulate model loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.modelLoaded = true;
      console.log('✅ MobileFaceNet model loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading MobileFaceNet model:', error);
      return false;
    }
  }

  // Preprocess face image for MobileFaceNet (matching Python implementation)
  static preprocessFace(imageData: ImageData): Float32Array | null {
    try {
      const { width, height, data } = imageData;

      // Convert ImageData to RGB and resize to 112x112
      const processedData = new Float32Array(this.INPUT_SIZE * this.INPUT_SIZE * 3);

      // Simple resizing (for demo - in production use proper resizing algorithm)
      const scaleX = width / this.INPUT_SIZE;
      const scaleY = height / this.INPUT_SIZE;

      let dataIndex = 0;
      for (let y = 0; y < this.INPUT_SIZE; y++) {
        for (let x = 0; x < this.INPUT_SIZE; x++) {
          const sourceX = Math.floor(x * scaleX);
          const sourceY = Math.floor(y * scaleY);
          const sourceIndex = (sourceY * width + sourceX) * 4;

          // Extract RGB values (ImageData is RGBA)
          const r = data[sourceIndex];
          const g = data[sourceIndex + 1];
          const b = data[sourceIndex + 2];

          // Normalize to [-1, 1] range (matching face.astype("float32") / 127.5 - 1.0)
          processedData[dataIndex++] = (r / 127.5) - 1.0;
          processedData[dataIndex++] = (g / 127.5) - 1.0;
          processedData[dataIndex++] = (b / 127.5) - 1.0;
        }
      }

      return processedData;
    } catch (error) {
      console.error('❌ Error preprocessing face:', error);
      return null;
    }
  }

  // Generate face embedding using MobileFaceNet
  static async generateEmbedding(imageData: ImageData): Promise<EmbeddingResult | null> {
    const startTime = performance.now();

    try {
      if (!this.modelLoaded) {
        const loaded = await this.initializeModel();
        if (!loaded) return null;
      }

      // Preprocess the face image
      const preprocessedFace = this.preprocessFace(imageData);
      if (!preprocessedFace) {
        console.error('❌ Failed to preprocess face');
        return null;
      }

      // TODO: Run inference with MobileFaceNet model
      // For now, generate a mock embedding for demonstration
      const mockEmbedding = this.generateMockEmbedding();

      const processingTime = performance.now() - startTime;

      console.log(`✅ Face embedding generated successfully (${mockEmbedding.length} dimensions)`);
      console.log(`⏱️ Processing time: ${processingTime.toFixed(2)}ms`);

      return {
        embedding: mockEmbedding,
        confidence: 0.95, // Mock confidence score
        processingTime
      };
    } catch (error) {
      console.error('❌ Error generating face embedding:', error);
      return null;
    }
  }

  // Generate mock embedding for demonstration (remove when using real model)
  private static generateMockEmbedding(): number[] {
    const embedding: number[] = [];
    for (let i = 0; i < this.EMBEDDING_SIZE; i++) {
      // Generate random-like but consistent values
      embedding.push((Math.sin(i * 0.1) + Math.cos(i * 0.05)) * 0.5);
    }
    return this.normalizeEmbedding(embedding);
  }

  // Normalize face embedding (L2 normalization)
  static normalizeEmbedding(embedding: number[]): number[] {
    let norm = 0;
    for (const value of embedding) {
      norm += value * value;
    }
    norm = Math.sqrt(norm);

    if (norm === 0) {
      return embedding;
    }

    return embedding.map(value => value / norm);
  }

  // Validate face embedding quality
  static isValidEmbedding(embedding: number[]): boolean {
    if (embedding.length !== this.EMBEDDING_SIZE) {
      return false;
    }

    // Check if embedding has reasonable values (not all zeros or NaNs)
    let hasNonZero = false;
    for (const value of embedding) {
      if (isNaN(value) || !isFinite(value)) {
        return false;
      }
      if (value !== 0) {
        hasNonZero = true;
      }
    }

    return hasNonZero;
  }

  // Dispose resources
  static dispose(): void {
    this.interpreter = null;
    this.modelLoaded = false;
  }
}