import { useEffect, useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FaceProcessingService } from '@/services/FaceProcessingService';
import { databaseService } from '@/services/DatabaseService';
import { MatchingService } from '@/services/faceRecognition/MatchingService';
import { AlertTriangle, CheckCircle, Camera, Upload } from 'lucide-react';

interface MissingCase {
  id: string;
  caseId: string;
  name?: string;
  age?: number;
  status?: string;
  dateReported?: string;
  location?: string;
  createdAt: string;
  embedding: number[];
  metadata?: any;
}

export function MissingPersonsPublicPage() {
  const [cases, setCases] = useState<MissingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<MissingCase | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    uploadedEmbedding?: number[];
    fileMetadata?: {
      name: string;
      size: number;
      type: string;
      lastModified: string;
      extension?: string;
      hash?: string;
    };
    comparisons?: Array<{
      caseId: string;
      name: string;
      similarity: number;
      dotProduct: number;
      norm1: number;
      norm2: number;
    }>;
    processResult?: {
      confidence: number;
      processingTime?: number;
    };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const embeddings = await FaceProcessingService.getAllStoredEmbeddings();

        const mapped: MissingCase[] = embeddings.map((item) => {
          const metadata = item.metadata || {};
          return {
            id: item.id,
            caseId: item.caseId,
            name: metadata.name || metadata.caseName || '',
            age: typeof metadata.age === 'number' ? metadata.age : undefined,
            status: metadata.status || 'active',
            dateReported: metadata.dateReported || item.createdAt?.slice(0, 10),
            location: metadata.location || '',
            createdAt: item.createdAt,
            embedding: item.embedding,
            metadata,
          };
        });

        // Only show active missing persons
        setCases(mapped.filter((c) => (c.status || 'active') === 'active'));
      } catch (err) {
        console.error('❌ Failed to load missing cases', err);
        setError('Failed to load missing persons from database.');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const getBrowserLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (!('geolocation' in navigator)) {
      console.warn('ℹ️ Browser geolocation API not available');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 Browser GPS location acquired (public citizen):', { latitude, longitude });
          resolve({ latitude, longitude });
        },
        (geoError) => {
          console.warn('⚠️ Browser geolocation failed or was denied (public citizen):', geoError);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        },
      );
    });
  };

  // Webcam capture functionality
  const startWebcam = async () => {
    try {
      console.log('📷 Starting webcam...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Set webcam active first so the video element is rendered
      setIsWebcamActive(true);
      setIsVideoReady(false);
      
      // Wait a bit to ensure video element is rendered in DOM
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🎥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      console.log('✅ Camera access granted, attaching stream to video element...');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('📺 Video metadata loaded');
          videoRef.current?.play().then(() => {
            console.log('▶️ Video playing successfully');
            // Check if video dimensions are available (video is ready)
            if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              setIsVideoReady(true);
              console.log('✅ Webcam started successfully - video is ready');
            } else {
              // Wait a bit more for video dimensions
              setTimeout(() => {
                if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                  setIsVideoReady(true);
                  console.log('✅ Video ready after delay');
                }
              }, 200);
            }
          }).catch((playError) => {
            console.error('❌ Error playing video:', playError);
            alert('Unable to start video stream. Please try again.');
            stopWebcam();
          });
        };

        videoRef.current.onerror = (videoError) => {
          console.error('❌ Video element error:', videoError);
          alert('Video stream error occurred. Please try again.');
          stopWebcam();
        };
      } else {
        console.error('❌ Video ref is null, cannot attach stream');
        stream.getTracks().forEach(track => track.stop());
        setIsWebcamActive(false);
        setIsVideoReady(false);
        alert('Video element not ready. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error accessing webcam:', error);
      setIsWebcamActive(false);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Camera permission denied. Please allow camera access to use this feature.\n\nTo fix:\n1. Click the camera icon 📷 in your browser address bar\n2. Select "Allow" for camera access\n3. Refresh the page and try again');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found. Please connect a camera and try again.');
        } else if (error.name === 'NotReadableError') {
          alert('Camera is already in use by another application. Please close other apps using the camera and try again.');
        } else {
          alert(`Unable to access webcam: ${error.message}\n\nPlease check:\n• Camera permissions are granted\n• Camera is not in use by other apps\n• Browser supports camera access`);
        }
      }
    }
  };

  const stopWebcam = () => {
    console.log('🛑 Stopping webcam...');
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setIsVideoReady(false);
  };

  const capturePhoto = () => {
    console.log('📸 Capturing photo...', {
      videoRef: !!videoRef.current,
      canvasRef: !!canvasRef.current,
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight,
      srcObject: !!videoRef.current?.srcObject,
      isVideoReady
    });

    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Video or canvas ref is null');
      alert('Camera not ready. Please wait for the camera to load.');
      return;
    }

    if (!videoRef.current.srcObject) {
      console.error('❌ Video stream not available');
      alert('Camera stream not available. Please try again.');
      return;
    }

    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      console.error('❌ Video dimensions are zero - video not ready');
      alert('Camera is still loading. Please wait a moment and try again.');
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) {
      console.error('❌ Could not get canvas context');
      alert('Could not capture photo. Please try again.');
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      
      // Draw video frame to canvas (mirror it back for correct orientation)
      context.save();
      context.scale(-1, 1);
      context.drawImage(videoRef.current, -canvasRef.current.width, 0);
      context.restore();
      
      const photoUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      console.log('✅ Photo captured successfully', {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
        dataUrlLength: photoUrl.length
      });
      
      stopWebcam();
      // Process the captured photo
      processPhotoFromCamera(photoUrl);
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      alert('Failed to capture photo. Please try again.');
    }
  };

  const processPhotoFromCamera = async (photoUrl: string) => {
    // Use the same processing logic as file upload
    setMatchMessage(null);
    setMatchError(null);
    setDebugInfo(null);
    setIsUploading(true);

    try {
      // Get browser GPS location
      const browserLocation = await getBrowserLocation();
      const latitude = browserLocation?.latitude;
      const longitude = browserLocation?.longitude;

      console.log('🔍 Processing captured photo with ArcFace...');

      // Step 1: Generate embedding from captured photo using ArcFace
      const processResult = await FaceProcessingService.processImage(photoUrl);
      if (!processResult.success || !processResult.embedding) {
        throw new Error(processResult.error || 'Failed to process face in photo. Please ensure the photo contains a clear face.');
      }

      const queryEmbedding = processResult.embedding;
      const isLikelyMock = processResult.confidence < 0.9;

      console.log('✅ Generated embedding from captured photo:', {
        dimensions: queryEmbedding.length,
        processingTime: processResult.processingTime,
        confidence: processResult.confidence,
        modelStatus: isLikelyMock ? '⚠️ MOCK (low confidence)' : '✅ REAL MODEL',
        gpsLocation: latitude && longitude ? `${latitude}, ${longitude}` : 'Not available'
      });

      // Step 2: Compare against ALL active missing persons
      const knownFaces = cases.map((c) => ({
        id: c.caseId,
        name: c.name || c.caseId,
        embedding: c.embedding,
        photoUrl: undefined,
      }));

      console.log(`🔍 Comparing against ${knownFaces.length} stored missing person embeddings...`);

      const threshold = 0.70; // Updated threshold
      const detailedComparisons: Array<{
        caseId: string;
        name: string;
        similarity: number;
        dotProduct: number;
        norm1: number;
        norm2: number;
      }> = [];

      for (const knownFace of knownFaces) {
        const storedEmbedding = knownFace.embedding;
        let dotProduct = 0.0;
        let norm1 = 0.0;
        let norm2 = 0.0;

        for (let i = 0; i < queryEmbedding.length; i++) {
          dotProduct += queryEmbedding[i] * storedEmbedding[i];
          norm1 += queryEmbedding[i] * queryEmbedding[i];
          norm2 += storedEmbedding[i] * storedEmbedding[i];
        }

        const norm1Sqrt = Math.sqrt(norm1);
        const norm2Sqrt = Math.sqrt(norm2);
        const similarity = norm1Sqrt === 0 || norm2Sqrt === 0 ? 0 : dotProduct / (norm1Sqrt * norm2Sqrt);

        detailedComparisons.push({
          caseId: knownFace.id,
          name: knownFace.name,
          similarity,
          dotProduct,
          norm1: norm1Sqrt,
          norm2: norm2Sqrt
        });
      }

      detailedComparisons.sort((a, b) => b.similarity - a.similarity);
      const matches = detailedComparisons.filter(c => c.similarity >= threshold);

      const calculateConfidence = (similarity: number, threshold: number): number => {
        if (similarity <= threshold) return 0.0;
        const confidenceRange = 1.0 - threshold;
        const adjustedSimilarity = similarity - threshold;
        return Math.min(1.0, 0.5 + (adjustedSimilarity / confidenceRange) * 0.5);
      };

      const matchResult = {
        matches: matches.map(m => ({
          personId: m.caseId,
          personName: m.name,
          similarity: m.similarity,
          confidence: calculateConfidence(m.similarity, threshold),
          photoUrl: undefined,
          metadata: {
            embeddingDistance: 1 - m.similarity,
            threshold,
            dotProduct: m.dotProduct,
            norm1: m.norm1,
            norm2: m.norm2
          }
        })),
        processingTime: 0,
        totalCandidates: knownFaces.length,
        threshold
      };

      // Store debug info
      setDebugInfo({
        uploadedEmbedding: queryEmbedding,
        fileMetadata: {
          name: 'Camera Capture',
          size: 0,
          type: 'image/jpeg',
          lastModified: new Date().toISOString(),
          extension: 'jpg'
        },
        processResult: {
          confidence: processResult.confidence,
          processingTime: processResult.processingTime
        },
        comparisons: detailedComparisons.map(c => ({
          caseId: c.caseId,
          name: c.name,
          similarity: c.similarity,
          dotProduct: c.dotProduct,
          norm1: c.norm1,
          norm2: c.norm2
        }))
      });

      if (matchResult.matches.length > 0) {
        const bestMatch = matchResult.matches[0];
        const matchedCase = cases.find((c) => c.caseId === bestMatch.personId);
        const bestComparison = detailedComparisons.find(c => c.caseId === bestMatch.personId);

        console.log(`✅ Match found! Case: ${bestMatch.personId}, Similarity: ${(bestMatch.similarity * 100).toFixed(1)}%`);

        // Create alert in database with GPS location
        await databaseService.createAlert({
          caseId: bestMatch.personId,
          similarity: bestMatch.similarity,
          sourceRole: 'citizen',
          latitude,
          longitude,
          photoUrl,
          personName: matchedCase?.name || bestMatch.personName,
        });

        const locText =
          typeof latitude === 'number' && typeof longitude === 'number'
            ? `Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Location not available';

        setMatchMessage(
          `✅ MATCH FOUND! Possible match with ${matchedCase?.name || bestMatch.personName} (Case: ${bestMatch.personId}).\nCosine Similarity: ${bestMatch.similarity.toFixed(6)} (${(bestMatch.similarity * 100).toFixed(2)}%).\n${locText}.\nAlert has been sent to administrators.`,
        );
      } else {
        console.log(`❌ No match found above ${(threshold * 100).toFixed(0)}% threshold`);
        setMatchMessage(
          `❌ No match found. The captured photo does not match any active missing person above the ${(threshold * 100).toFixed(0)}% threshold.`,
        );
      }
    } catch (err) {
      console.error('❌ Error processing camera capture:', err);
      setMatchError(
        err instanceof Error ? err.message : 'Failed to process the captured photo.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMatchMessage(null);
    setMatchError(null);
    setDebugInfo(null);
    setIsUploading(true);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file.');
      }

      // Log file metadata for verification
      const fileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        extension: file.name.split('.').pop()?.toLowerCase()
      };

      console.log('📁 UPLOADED FILE METADATA:', fileMetadata);
      console.log('🔍 Starting processing for file:', file.name, `(${file.type}, ${(file.size / 1024).toFixed(2)} KB)`);

      // Create a simple hash/fingerprint of the file for verification
      const fileHash = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          // Simple hash: sum of first 100 bytes + file size
          let hash = 0;
          for (let i = 0; i < Math.min(100, bytes.length); i++) {
            hash += bytes[i];
          }
          hash += file.size;
          resolve(hash.toString(36));
        };
        reader.readAsArrayBuffer(file.slice(0, 100)); // Read first 100 bytes
      });

      console.log('🔐 File fingerprint/hash:', fileHash);

      const reader = new FileReader();
      const photoUrl: string = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            // Verify the data URL matches the file type
            const expectedPrefix = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')
              ? 'data:image/jpeg'
              : file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
              ? 'data:image/png'
              : `data:${file.type}`;
            
            if (!result.startsWith(expectedPrefix)) {
              console.warn('⚠️ Data URL prefix mismatch!', {
                expected: expectedPrefix,
                actual: result.substring(0, 30) + '...',
                fileName: file.name,
                fileType: file.type
              });
            }
            
            console.log('✅ File read successfully. Data URL prefix:', result.substring(0, 50) + '...');
            resolve(result);
          } else {
            reject(new Error('Failed to read image file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      console.log('🔍 Processing uploaded photo with ArcFace...');
      console.log('📋 Processing file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        hash: fileHash,
        dataUrlPrefix: photoUrl.substring(0, 50)
      });

      // Step 1: Generate embedding from uploaded photo using ArcFace
      const processResult = await FaceProcessingService.processImage(photoUrl);
      if (!processResult.success || !processResult.embedding) {
        throw new Error(processResult.error || 'Failed to process face in photo. Please ensure the photo contains a clear face.');
      }

      const queryEmbedding = processResult.embedding;
      
      // Check if this is likely a mock embedding (low confidence indicates mock)
      const isLikelyMock = processResult.confidence < 0.9;
      
      console.log('✅ Generated embedding from uploaded photo:', {
        sourceFile: fileMetadata.name,
        fileType: fileMetadata.type,
        fileHash: fileHash,
        dimensions: queryEmbedding.length,
        processingTime: processResult.processingTime,
        confidence: processResult.confidence,
        modelStatus: isLikelyMock ? '⚠️ MOCK (low confidence)' : '✅ REAL MODEL'
      });
      
      if (isLikelyMock) {
        console.error('❌❌❌ WARNING: Embedding appears to be from MOCK, not real ArcFace model!');
        console.error('❌ Confidence is', processResult.confidence, '(expected > 0.9 for real model)');
        console.error('❌ All images will produce similar embeddings!');
        console.error('❌ Check browser console for model loading errors');
        console.error('❌ Verify /models/arcface.onnx is accessible');
      }
      
      // Calculate embedding statistics for debugging
      const queryNorm = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
      const queryMin = Math.min(...queryEmbedding);
      const queryMax = Math.max(...queryEmbedding);
      const queryAvg = queryEmbedding.reduce((sum, val) => sum + val, 0) / queryEmbedding.length;
      const isNormalized = Math.abs(queryNorm - 1.0) < 0.01; // Check if norm is close to 1.0
      
      console.log('📊 Embedding statistics:', {
        dimensions: queryEmbedding.length,
        norm: queryNorm.toFixed(6),
        isNormalized: isNormalized ? 'YES (L2 normalized)' : `NO (expected ~1.0, got ${queryNorm.toFixed(6)})`,
        min: queryMin.toFixed(6),
        max: queryMax.toFixed(6),
        avg: queryAvg.toFixed(6),
        first10: queryEmbedding.slice(0, 10).map(v => v.toFixed(4))
      });

      // Store uploaded embedding in localStorage for debugging
      try {
        localStorage.setItem('last_uploaded_embedding', JSON.stringify({
          embedding: queryEmbedding,
          timestamp: new Date().toISOString(),
          fileMetadata: fileMetadata,
          fileHash: fileHash,
          photoUrlPrefix: photoUrl.substring(0, 100) + '...' // Store partial URL
        }));
        console.log('💾 Stored uploaded embedding in localStorage for debugging', {
          fileName: fileMetadata.name,
          fileType: fileMetadata.type,
          fileHash: fileHash
        });
      } catch (e) {
        console.warn('⚠️ Could not store embedding in localStorage:', e);
      }

      // Step 2: Compare against ALL active missing persons in the database
      const knownFaces = cases.map((c) => ({
        id: c.caseId,
        name: c.name || c.caseId,
        embedding: c.embedding,
        photoUrl: undefined,
      }));

      console.log(`🔍 Comparing against ${knownFaces.length} stored missing person embeddings...`);

      // Detailed comparison with debugging
      const threshold = 0.70;
      const detailedComparisons: Array<{
        caseId: string;
        name: string;
        similarity: number;
        dotProduct: number;
        norm1: number;
        norm2: number;
        embeddingStats: { min: number; max: number; avg: number; norm: number };
      }> = [];

      for (const knownFace of knownFaces) {
        const storedEmbedding = knownFace.embedding;
        
        // Calculate detailed similarity metrics
        let dotProduct = 0.0;
        let norm1 = 0.0;
        let norm2 = 0.0;

        for (let i = 0; i < queryEmbedding.length; i++) {
          dotProduct += queryEmbedding[i] * storedEmbedding[i];
          norm1 += queryEmbedding[i] * queryEmbedding[i];
          norm2 += storedEmbedding[i] * storedEmbedding[i];
        }

        const norm1Sqrt = Math.sqrt(norm1);
        const norm2Sqrt = Math.sqrt(norm2);
        const similarity = norm1Sqrt === 0 || norm2Sqrt === 0 ? 0 : dotProduct / (norm1Sqrt * norm2Sqrt);

        const storedNorm = Math.sqrt(storedEmbedding.reduce((sum, val) => sum + val * val, 0));
        const storedMin = Math.min(...storedEmbedding);
        const storedMax = Math.max(...storedEmbedding);
        const storedAvg = storedEmbedding.reduce((sum, val) => sum + val, 0) / storedEmbedding.length;
        const storedIsNormalized = Math.abs(storedNorm - 1.0) < 0.01;

        detailedComparisons.push({
          caseId: knownFace.id,
          name: knownFace.name,
          similarity,
          dotProduct,
          norm1: norm1Sqrt,
          norm2: norm2Sqrt,
          embeddingStats: {
            min: storedMin,
            max: storedMax,
            avg: storedAvg,
            norm: storedNorm
          }
        });

        console.log(`📊 Comparison with ${knownFace.name} (${knownFace.id}):`, {
          similarity: similarity.toFixed(6),
          similarityPercent: (similarity * 100).toFixed(2) + '%',
          dotProduct: dotProduct.toFixed(6),
          queryNorm: norm1Sqrt.toFixed(6),
          queryIsNormalized: Math.abs(norm1Sqrt - 1.0) < 0.01 ? 'YES' : 'NO',
          storedNorm: norm2Sqrt.toFixed(6),
          storedIsNormalized: storedIsNormalized ? 'YES' : 'NO',
          cosineFormula: `cos(θ) = ${dotProduct.toFixed(6)} / (${norm1Sqrt.toFixed(6)} × ${norm2Sqrt.toFixed(6)}) = ${similarity.toFixed(6)}`,
          storedEmbeddingStats: {
            dimensions: storedEmbedding.length,
            norm: storedNorm.toFixed(6),
            isNormalized: storedIsNormalized ? 'YES (L2 normalized)' : `NO (expected ~1.0, got ${storedNorm.toFixed(6)})`,
            min: storedMin.toFixed(6),
            max: storedMax.toFixed(6),
            avg: storedAvg.toFixed(6),
            first10: storedEmbedding.slice(0, 10).map(v => v.toFixed(4))
          }
        });
      }

      // Sort by similarity
      detailedComparisons.sort((a, b) => b.similarity - a.similarity);

      console.log('📈 All comparisons (sorted by similarity):', detailedComparisons.map(c => ({
        case: c.caseId,
        name: c.name,
        similarity: (c.similarity * 100).toFixed(2) + '%',
        dotProduct: c.dotProduct.toFixed(4),
        norms: `${c.norm1.toFixed(4)} × ${c.norm2.toFixed(4)}`
      })));

      // Filter matches above threshold
      const matches = detailedComparisons.filter(c => c.similarity >= threshold);
      
      // Calculate confidence (same logic as MatchingService)
      const calculateConfidence = (similarity: number, threshold: number): number => {
        if (similarity <= threshold) return 0.0;
        const confidenceRange = 1.0 - threshold;
        const adjustedSimilarity = similarity - threshold;
        return Math.min(1.0, 0.5 + (adjustedSimilarity / confidenceRange) * 0.5);
      };

      const matchResult = {
        matches: matches.map(m => ({
          personId: m.caseId,
          personName: m.name,
          similarity: m.similarity,
          confidence: calculateConfidence(m.similarity, threshold),
          photoUrl: undefined,
          metadata: {
            embeddingDistance: 1 - m.similarity,
            threshold,
            dotProduct: m.dotProduct,
            norm1: m.norm1,
            norm2: m.norm2
          }
        })),
        processingTime: 0,
        totalCandidates: knownFaces.length,
        threshold
      };

      // Get browser GPS location (if available) - capture at upload time
      const browserLocation = await getBrowserLocation();
      const latitude = browserLocation?.latitude;
      const longitude = browserLocation?.longitude;

      // Store debug info
      setDebugInfo({
        uploadedEmbedding: queryEmbedding,
        fileMetadata: {
          ...fileMetadata,
          hash: fileHash
        },
        processResult: {
          confidence: processResult.confidence,
          processingTime: processResult.processingTime
        },
        comparisons: detailedComparisons.map(c => ({
          caseId: c.caseId,
          name: c.name,
          similarity: c.similarity,
          dotProduct: c.dotProduct,
          norm1: c.norm1,
          norm2: c.norm2
        }))
      });

      if (matchResult.matches.length > 0) {
        // Found a match above threshold - use the best match
        const bestMatch = matchResult.matches[0];
        const matchedCase = cases.find((c) => c.caseId === bestMatch.personId);
        const bestComparison = detailedComparisons.find(c => c.caseId === bestMatch.personId);

        console.log(`✅ Match found! Case: ${bestMatch.personId}, Similarity: ${(bestMatch.similarity * 100).toFixed(1)}%`);

        // Create alert in database with person name in metadata
        await databaseService.createAlert({
          caseId: bestMatch.personId,
          similarity: bestMatch.similarity,
          sourceRole: 'citizen',
          latitude,
          longitude,
          photoUrl,
          personName: matchedCase?.name || bestMatch.personName,
        });

        const locText =
          typeof latitude === 'number' && typeof longitude === 'number'
            ? `Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Location not available';

        const cosineDetails = bestComparison 
          ? `\nCosine Similarity Details:\n- Dot Product: ${bestComparison.dotProduct.toFixed(6)}\n- Query Norm: ${bestComparison.norm1.toFixed(6)}\n- Stored Norm: ${bestComparison.norm2.toFixed(6)}\n- Cosine = ${bestComparison.dotProduct.toFixed(6)} / (${bestComparison.norm1.toFixed(6)} × ${bestComparison.norm2.toFixed(6)}) = ${bestMatch.similarity.toFixed(6)}`
          : '';

        setMatchMessage(
          `✅ MATCH FOUND! Possible match with ${matchedCase?.name || bestMatch.personName} (Case: ${bestMatch.personId}).\nCosine Similarity: ${bestMatch.similarity.toFixed(6)} (${(bestMatch.similarity * 100).toFixed(2)}%).\n${locText}.\nAlert has been sent to administrators.${cosineDetails}`,
        );
      } else {
        // No match above threshold
        console.log(`❌ No match found above ${(threshold * 100).toFixed(0)}% threshold`);
        
        const bestComparison = detailedComparisons[0]; // Already sorted by similarity
        
        const cosineDetails = bestComparison
          ? `\nClosest Match Details:\n- Case: ${bestComparison.caseId} (${bestComparison.name})\n- Cosine Similarity: ${bestComparison.similarity.toFixed(6)} (${(bestComparison.similarity * 100).toFixed(2)}%)\n- Dot Product: ${bestComparison.dotProduct.toFixed(6)}\n- Query Norm: ${bestComparison.norm1.toFixed(6)}\n- Stored Norm: ${bestComparison.norm2.toFixed(6)}`
          : '';

        setMatchMessage(
          `❌ No match found. The uploaded photo does not match any active missing person above the ${(threshold * 100).toFixed(0)}% threshold.${cosineDetails}`,
        );
      }
    } catch (err) {
      console.error('❌ Error processing citizen upload:', err);
      setMatchError(
        err instanceof Error ? err.message : 'Failed to process the uploaded photo.',
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startReportForCase = (c: MissingCase) => {
    setSelectedCase(c);
    setMatchMessage(null);
    setMatchError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout
      title="Missing Persons (Public Citizen)"
      breadcrumbs={[{ title: 'Missing Persons (Public Citizen)' }]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Missing Persons</CardTitle>
            <CardDescription>
              If you recognize someone in this list, click <span className="font-semibold">Report
              Sighting</span> on their card, then upload a clear photo of the person you see. The
              system will compare it with that specific missing person and send an alert to admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading missing persons...
              </div>
            ) : cases.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No active missing persons are currently in the system.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cases.map((c) => (
                  <Card key={c.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {c.name || <span className="italic text-gray-500">Unknown Name</span>}
                        </CardTitle>
                        <Badge variant="destructive">Missing</Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Case ID: <span className="font-mono">{c.caseId}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-gray-700">
                      <div>
                        <span className="font-semibold">Age:</span> {c.age ?? 'Unknown'}
                      </div>
                      <div>
                        <span className="font-semibold">Last seen:</span>{' '}
                        {c.location || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-semibold">Date reported:</span>{' '}
                        {c.dateReported || c.createdAt.slice(0, 10)}
                      </div>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant={selectedCase?.caseId === c.caseId ? 'default' : 'outline'}
                          className="w-full justify-center text-xs"
                          onClick={() => startReportForCase(c)}
                        >
                          <Camera className="h-3 w-3 mr-1" />
                          {selectedCase?.caseId === c.caseId
                            ? 'Selected for Sighting Report'
                            : 'Report Sighting'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload a Photo to Check for Matches</CardTitle>
            <CardDescription>
              Upload a clear front-facing photo of the person you see. The system will automatically
              compare it against all active missing persons using ArcFace AI. If a match is found
              (similarity ≥ 75%), an alert will be sent to administrators. Your approximate GPS
              location may be used to help responders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCase && (
                <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-md p-2">
                  <span className="font-semibold">Note:</span> You selected case{' '}
                  <span className="font-mono font-semibold">{selectedCase.caseId}</span>{' '}
                  ({selectedCase.name || 'Unknown Name'}), but the system will check against{' '}
                  <span className="font-semibold">all</span> missing persons in the database.
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading || cases.length === 0 || isWebcamActive}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || cases.length === 0 || isWebcamActive}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Processing...' : 'Choose Photo'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (isWebcamActive) {
                      stopWebcam();
                    } else {
                      startWebcam();
                    }
                  }}
                  disabled={isUploading || cases.length === 0}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isWebcamActive ? 'Stop Camera' : 'Use Camera'}
                </Button>
              </div>

              {/* Webcam View */}
              <div className={isWebcamActive ? "border-2 border-blue-300 rounded-lg p-4 bg-blue-50" : "hidden"}>
                <div className="relative">
                  <div className="w-full h-64 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }} // Mirror the video for selfie view
                    />
                    {!isVideoReady && (
                      <div className="absolute text-white text-sm z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                        <div>Starting camera...</div>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-4 space-x-2">
                  <Button 
                    onClick={capturePhoto} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!isVideoReady || isUploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isUploading ? 'Processing...' : 'Capture Photo'}
                  </Button>
                  <Button variant="outline" onClick={stopWebcam} disabled={isUploading}>
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Hidden canvas for webcam capture */}
              <canvas ref={canvasRef} className="hidden" />

              {cases.length === 0 && (
                <div className="text-xs text-gray-500">
                  No active missing persons in the database. Cannot perform matching.
                </div>
              )}

              {isUploading && fileInputRef.current?.files?.[0] && (
                <div className="text-xs text-gray-600 space-y-1 border border-gray-200 rounded p-2 bg-gray-50">
                  <div className="font-semibold">Processing file:</div>
                  <div className="font-mono text-[10px]">
                    <div>📁 {fileInputRef.current.files[0].name}</div>
                    <div>📏 {(fileInputRef.current.files[0].size / 1024).toFixed(2)} KB</div>
                    <div>🏷️ {fileInputRef.current.files[0].type}</div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div>🔄 Processing photo with ArcFace AI...</div>
                    <div>🔍 Generating 512-dimensional face embedding...</div>
                    <div>📊 Comparing against {cases.length} stored missing person embeddings...</div>
                  </div>
                </div>
              )}

                {matchError && (
                  <div className="border border-red-200 bg-red-50 text-red-800 text-xs rounded-md p-3">
                    <div className="font-semibold mb-1">❌ Error:</div>
                    <div>{matchError}</div>
                  </div>
                )}

                {!isUploading && debugInfo?.processResult && debugInfo.processResult.confidence < 0.9 && (
                  <div className="border border-red-300 bg-red-100 text-red-900 text-xs rounded-md p-3">
                    <div className="font-semibold mb-1">⚠️ WARNING: Using MOCK Embeddings!</div>
                    <div className="space-y-1">
                      <div>• The ArcFace model may not be loaded correctly</div>
                      <div>• All images will produce similar embeddings</div>
                      <div>• Check browser console (F12) for model loading errors</div>
                      <div>• Verify /models/arcface.onnx exists in public/models/</div>
                      <div>• Confidence: {debugInfo.processResult.confidence} (expected &gt; 0.9 for real model)</div>
                    </div>
                  </div>
                )}

                {matchMessage && (
                  <div
                    className={`border text-xs rounded-md p-3 flex items-start space-x-2 ${
                      matchMessage.includes('MATCH FOUND')
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : 'border-yellow-200 bg-yellow-50 text-yellow-800'
                    }`}
                  >
                    {matchMessage.includes('MATCH FOUND') ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <pre className="whitespace-pre-wrap font-sans">{matchMessage}</pre>
                    </div>
                  </div>
                )}

                {debugInfo && (
                  <div className="border border-blue-200 bg-blue-50 rounded-md p-3 space-y-3">
                    <div className="text-xs font-semibold text-blue-900">🔍 Debugging Information</div>
                    
                    {debugInfo.fileMetadata && (
                      <div className="text-xs">
                        <div className="font-semibold text-blue-800 mb-1">📁 Processed File:</div>
                        <div className="bg-white rounded p-2 font-mono text-[10px]">
                          <div><strong>Name:</strong> {debugInfo.fileMetadata.name}</div>
                          <div><strong>Type:</strong> {debugInfo.fileMetadata.type}</div>
                          <div><strong>Extension:</strong> {debugInfo.fileMetadata.extension || 'N/A'}</div>
                          <div><strong>Size:</strong> {(debugInfo.fileMetadata.size / 1024).toFixed(2)} KB</div>
                          <div><strong>Last Modified:</strong> {new Date(debugInfo.fileMetadata.lastModified).toLocaleString()}</div>
                          <div><strong>File Hash:</strong> {debugInfo.fileMetadata.hash || 'N/A'}</div>
                        </div>
                      </div>
                    )}
                    
                    {debugInfo.processResult && (
                      <div className="text-xs">
                        <div className="font-semibold text-blue-800 mb-1">Model Status:</div>
                        <div className={`rounded p-2 font-mono text-[10px] ${debugInfo.processResult.confidence >= 0.9 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <div>Confidence: <span className={debugInfo.processResult.confidence >= 0.9 ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{debugInfo.processResult.confidence}</span> {debugInfo.processResult.confidence >= 0.9 ? <span className="text-green-600">✓ Real Model</span> : <span className="text-red-600">✗ Mock (Fallback)</span>}</div>
                          <div>Processing Time: {debugInfo.processResult.processingTime?.toFixed(0) || 'N/A'}ms</div>
                          {debugInfo.processResult.confidence < 0.9 && (
                            <div className="text-red-700 mt-1">⚠️ Using mock embeddings - all images will be similar!</div>
                          )}
                        </div>
                      </div>
                    )}

                    {debugInfo.uploadedEmbedding && (() => {
                      const norm = Math.sqrt(debugInfo.uploadedEmbedding.reduce((sum, v) => sum + v * v, 0));
                      const isNormalized = Math.abs(norm - 1.0) < 0.01;
                      return (
                        <div className="text-xs">
                          <div className="font-semibold text-blue-800 mb-1">Uploaded Photo Embedding:</div>
                          <div className="bg-white rounded p-2 font-mono text-[10px] overflow-x-auto">
                            <div>Dimensions: {debugInfo.uploadedEmbedding.length}</div>
                            <div>Norm: {norm.toFixed(6)} {isNormalized ? <span className="text-green-600">✓ Normalized</span> : <span className="text-red-600">✗ Not normalized (expected ~1.0)</span>}</div>
                            <div>Min: {Math.min(...debugInfo.uploadedEmbedding).toFixed(6)}, Max: {Math.max(...debugInfo.uploadedEmbedding).toFixed(6)}</div>
                            <div>First 20 values: [{debugInfo.uploadedEmbedding.slice(0, 20).map(v => v.toFixed(4)).join(', ')}...]</div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 text-[10px] h-6"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(debugInfo.uploadedEmbedding));
                                alert('Embedding copied to clipboard!');
                              }}
                            >
                              Copy Full Embedding JSON
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {debugInfo.comparisons && debugInfo.comparisons.length > 0 && (
                      <div className="text-xs">
                        <div className="font-semibold text-blue-800 mb-1">All Comparisons (sorted by similarity):</div>
                        <div className="bg-white rounded p-2 space-y-1 max-h-48 overflow-y-auto">
                          {debugInfo.comparisons.map((comp, idx) => {
                            const queryNormOk = Math.abs(comp.norm1 - 1.0) < 0.01;
                            const storedNormOk = Math.abs(comp.norm2 - 1.0) < 0.01;
                            return (
                              <div key={comp.caseId} className="border-b border-gray-200 pb-1 last:border-0">
                                <div className="font-mono text-[10px]">
                                  <div className="font-semibold">{idx + 1}. {comp.name} ({comp.caseId})</div>
                                  <div className="pl-2 text-gray-700">
                                    Cosine Similarity: <span className="font-bold">{comp.similarity.toFixed(6)}</span> ({((comp.similarity) * 100).toFixed(2)}%)
                                  </div>
                                  <div className="pl-2 text-gray-600">
                                    Dot Product: {comp.dotProduct.toFixed(6)}
                                  </div>
                                  <div className="pl-2 text-gray-600">
                                    Query Norm: {comp.norm1.toFixed(6)} {queryNormOk ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>} | 
                                    Stored Norm: {comp.norm2.toFixed(6)} {storedNormOk ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                                  </div>
                                  <div className="pl-2 text-gray-500 text-[9px]">
                                    Formula: cos(θ) = {comp.dotProduct.toFixed(4)} / ({comp.norm1.toFixed(4)} × {comp.norm2.toFixed(4)}) = {comp.similarity.toFixed(6)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-blue-700">
                      💾 Uploaded embedding also stored in browser localStorage as 'last_uploaded_embedding' for cross-checking.
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


