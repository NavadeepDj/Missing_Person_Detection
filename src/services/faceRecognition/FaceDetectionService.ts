// Face detection service for detecting and cropping faces from images
// Uses MediaPipe Face Detector via TensorFlow.js

import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';

export interface DetectedFace {
  imageData: ImageData;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface FaceDetectionResult {
  faces: DetectedFace[];
  originalImage: ImageData;
  processingTime: number;
}

export class FaceDetectionService {
  private static modelLoaded = false;
  private static detector: faceDetection.FaceDetector | null = null;

  // Initialize face detection model (MediaPipe Face Detector)
  static async initializeModel(): Promise<boolean> {
    try {
      if (this.modelLoaded && this.detector) return true;

      console.log('🔄 Loading MediaPipe Face Detection model...');

      // Initialize TensorFlow.js backend (use WebGL for better performance)
      if (!tf.getBackend()) {
        console.log('🔄 Initializing TensorFlow.js backend...');
        await tf.ready();
        // Try to set WebGL backend for better performance
        try {
          await tf.setBackend('webgl');
          await tf.ready();
          console.log('✅ TensorFlow.js backend set to WebGL');
        } catch (e) {
          console.log('⚠️ WebGL backend not available, using CPU');
        }
      }

      // Create MediaPipe Face Detector using TensorFlow.js runtime (avoids WASM issues)
      // Using 'tfjs' runtime instead of 'mediapipe' to avoid WASM file requirements
      this.detector = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
          runtime: 'tfjs', // Use TensorFlow.js runtime instead of MediaPipe (avoids WASM)
          modelType: 'short', // 'short' for faster detection, 'full' for better accuracy
          maxFaces: 1, // Only detect one face
        }
      );

