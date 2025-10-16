import 'dart:typed_data';
import 'dart:math' as math;
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;
import 'package:flutter/foundation.dart';

class FaceRegistrationService {
  static Interpreter? _interpreter;
  static bool _isModelLoaded = false;
  static const int _embeddingSize = 128;
  static const int _inputSize = 112;

  // Initialize the TensorFlow Lite model
  static Future<bool> initializeModel() async {
    try {
      if (_isModelLoaded) return true;

      // Load the model from assets
      _interpreter =
          await Interpreter.fromAsset('assets/models/output_model.tflite');
      _isModelLoaded = true;
      print('✅ MobileFaceNet model loaded successfully');
      return true;
    } catch (e) {
      print('❌ Error loading MobileFaceNet model: $e');
      return false;
    }
  }

  // Preprocess face image for MobileFaceNet (matching Python implementation)
  static Float32List? preprocessFace(Uint8List imageBytes) {
    try {
      // Decode image
      img.Image? image = img.decodeImage(imageBytes);
      if (image == null) {
        print('❌ Failed to decode image');
        return null;
      }

      // Convert BGR to RGB (matching cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
      // The image is already in RGB format from Flutter camera

      // Resize to 112x112 (matching cv2.resize(face, (112, 112)))
      image = img.copyResize(image, width: _inputSize, height: _inputSize);

      // Normalize to [-1, 1] range (matching face.astype("float32") / 127.5 - 1.0)
      List<double> flatImage = [];

      for (int y = 0; y < _inputSize; y++) {
        for (int x = 0; x < _inputSize; x++) {
          img.Pixel pixel = image.getPixel(x, y);
          // Add RGB channels in order (matching Python's channel order)
          flatImage.add((pixel.r / 127.5) - 1.0); // Red channel
          flatImage.add((pixel.g / 127.5) - 1.0); // Green channel
          flatImage.add((pixel.b / 127.5) - 1.0); // Blue channel
        }
      }

      return Float32List.fromList(flatImage);
    } catch (e) {
      print('❌ Error preprocessing face: $e');
      return null;
    }
  }

  // Generate face embedding using MobileFaceNet (matching Python implementation)
  static Future<List<double>?> generateFaceEmbedding(
      Uint8List imageBytes) async {
    try {
      if (!_isModelLoaded || _interpreter == null) {
        bool loaded = await initializeModel();
        if (!loaded) return null;
      }

      // Preprocess the face image
      Float32List? preprocessedFace = preprocessFace(imageBytes);
      if (preprocessedFace == null) {
        print('❌ Failed to preprocess face');
        return null;
      }

      // Prepare input and output tensors

      // Prepare input tensor - convert to the expected format
      var input = List.generate(
          1,
          (i) => List.generate(
              _inputSize,
              (y) => List.generate(
                  _inputSize,
                  (x) => List.generate(
                      3,
                      (c) => preprocessedFace[y * _inputSize * 3 + x * 3 + c]
                          .toDouble()))));

      // Prepare output tensor with correct shape [1, 128]
      var output = List.generate(1, (i) => List.filled(_embeddingSize, 0.0));

      if (kDebugMode) {
        print(
            '📊 Input shape: [${input.length}, ${input[0].length}, ${input[0][0].length}, ${input[0][0][0].length}]');
        print('📊 Output shape: [${output.length}, ${output[0].length}]');
      }

      // Run inference
      _interpreter!.run(input, output);

      // Extract embedding from the first (and only) output
      List<double> embedding = output[0].map((e) => e.toDouble()).toList();

      if (kDebugMode) {
        print(
            '✅ Face embedding generated successfully (${embedding.length} dimensions)');
        print('📊 Embedding preview: ${embedding.take(5).toList()}');
      }
      return embedding;
    } catch (e) {
      print('❌ Error generating face embedding: $e');
      return null;
    }
  }

  // Direct face embedding generation using MobileFaceNet model only
  static Future<List<double>?> processFaceDirectly(Uint8List imageBytes) async {
    try {
      if (kDebugMode) {
        print('🔍 Processing image directly with MobileFaceNet...');
      }

      // Decode image to get dimensions
      img.Image? image = img.decodeImage(imageBytes);
      if (image == null) {
        print('❌ Failed to decode image');
        return null;
      }

      if (kDebugMode) {
        print('📐 Image size: ${image.width}x${image.height}');
      }

      // Generate embedding directly without face detection
      List<double>? embedding = await generateFaceEmbedding(imageBytes);

      if (embedding != null && embedding.isNotEmpty) {
        print('✅ Face embedding generated successfully');
        return embedding;
      } else {
        print('❌ Failed to generate face embedding');
        return null;
      }
    } catch (e) {
      print('❌ Error processing face: $e');
      return null;
    }
  }

  // Complete face registration process using MobileFaceNet only
  static Future<List<double>?> registerFace(Uint8List imageBytes) async {
    try {
      // Process face directly with MobileFaceNet model
      List<double>? embedding = await processFaceDirectly(imageBytes);
      return embedding;
    } catch (e) {
      print('❌ Error in face registration: $e');
      return null;
    }
  }

  // Calculate cosine similarity between two face embeddings
  static double calculateSimilarity(
      List<double> embedding1, List<double> embedding2) {
    if (embedding1.length != embedding2.length) {
      throw ArgumentError('Embeddings must have the same length');
    }

    double dotProduct = 0.0;
    double norm1 = 0.0;
    double norm2 = 0.0;

    for (int i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 == 0.0 || norm2 == 0.0) {
      return 0.0;
    }

    return dotProduct / (math.sqrt(norm1) * math.sqrt(norm2));
  }

  // Normalize face embedding (L2 normalization)
  static List<double> normalizeEmbedding(List<double> embedding) {
    double norm = 0.0;
    for (double value in embedding) {
      norm += value * value;
    }
    norm = math.sqrt(norm);

    if (norm == 0.0) {
      return embedding;
    }

    return embedding.map((value) => value / norm).toList();
  }

  // Validate face embedding quality
  static bool isValidEmbedding(List<double> embedding) {
    if (embedding.length != _embeddingSize) {
      return false;
    }

    // Check if embedding has reasonable values (not all zeros or NaNs)
    bool hasNonZero = false;
    for (double value in embedding) {
      if (value.isNaN || value.isInfinite) {
        return false;
      }
      if (value != 0.0) {
        hasNonZero = true;
      }
    }

    return hasNonZero;
  }

  // Dispose resources
  static void dispose() {
    _interpreter?.close();
    _interpreter = null;
    _isModelLoaded = false;
  }
}

// Note: Using tflite_flutter's built-in reshape extension