import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { FaceProcessingService } from '@/services/FaceProcessingService';
import { MatchingService } from '@/services/faceRecognition/MatchingService';

export default function ArcFaceTestPage() {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [embedding1, setEmbedding1] = useState<number[] | null>(null);
  const [embedding2, setEmbedding2] = useState<number[] | null>(null);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingLog, setProcessingLog] = useState<string[]>([]);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    setProcessingLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const handleImage1Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImage1(null);
    setEmbedding1(null);
    setSimilarity(null);

    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') resolve(result);
          else reject(new Error('Failed to read image'));
        };
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
      });

      setImage1(dataUrl);
      addLog(`✅ Image 1 loaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image 1');
      addLog(`❌ Error loading image 1: ${err}`);
    }
  };

  const handleImage2Upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImage2(null);
    setEmbedding2(null);
    setSimilarity(null);

    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') resolve(result);
          else reject(new Error('Failed to read image'));
        };
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
      });

      setImage2(dataUrl);
      addLog(`✅ Image 2 loaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image 2');
      addLog(`❌ Error loading image 2: ${err}`);
    }
  };

  const processImage1 = async () => {
    if (!image1) return;

    setIsProcessing(true);
    setError(null);
    setEmbedding1(null);
    addLog('🔄 Processing Image 1 with ArcFace...');

    try {
      const result = await FaceProcessingService.processImage(image1);
      
      if (!result.success || !result.embedding) {
        throw new Error(result.error || 'Failed to process image 1');
      }

      const emb = result.embedding;
      setEmbedding1(emb);
      
      const norm = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0));
      const isNormalized = Math.abs(norm - 1.0) < 0.01;
      
      addLog(`✅ Image 1 embedding generated: ${emb.length} dimensions`);
      addLog(`   Norm: ${norm.toFixed(6)} ${isNormalized ? '(normalized ✓)' : '(NOT normalized ✗)'}`);
      addLog(`   Confidence: ${result.confidence ?? 0} ${(result.confidence ?? 0) >= 0.9 ? '(Real Model ✓)' : '(Mock/Fallback ✗)'}`);
      addLog(`   First 5 values: [${emb.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

      if (embedding2) {
        calculateSimilarity(emb, embedding2);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Image 1 processing failed: ${errorMsg}`);
      addLog(`❌ Error processing image 1: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage2 = async () => {
    if (!image2) return;

    setIsProcessing(true);
    setError(null);
    setEmbedding2(null);
    addLog('🔄 Processing Image 2 with ArcFace...');

    try {
      const result = await FaceProcessingService.processImage(image2);
      
      if (!result.success || !result.embedding) {
        throw new Error(result.error || 'Failed to process image 2');
      }

      const emb = result.embedding;
      setEmbedding2(emb);
      
      const norm = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0));
      const isNormalized = Math.abs(norm - 1.0) < 0.01;
      
      addLog(`✅ Image 2 embedding generated: ${emb.length} dimensions`);
      addLog(`   Norm: ${norm.toFixed(6)} ${isNormalized ? '(normalized ✓)' : '(NOT normalized ✗)'}`);
      addLog(`   Confidence: ${result.confidence ?? 0} ${(result.confidence ?? 0) >= 0.9 ? '(Real Model ✓)' : '(Mock/Fallback ✗)'}`);
      addLog(`   First 5 values: [${emb.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

      if (embedding1) {
        calculateSimilarity(embedding1, emb);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Image 2 processing failed: ${errorMsg}`);
      addLog(`❌ Error processing image 2: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateSimilarity = (emb1: number[], emb2: number[]) => {
    addLog('📊 Calculating cosine similarity...');
    
    try {
      const sim = MatchingService.calculateSimilarity(emb1, emb2);
      setSimilarity(sim);
      
      // Calculate detailed metrics
      let dotProduct = 0.0;
      let norm1 = 0.0;
      let norm2 = 0.0;

      for (let i = 0; i < emb1.length; i++) {
        dotProduct += emb1[i] * emb2[i];
        norm1 += emb1[i] * emb1[i];
        norm2 += emb2[i] * emb2[i];
      }

      const norm1Sqrt = Math.sqrt(norm1);
      const norm2Sqrt = Math.sqrt(norm2);
      
      addLog(`✅ Cosine similarity calculated: ${sim.toFixed(6)} (${(sim * 100).toFixed(2)}%)`);
      addLog(`   Dot Product: ${dotProduct.toFixed(6)}`);
      addLog(`   Norm 1: ${norm1Sqrt.toFixed(6)}`);
      addLog(`   Norm 2: ${norm2Sqrt.toFixed(6)}`);
      addLog(`   Formula: cos(θ) = ${dotProduct.toFixed(4)} / (${norm1Sqrt.toFixed(4)} × ${norm2Sqrt.toFixed(4)}) = ${sim.toFixed(6)}`);
      
      if (sim > 0.9) {
        addLog('🎯 HIGH similarity - Likely the same person');
      } else if (sim > 0.7) {
        addLog('⚠️ MODERATE similarity - Possibly the same person');
      } else {
        addLog('❌ LOW similarity - Different people');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Similarity calculation failed: ${errorMsg}`);
      addLog(`❌ Error calculating similarity: ${errorMsg}`);
    }
  };

  const processBoth = async () => {
    if (!image1 || !image2) {
      setError('Please upload both images first');
      return;
    }

    setProcessingLog([]);
    setError(null);
    setIsProcessing(true);
    addLog('🚀 Starting ArcFace test (matching Python reference)...');
    addLog('📋 Test procedure:');
    addLog('   1. Process Image 1 → Generate embedding 1');
    addLog('   2. Process Image 2 → Generate embedding 2');
    addLog('   3. Normalize both embeddings');
    addLog('   4. Calculate cosine similarity: dot(emb1, emb2)');

    try {
      // Process Image 1
      addLog('🔄 Step 1: Processing Image 1...');
      addLog('   → Face Detection (MediaPipe)...');
      addLog('   → Face Embedding (ArcFace)...');
      
      const result1 = await FaceProcessingService.processImage(image1);
      
      if (!result1.success || !result1.embedding) {
        throw new Error(result1.error || 'Failed to process image 1');
      }

      if (!result1.faceDetected) {
        throw new Error('No face detected in Image 1. Please ensure the image contains a clear face.');
      }

      const emb1 = result1.embedding;
      setEmbedding1(emb1);
      
      const norm1 = Math.sqrt(emb1.reduce((sum, v) => sum + v * v, 0));
      const isNormalized1 = Math.abs(norm1 - 1.0) < 0.01;
      
      addLog(`✅ Image 1: Face detected and embedding generated`);
      addLog(`   Dimensions: ${emb1.length}`);
      addLog(`   Norm: ${norm1.toFixed(6)} ${isNormalized1 ? '(normalized ✓)' : '(NOT normalized ✗)'}`);
      addLog(`   Confidence: ${result1.confidence ?? 0} ${(result1.confidence ?? 0) >= 0.9 ? '(Real ArcFace Model ✓)' : '(Mock/Fallback ✗)'}`);
      addLog(`   First 5 values: [${emb1.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

      // Process Image 2
      addLog('');
      addLog('🔄 Step 2: Processing Image 2...');
      addLog('   → Face Detection (MediaPipe)...');
      addLog('   → Face Embedding (ArcFace)...');
      
      const result2 = await FaceProcessingService.processImage(image2);
      
      if (!result2.success || !result2.embedding) {
        throw new Error(result2.error || 'Failed to process image 2');
      }

      if (!result2.faceDetected) {
        throw new Error('No face detected in Image 2. Please ensure the image contains a clear face.');
      }

      const emb2 = result2.embedding;
      setEmbedding2(emb2);
      
      const norm2 = Math.sqrt(emb2.reduce((sum, v) => sum + v * v, 0));
      const isNormalized2 = Math.abs(norm2 - 1.0) < 0.01;
      
      addLog(`✅ Image 2: Face detected and embedding generated`);
      addLog(`   Dimensions: ${emb2.length}`);
      addLog(`   Norm: ${norm2.toFixed(6)} ${isNormalized2 ? '(normalized ✓)' : '(NOT normalized ✗)'}`);
      addLog(`   Confidence: ${result2.confidence ?? 0} ${(result2.confidence ?? 0) >= 0.9 ? '(Real ArcFace Model ✓)' : '(Mock/Fallback ✗)'}`);
      addLog(`   First 5 values: [${emb2.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

      // Calculate similarity using the embeddings we just got
      addLog('');
      addLog('🔄 Step 3: Calculating Cosine Similarity...');
      calculateSimilarity(emb1, emb2);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Processing failed: ${errorMsg}`);
      addLog(`❌ Error: ${errorMsg}`);
      addLog('');
      addLog('💡 Troubleshooting:');
      addLog('   - Ensure both images contain clear, front-facing faces');
      addLog('   - Check browser console (F12) for detailed error messages');
      addLog('   - Verify MediaPipe and ArcFace models are loading correctly');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setImage1(null);
    setImage2(null);
    setEmbedding1(null);
    setEmbedding2(null);
    setSimilarity(null);
    setError(null);
    setProcessingLog([]);
    if (fileInput1Ref.current) fileInput1Ref.current.value = '';
    if (fileInput2Ref.current) fileInput2Ref.current.value = '';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>ArcFace Model Test</CardTitle>
          <CardDescription>
            Test ArcFace model by comparing two face images. This matches the Python reference implementation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="font-semibold text-blue-900 mb-2">📋 Test Procedure (Python Reference):</div>
            <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`1. preprocess(img) → resize to (112, 112), normalize: (img - 127.5) / 128.0
2. sess.run() → Generate embedding (512 dimensions)
3. Normalize: emb = emb / np.linalg.norm(emb)
4. Cosine similarity: np.dot(emb1, emb2)`}
            </pre>
          </div>

          {/* Image Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Image 1</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInput1Ref}
                  type="file"
                  accept="image/*"
                  onChange={handleImage1Upload}
                  className="hidden"
                  id="image1-input"
                />
                <label htmlFor="image1-input">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image 1
                    </span>
                  </Button>
                </label>

                {image1 && (
                  <>
                    <img src={image1} alt="Image 1" className="w-full h-48 object-contain border rounded" />
                    <Button onClick={processImage1} disabled={isProcessing} className="w-full">
                      {isProcessing ? 'Processing...' : 'Process with ArcFace'}
                    </Button>
                  </>
                )}

                {embedding1 && (
                  <div className="text-xs bg-green-50 border border-green-200 rounded p-2">
                    <div className="font-semibold text-green-800">✅ Embedding 1 Generated</div>
                    <div>Dimensions: {embedding1.length}</div>
                    <div>Norm: {Math.sqrt(embedding1.reduce((sum, v) => sum + v * v, 0)).toFixed(6)}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Image 2</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInput2Ref}
                  type="file"
                  accept="image/*"
                  onChange={handleImage2Upload}
                  className="hidden"
                  id="image2-input"
                />
                <label htmlFor="image2-input">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image 2
                    </span>
                  </Button>
                </label>

                {image2 && (
                  <>
                    <img src={image2} alt="Image 2" className="w-full h-48 object-contain border rounded" />
                    <Button onClick={processImage2} disabled={isProcessing} className="w-full">
                      {isProcessing ? 'Processing...' : 'Process with ArcFace'}
                    </Button>
                  </>
                )}

                {embedding2 && (
                  <div className="text-xs bg-green-50 border border-green-200 rounded p-2">
                    <div className="font-semibold text-green-800">✅ Embedding 2 Generated</div>
                    <div>Dimensions: {embedding2.length}</div>
                    <div>Norm: {Math.sqrt(embedding2.reduce((sum, v) => sum + v * v, 0)).toFixed(6)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Process Both Button */}
          {image1 && image2 && (
            <div className="flex gap-4">
              <Button onClick={processBoth} disabled={isProcessing} className="flex-1" size="lg">
                {isProcessing ? 'Processing...' : '🚀 Process Both & Calculate Similarity'}
              </Button>
              <Button onClick={clearAll} variant="outline" size="lg">
                Clear All
              </Button>
            </div>
          )}

          {/* Similarity Result */}
          {similarity !== null && (
            <Card className={similarity > 0.7 ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {similarity > 0.9 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : similarity > 0.7 ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Cosine Similarity Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {similarity.toFixed(6)} ({((similarity) * 100).toFixed(2)}%)
                </div>
                <div className="text-sm space-y-1">
                  {similarity > 0.9 && (
                    <div className="text-green-700">✅ HIGH similarity - Likely the same person</div>
                  )}
                  {similarity > 0.7 && similarity <= 0.9 && (
                    <div className="text-yellow-700">⚠️ MODERATE similarity - Possibly the same person</div>
                  )}
                  {similarity <= 0.7 && (
                    <div className="text-red-700">❌ LOW similarity - Different people</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <div className="border border-red-200 bg-red-50 text-red-800 text-sm rounded-md p-3">
              <div className="font-semibold mb-1">❌ Error:</div>
              <div>{error}</div>
            </div>
          )}

          {/* Processing Log */}
          {processingLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded max-h-96 overflow-y-auto">
                  {processingLog.map((log, idx) => (
                    <div key={idx} className="mb-1">
                      {log}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setProcessingLog([])}
                >
                  Clear Log
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