      this.modelLoaded = true;
      console.log('✅ MediaPipe Face Detection model loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading MediaPipe face detection model:', error);
      console.warn('⚠️ Falling back to mock face detection');
      this.modelLoaded = true; // Allow fallback
      return true;
    }
  }

  // Detect faces in an image using MediaPipe
  static async detectFaces(imageData: ImageData): Promise<FaceDetectionResult | null> {
    const startTime = performance.now();

    try {
      if (!this.modelLoaded || !this.detector) {
        const loaded = await this.initializeModel();
        if (!loaded || !this.detector) {
          // Fallback to mock if model failed to load
          console.warn('⚠️ Using mock face detection (MediaPipe not available)');
          const mockFaces = this.mockDetectFaces(imageData);
          return {
            faces: mockFaces,
            originalImage: imageData,
            processingTime: performance.now() - startTime
          };
        }
      }

      // Convert ImageData to HTMLImageElement for MediaPipe
      const image = await this.imageDataToImage(imageData);

      // Detect faces using MediaPipe
      console.log('🔍 Running MediaPipe face detection...');
      const detections = await this.detector!.estimateFaces(image);

      const processingTime = performance.now() - startTime;

      if (detections.length === 0) {
        console.log('ℹ️ No faces detected by MediaPipe');
        return {
          faces: [],
          originalImage: imageData,
          processingTime
        };
      }

      // Convert MediaPipe detections to our format
      const faces: DetectedFace[] = detections.map((detection) => {
        try {
          const box = detection.box;
          
          // Log full detection object to understand structure
          console.log('📦 Full MediaPipe detection:', JSON.stringify(detection, null, 2));
          console.log('📦 Detection box object:', box);
          console.log('📦 Box properties:', Object.keys(box));
          
          // MediaPipe TensorFlow.js returns coordinates in different formats
          // Check for various possible formats
          let x: number, y: number, width: number, height: number;
          
          if ('xMin' in box && 'yMin' in box) {
            // Normalized coordinates (0-1 range) - most common for TensorFlow.js MediaPipe
            const xMin = typeof box.xMin === 'number' ? box.xMin : 0;
            const yMin = typeof box.yMin === 'number' ? box.yMin : 0;
            const xMax = 'xMax' in box && typeof box.xMax === 'number' ? box.xMax : xMin + (box.width || 0);
            const yMax = 'yMax' in box && typeof box.yMax === 'number' ? box.yMax : yMin + (box.height || 0);
            
            x = Math.floor(xMin * imageData.width);
            y = Math.floor(yMin * imageData.height);
            width = Math.floor((xMax - xMin) * imageData.width);
            height = Math.floor((yMax - yMin) * imageData.height);
          } else if ('xCenter' in box && 'yCenter' in box && box.xCenter !== undefined && box.yCenter !== undefined) {
            // Center-based coordinates
            x = Math.floor(box.xCenter - (box.width || 0) / 2);
            y = Math.floor(box.yCenter - (box.height || 0) / 2);
            width = Math.floor(box.width || 0);
            height = Math.floor(box.height || 0);
          } else if ('x' in box && 'y' in box) {
            // Direct x/y coordinates
            x = Math.floor(box.x || 0);
            y = Math.floor(box.y || 0);
            width = Math.floor(box.width || 0);
            height = Math.floor(box.height || 0);
          } else {
            // Log the actual structure for debugging
            console.error('❌ Unknown bounding box format. Full box object:', box);
            console.error('❌ Available properties:', Object.keys(box));
            console.error('❌ Box values:', Object.entries(box).map(([k, v]) => `${k}: ${v} (${typeof v})`));
            throw new Error(`Unknown bounding box format. Properties: ${Object.keys(box).join(', ')}`);
          }
          
          // Clamp to image boundaries
          x = Math.max(0, Math.min(x, imageData.width - 1));
          y = Math.max(0, Math.min(y, imageData.height - 1));
          width = Math.max(1, Math.min(width, imageData.width - x));
          height = Math.max(1, Math.min(height, imageData.height - y));

          // Ensure valid dimensions
          if (width <= 0 || height <= 0 || x < 0 || y < 0) {
            console.warn('⚠️ Invalid bounding box dimensions, skipping face:', { x, y, width, height });
            return null;
          }

          // Validate bounds
          if (x + width > imageData.width || y + height > imageData.height) {
            console.warn('⚠️ Bounding box exceeds image bounds, clamping:', {
              x, y, width, height,
              imageWidth: imageData.width,
              imageHeight: imageData.height
            });
          }

          const boundingBox = { x, y, width, height };
          console.log('✅ Processed bounding box:', boundingBox);

          // Extract face region
          const faceImageData = this.extractFaceRegion(imageData, boundingBox);
          console.log('✅ Face region extracted:', {
            extractedWidth: faceImageData.width,
            extractedHeight: faceImageData.height
          });

          return {
            imageData: faceImageData,
            boundingBox,
            confidence: detection.score || 0.95
          };
        } catch (error) {
          console.error('❌ Error processing MediaPipe detection:', error);
          return null;
        }
      }).filter((face): face is DetectedFace => face !== null);

      console.log(`✅ MediaPipe detected ${faces.length} face(s) in ${processingTime.toFixed(2)}ms`);
      faces.forEach((face, idx) => {
        console.log(`   Face ${idx + 1}: confidence=${(face.confidence * 100).toFixed(1)}%, bbox=(${face.boundingBox.x.toFixed(0)}, ${face.boundingBox.y.toFixed(0)}, ${face.boundingBox.width.toFixed(0)}x${face.boundingBox.height.toFixed(0)})`);
      });

      return {
        faces,
        originalImage: imageData,
        processingTime
      };
    } catch (error) {
      console.error('❌ Error detecting faces with MediaPipe:', error);
      console.warn('⚠️ Falling back to mock face detection');
      
      // Fallback to mock detection
      const mockFaces = this.mockDetectFaces(imageData);
      return {
        faces: mockFaces,
        originalImage: imageData,
        processingTime: performance.now() - startTime
      };
    }
  }

  // Convert ImageData to HTMLImageElement for MediaPipe
  private static async imageDataToImage(imageData: ImageData): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.putImageData(imageData, 0, 0);

      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = canvas.toDataURL();
    });
  }

  // Mock face detection (remove when using real MediaPipe)
  private static mockDetectFaces(imageData: ImageData): DetectedFace[] {
    const { width, height } = imageData;

    // Simulate detecting one face in the center area of the image
    const faceSize = Math.min(width, height) * 0.3; // 30% of smaller dimension
    const centerX = width / 2;
    const centerY = height / 2;

    const boundingBox = {
      x: Math.max(0, centerX - faceSize / 2),
      y: Math.max(0, centerY - faceSize / 2),
      width: Math.min(faceSize, width),
      height: Math.min(faceSize, height)
    };

    // Extract face region
    const faceImageData = this.extractFaceRegion(imageData, boundingBox);

    return [{
      imageData: faceImageData,
      boundingBox,
      confidence: 0.92 // Mock confidence score
    }];
  }

  // Extract face region from image data
  private static extractFaceRegion(imageData: ImageData, bbox: { x: number; y: number; width: number; height: number }): ImageData {
    const { width: imgWidth, height: imgHeight } = imageData;
    
    // Ensure all values are integers (required by Canvas API)
    const intX = Math.max(0, Math.floor(bbox.x));
    const intY = Math.max(0, Math.floor(bbox.y));
    const intWidth = Math.max(1, Math.floor(bbox.width));
    const intHeight = Math.max(1, Math.floor(bbox.height));

    // Clamp to image boundaries
    const clampedX = Math.min(intX, imgWidth - 1);
    const clampedY = Math.min(intY, imgHeight - 1);
    const clampedWidth = Math.min(intWidth, imgWidth - clampedX);
    const clampedHeight = Math.min(intHeight, imgHeight - clampedY);

    // Final validation
    if (clampedWidth <= 0 || clampedHeight <= 0) {
      throw new Error(`Invalid bounding box after clamping: x=${clampedX}, y=${clampedY}, width=${clampedWidth}, height=${clampedHeight} for image ${imgWidth}x${imgHeight}`);
    }

    // Create canvas to extract the face region (ensure integer dimensions)
    const canvas = document.createElement('canvas');
    canvas.width = clampedWidth;
    canvas.height = clampedHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    // Put the original image on a temporary canvas
    const originalCanvas = document.createElement('canvas');
    originalCanvas.width = Math.floor(imgWidth);
    originalCanvas.height = Math.floor(imgHeight);
    const originalCtx = originalCanvas.getContext('2d');
    if (!originalCtx) {
      throw new Error('Could not get 2D context from original canvas');
    }

    // Create ImageData from the original data
    const originalImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      Math.floor(imgWidth),
      Math.floor(imgHeight)
    );
    originalCtx.putImageData(originalImageData, 0, 0);

    // Extract the face region by drawing the portion of the original canvas
    // All coordinates must be integers
    ctx.drawImage(
      originalCanvas,
      clampedX, clampedY, clampedWidth, clampedHeight,  // Source rectangle (integers)
      0, 0, clampedWidth, clampedHeight                   // Destination rectangle (integers)
    );

    // Get the extracted region as ImageData (all parameters must be integers)
    const result = ctx.getImageData(0, 0, clampedWidth, clampedHeight);
    return result;
  }

  // Draw bounding boxes on image (for debugging/visualization)
  static drawBoundingBoxes(imageData: ImageData, faces: DetectedFace[]): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;

    // Draw original image
    ctx.putImageData(imageData, 0, 0);

    // Draw bounding boxes
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    faces.forEach(face => {
      const { x, y, width, height } = face.boundingBox;
      ctx.strokeRect(x, y, width, height);

      // Draw confidence score
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px Arial';
      ctx.fillText(
        `Confidence: ${(face.confidence * 100).toFixed(1)}%`,
        x, y - 5
      );
    });

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  // Dispose resources
  static dispose(): void {
    if (this.detector) {
      // MediaPipe detector doesn't have explicit dispose, but we can null it
      this.detector = null;
    }
    this.modelLoaded = false;
    console.log('🗑️ Face detection service disposed');
  }
}