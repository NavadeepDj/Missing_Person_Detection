// Face embedding generation using ArcFace (ONNX, 512-D embedding)
// Model: arcface.onnx served from /models/arcface.onnx

import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime to use CDN for WASM files
// This avoids MIME type issues with Vite dev server
if (typeof window !== 'undefined') {
  try {
    // Use CDN for WASM files to avoid Vite MIME type issues
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
    console.log('📡 ONNX Runtime configured to use CDN for WASM files');
  } catch (e) {
    console.warn('⚠️ Could not configure WASM CDN path:', e);
  }
}

export interface EmbeddingResult {
  embedding: number[];
  confidence: number;
  processingTime: number;
}

export class EmbeddingService {
  private static modelLoaded = false;
  private static session: ort.InferenceSession | null = null;
  private static readonly EMBEDDING_SIZE = 512;
  private static readonly INPUT_SIZE = 112;

  // Initialize ArcFace ONNX model
  static async initializeModel(): Promise<boolean> {
    try {
      if (this.modelLoaded && this.session) {
        console.log('✅ ArcFace model already loaded');
        return true;
      }

      console.log('🔄 Loading ArcFace ONNX model from /models/arcface.onnx...');

      // First, verify the model file exists
      try {
        const response = await fetch('/models/arcface.onnx', { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Model file not found: ${response.status} ${response.statusText}`);
        }
        console.log('✅ Model file exists and is accessible');
      } catch (fetchError) {
        console.error('❌ Cannot access model file:', fetchError);
        console.error('❌ Check if arcface.onnx exists in public/models/ directory');
        throw new Error('Model file not accessible');
      }

      // Load the ArcFace ONNX model using onnxruntime-web
      console.log('📦 Creating ONNX inference session...');
      
      // Try backends in order: WASM (with CDN), then CPU, then WebGL
      // WASM with CDN is most reliable for browser environments
      const backends: Array<'wasm' | 'cpu' | 'webgl'> = ['wasm', 'cpu', 'webgl'];
      let lastError: Error | null = null;
      
      for (const backend of backends) {
        try {
          console.log(`🔄 Trying ${backend} backend...`);
          
          const options: ort.InferenceSession.SessionOptions = {
            executionProviders: [backend],
          };
          
          // WASM backend should already be configured with CDN at module level
          // But ensure it's set here too as a fallback
          if (backend === 'wasm') {
            try {
              const wasmPaths = ort.env.wasm.wasmPaths;
              if (!wasmPaths || (typeof wasmPaths === 'string' && wasmPaths.includes('node_modules'))) {
                ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
                console.log('📡 WASM files will be loaded from CDN');
              }
            } catch (e) {
              console.warn('⚠️ Could not configure WASM CDN path:', e);
            }
          }
          
          this.session = await ort.InferenceSession.create('/models/arcface.onnx', options);
          console.log(`✅ Successfully loaded with ${backend} backend`);
          break;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ ${backend} backend failed:`, errorMsg);
          
          // If WASM fails due to CDN issues, try to use local path as fallback
          if (backend === 'wasm' && errorMsg.includes('WASM')) {
            try {
              console.log('🔄 Trying WASM with local path fallback...');
              ort.env.wasm.wasmPaths = '/node_modules/onnxruntime-web/dist/';
              this.session = await ort.InferenceSession.create('/models/arcface.onnx', options);
              console.log(`✅ Successfully loaded with ${backend} backend (local path)`);
              break;
            } catch (fallbackError) {
              console.warn('⚠️ WASM local path also failed:', fallbackError);
            }
          }
          
          lastError = error instanceof Error ? error : new Error(String(error));
          this.session = null;
          continue;
        }
      }
      
      if (!this.session) {
        console.error('❌ All ONNX Runtime backends failed');
        console.error('💡 Troubleshooting:');
        console.error('   1. Check browser console for network errors');
        console.error('   2. Verify CDN is accessible');
        console.error('   3. Try refreshing the page');
        throw lastError || new Error('All backends failed - check console for details');
      }

      this.modelLoaded = true;
      console.log('✅ ArcFace ONNX model loaded successfully!');
      console.log('🧠 Model inputs:', this.session.inputNames);
      console.log('🧠 Model outputs:', this.session.outputNames);
      
      // Log input metadata if available
      if (this.session.inputNames.length > 0) {
        const inputMetadata = this.session.inputNames.map((name, idx) => {
          try {
            // Try to get input metadata
            return { name, index: idx };
          } catch {
            return { name, index: idx };
          }
        });
        console.log('🧠 Input metadata:', inputMetadata);
      }
      return true;
    } catch (error) {
      console.error('❌ Error loading ArcFace model:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      console.error('🔄 Model will fall back to MOCK embeddings (same for all images!)');
      console.error('🔧 To fix:');
      console.error('   1. Ensure arcface.onnx is in public/models/ directory');
      console.error('   2. Check browser console for CORS or network errors');
      console.error('   3. Verify the file path is correct');
      
      // Set modelLoaded to true to allow fallback operation
      this.modelLoaded = true;
      this.session = null; // Explicitly set to null
      return true; // Return true to allow fallback to mock embeddings
    }
  }

  // Preprocess face image for ArcFace
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

          // Normalize to ArcFace input: (img - 127.5) / 128.0
          processedData[dataIndex++] = (r - 127.5) / 128.0;
          processedData[dataIndex++] = (g - 127.5) / 128.0;
          processedData[dataIndex++] = (b - 127.5) / 128.0;
        }
      }

      return processedData;
    } catch (error) {
      console.error('❌ Error preprocessing face:', error);
      return null;
    }
  }

  // Generate face embedding using ArcFace
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

      // Calculate a hash of the preprocessed image to verify it's different for different inputs
      const imageHash = this.calculateImageHash(preprocessedFace);
      console.log('🖼️ Preprocessed image hash (first 20 values):', preprocessedFace.slice(0, 20).map(v => v.toFixed(3)).join(', '));
      console.log('🔐 Image fingerprint:', imageHash);

      let embedding: number[];
      let usedRealModel = false;

      // Try to use real model if available, otherwise fall back to mock
      if (this.session) {
        console.log('🧠 Running inference with ArcFace ONNX model...');
        console.log('📊 Session status:', {
          hasSession: !!this.session,
          inputNames: this.session.inputNames,
          outputNames: this.session.outputNames
        });

        try {
          // ArcFace expects input shape (1, 112, 112, 3) in NHWC format
          const inputTensor = new ort.Tensor('float32', preprocessedFace, [1, this.INPUT_SIZE, this.INPUT_SIZE, 3]);

          console.log('📥 Input tensor created:', {
            type: inputTensor.type,
            dims: inputTensor.dims,
            size: inputTensor.data.length,
            first10Values: Array.from(inputTensor.data as Float32Array).slice(0, 10).map(v => v.toFixed(4))
          });

          const feeds: Record<string, ort.Tensor> = {};
          const inputName = this.session.inputNames[0];
          feeds[inputName] = inputTensor;

          console.log('🚀 Running ONNX inference...');
          const results = await this.session.run(feeds);

          const outputName = this.session.outputNames[0];
          const outputTensor = results[outputName];

          embedding = Array.from(outputTensor.data as Float32Array);

          console.log('📤 Output tensor received:', {
            dims: outputTensor.dims,
            size: embedding.length,
            first10Values: embedding.slice(0, 10).map(v => v.toFixed(6)),
            min: Math.min(...embedding).toFixed(6),
            max: Math.max(...embedding).toFixed(6),
            sum: embedding.reduce((a, b) => a + b, 0).toFixed(6)
          });

          // Normalize the embedding
          embedding = this.normalizeEmbedding(embedding);

          usedRealModel = true;
          console.log('✅ Real ArcFace ONNX inference completed successfully');
          console.log('✅ Embedding from REAL MODEL (not mock)');
        } catch (inferenceError) {
          console.error('❌ ArcFace ONNX inference failed:', inferenceError);
          console.error('❌ Error details:', {
            name: inferenceError instanceof Error ? inferenceError.name : 'Unknown',
            message: inferenceError instanceof Error ? inferenceError.message : String(inferenceError),
            stack: inferenceError instanceof Error ? inferenceError.stack : undefined
          });
          console.warn('⚠️ FALLING BACK TO MOCK EMBEDDING - THIS WILL GIVE SAME RESULT FOR ALL IMAGES!');
          embedding = this.generateMockEmbedding(imageHash); // Pass hash to make it vary slightly
        }
      } else {
        console.warn('⚠️ NO ONNX SESSION AVAILABLE - Using mock embedding');
        console.warn('⚠️ MOCK EMBEDDING WILL BE THE SAME FOR ALL IMAGES!');
        console.warn('⚠️ Check if /models/arcface.onnx exists and is accessible');
        embedding = this.generateMockEmbedding(imageHash);
      }

      const processingTime = performance.now() - startTime;

      // Calculate embedding hash to verify it's different for different images
      const embeddingHash = embedding.slice(0, 10).map(v => v.toFixed(4)).join(',');
      
      console.log(`✅ Face embedding generated successfully (${embedding.length} dimensions)`);
      console.log(`⏱️ Processing time: ${processingTime.toFixed(2)}ms`);
      console.log(`🔐 Embedding hash (first 10 values): ${embeddingHash}`);
      console.log(`🎯 Model used: ${usedRealModel ? '✅ REAL ArcFace ONNX Model' : '❌ MOCK (FALLBACK)'}`);
      
      if (!usedRealModel) {
        console.error('❌❌❌ WARNING: Using MOCK embedding! All images will produce similar results!');
        console.error('❌ Check:');
        console.error('   1. Is /models/arcface.onnx accessible?');
        console.error('   2. Check browser console for model loading errors');
        console.error('   3. Verify the model file exists in public/models/');
      }

      return {
        embedding,
        confidence: usedRealModel ? 0.95 : 0.5, // Lower confidence for mock
        processingTime
      };
    } catch (error) {
      console.error('❌ Error generating face embedding:', error);
      return null;
    }
  }

  // Calculate a simple hash from image data to verify different images
  private static calculateImageHash(imageData: Float32Array): string {
    let hash = 0;
    // Use first 100 values and sum for quick hash
    for (let i = 0; i < Math.min(100, imageData.length); i++) {
      hash += Math.abs(imageData[i]) * 1000;
    }
    return hash.toString(36).substring(0, 8);
  }

  // Generate mock embedding for demonstration (remove when using real model)
  // Now accepts imageHash to make it vary slightly per image (but still not real!)
  private static generateMockEmbedding(imageHash?: string): number[] {
    const embedding: number[] = [];
    const hashSeed = imageHash ? parseInt(imageHash, 36) % 1000 : 0;
    
    console.warn('⚠️ GENERATING MOCK EMBEDDING - This is NOT from ArcFace model!');
    console.warn('⚠️ All images will produce similar embeddings. Check if model loaded correctly.');
    
    for (let i = 0; i < this.EMBEDDING_SIZE; i++) {
      // Generate values that vary slightly based on hash, but still deterministic
      const base = (Math.sin(i * 0.1) + Math.cos(i * 0.05)) * 0.5;
      const variation = Math.sin(hashSeed + i * 0.01) * 0.1;
      embedding.push(base + variation);
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
    this.session = null;
    this.modelLoaded = false;
    console.log('🗑️ ArcFace session disposed');
  }
}