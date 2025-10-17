// Enhanced photo upload component with webcam support and real AI processing
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Camera, CheckCircle, AlertCircle, Brain, Database, Search } from 'lucide-react';
import { FaceProcessingService } from '@/services/FaceProcessingService';
import { FaceEmbeddingModal } from './FaceEmbeddingModal';
import { SupabaseTest } from '@/utils/SupabaseTest';

interface SimplePhotoUploadProps {
  onPhotoSelect: (photoUrl: string, aiProcessed?: boolean) => void;
  maxPhotos?: number;
}

interface ProcessedPhoto {
  url: string;
  embedding?: number[];
  confidence?: number;
  processingTime?: number;
  caseId?: string;
  embeddingId?: string;
  faceDetected?: boolean;
}

export function SimplePhotoUpload({ onPhotoSelect, maxPhotos = 3 }: SimplePhotoUploadProps) {
  const [photos, setPhotos] = useState<ProcessedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingStage, setProcessingStage] = useState<'detection' | 'embedding' | 'storage' | 'complete' | 'error'>('detection');
  const [aiStats, setAiStats] = useState<{
    totalProcessed: number;
    facesDetected: number;
    averageConfidence: number;
    databaseConnected: boolean;
  }>({
    totalProcessed: 0,
    facesDetected: 0,
    averageConfidence: 0,
    databaseConnected: false
  });

  const [selectedPhoto, setSelectedPhoto] = useState<ProcessedPhoto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [pendingStream, setPendingStream] = useState<MediaStream | null>(null);

  // Initialize AI services on component mount
  useEffect(() => {
    // Clear any potentially stale photos on mount
    setPhotos([]);
    
    const initializeAI = async () => {
      try {
        console.log('🧠 Initializing AI services...');
        const initialized = await FaceProcessingService.initializeServices();
        if (initialized) {
          console.log('✅ AI services initialized successfully');
          setAiStats(prev => ({ ...prev, databaseConnected: true }));
        } else {
          console.error('❌ Failed to initialize AI services');
          setAiStats(prev => ({ ...prev, databaseConnected: false }));
        }
      } catch (error) {
        console.error('❌ Error initializing AI services:', error);
        setAiStats(prev => ({ ...prev, databaseConnected: false }));
      }
    };

    initializeAI();
  }, []);

  // Handle pending stream when video ref becomes available
  useEffect(() => {
    if (videoRef.current && pendingStream) {
      console.log('🔄 Video ref now available, attaching pending stream...');
      attachStreamToVideo(pendingStream);
      setPendingStream(null);
    }
  }, [pendingStream]);

  const attachStreamToVideo = (stream: MediaStream) => {
    if (!videoRef.current) {
      console.error('❌ Video ref is still null when trying to attach stream');
      return;
    }

    videoRef.current.srcObject = stream;
    console.log('🎬 Video source set to stream');

    // Wait for video to be ready
    videoRef.current.onloadedmetadata = () => {
      console.log('📺 Video metadata loaded');
      if (videoRef.current) {
        videoRef.current.play().then(() => {
          console.log('▶️ Video playing successfully');
          setIsWebcamActive(true);
          console.log('🎉 Webcam started successfully - isWebcamActive set to true');
        }).catch((playError) => {
          console.error('❌ Error playing video:', playError);
          alert('Unable to start video stream. Please try again.');
        });
      }
    };

    // Add error handler for video element
    videoRef.current.onerror = (videoError) => {
      console.error('❌ Video element error:', videoError);
      alert('Video stream error occurred. Please try again.');
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simple validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoUrl = e.target?.result as string;
      
      // Don't add to photos array yet - let processPhotoWithAI handle it
      await processPhotoWithAI(photoUrl);
    };
    reader.readAsDataURL(file);
  };

  // Webcam capture functionality
  const startWebcam = async () => {
    try {
      console.log('📷 Starting webcam...');
      console.log('🔍 Checking browser support...');

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      console.log('🎥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      console.log('✅ Camera access granted, checking video element...');
      console.log('📹 Video element ref:', videoRef.current);

      if (videoRef.current) {
        // Video ref is available, attach stream directly
        console.log('🎯 Video ref available, attaching stream directly...');
        attachStreamToVideo(stream);
      } else {
        // Video ref not ready yet, store stream for later
        console.log('⏳ Video ref not ready, storing stream as pending...');
        setPendingStream(stream);
      }
    } catch (error) {
      console.error('❌ Error accessing webcam:', error);
      if (error instanceof Error) {
        console.error('🔍 Error details:', {
          name: error.name,
          message: error.message
        });

        if (error.name === 'NotAllowedError') {
          alert('Camera permission denied. Please allow camera access to use this feature.\n\nTo fix:\n1. Click the camera icon 📷 in your browser address bar\n2. Select "Allow" for camera access\n3. Refresh the page and try again');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found. Please:\n1. Connect a camera to your device\n2. Ensure it\'s not being used by another application\n3. Try again');
        } else if (error.name === 'NotReadableError') {
          alert('Camera is already in use by another application. Please close other apps using the camera and try again.');
        } else if (error.message === 'Camera API not supported in this browser') {
          alert('Camera access is not supported in this browser. Please try using Chrome, Firefox, or Edge.');
        } else {
          alert(`Unable to access webcam: ${error.message}\n\nPlease check:\n• Camera permissions are granted\n• Camera is not in use by other apps\n• Browser supports camera access`);
        }
      }
    }
  };

  const stopWebcam = () => {
    console.log('🛑 Stopping webcam...');

    // Stop active video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      console.log('✅ Video stream stopped');
    }

    // Stop pending stream if exists
    if (pendingStream) {
      pendingStream.getTracks().forEach(track => track.stop());
      setPendingStream(null);
      console.log('✅ Pending stream stopped');
    }

    setIsWebcamActive(false);
    console.log('🎉 Webcam stopped - isWebcamActive set to false');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        const photoUrl = canvasRef.current.toDataURL('image/jpeg');
        
        // Stop webcam after capture
        stopWebcam();

        // Trigger AI processing - let it handle adding to photos array
        processPhotoWithAI(photoUrl);
      }
    }
  };

  // Real AI Processing with face detection and embedding generation
  const processPhotoWithAI = async (photoUrl: string) => {
    // Validate photoUrl before processing
    if (!photoUrl || !photoUrl.startsWith('data:image/')) {
      console.error('❌ Invalid photo URL provided:', photoUrl);
      return;
    }

    setIsProcessing(true);
    setProcessingStage('detection');
    setProcessingStatus('🔍 Detecting faces in photo...');

    try {
      // Generate unique case ID for this photo
      const caseId = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      console.log('🚀 Starting real AI processing for case:', caseId);

      // Process image using real AI services
      setProcessingStatus('🔍 Detecting faces and generating embeddings...');
      setProcessingStage('embedding');

      const result = await FaceProcessingService.processAndStoreFaceEmbedding(photoUrl, caseId);

      if (result.success) {
        // Update AI statistics
        setAiStats(prev => ({
          ...prev,
          totalProcessed: prev.totalProcessed + 1,
          facesDetected: prev.facesDetected + 1,
          averageConfidence: ((prev.averageConfidence * prev.totalProcessed) + (result.confidence || 0)) / (prev.totalProcessed + 1)
        }));

        setProcessingStage('complete');
        setProcessingStatus('✅ Face embedding generated and stored in database!');

        // Add processed photo to state
        const processedPhoto: ProcessedPhoto = {
          url: photoUrl,
          caseId: result.caseId,
          embeddingId: result.embeddingId,
          confidence: result.confidence,
          processingTime: result.processingTime,
          faceDetected: true
        };

        setPhotos(prev => [...prev, processedPhoto]);

        console.log('🎉 AI processing completed successfully', {
          caseId: result.caseId,
          embeddingId: result.embeddingId,
          confidence: result.confidence,
          processingTime: result.processingTime,
          databaseStorageTime: result.databaseStorageTime
        });

        // Pass to parent with AI processed flag
        onPhotoSelect(photoUrl, true);
      } else {
        throw new Error(result.error || 'AI processing failed');
      }
    } catch (error) {
      console.error('❌ Error in AI processing:', error);
      setProcessingStage('error');
      setProcessingStatus(`❌ Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Don't add failed photos to the gallery - just show error message
      // User can try uploading again
      console.log('⚠️ Photo not added to gallery due to processing failure');
    } finally {
      // Reset processing state after a delay
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStatus('');
        setProcessingStage('detection');
      }, 2000);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const testSupabaseConnection = async () => {
    console.log('🔍 Testing Supabase connection...');
    try {
      const result = await SupabaseTest.testConnection();
      console.log('Connection test result:', result);

      if (result.success) {
        alert('✅ Supabase connection successful!\n\nDetails: ' + JSON.stringify(result.details, null, 2));
      } else {
        alert('❌ Supabase connection failed!\n\nError: ' + result.error + '\n\nDetails: ' + JSON.stringify(result.details, null, 2));
      }
    } catch (error) {
      console.error('Test failed:', error);
      alert('❌ Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <span>AI-Powered Face Recognition</span>
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= maxPhotos || isProcessing || isWebcamActive}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🎯 Camera button clicked!', {
                    isWebcamActive,
                    photosLength: photos.length,
                    maxPhotos,
                    isProcessing
                  });

                  if (isWebcamActive) {
                    console.log('🛑 Stopping webcam...');
                    stopWebcam();
                  } else {
                    console.log('🚀 Starting webcam...');
                    startWebcam();
                  }
                }}
                disabled={photos.length >= maxPhotos || isProcessing}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isWebcamActive ? 'Stop' : 'Camera'}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Hidden canvas for webcam capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Webcam View - single video element, conditionally displayed */}
          {isWebcamActive && (
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="relative">
                <div className="w-full h-64 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror-video"
                  />
                </div>
                <div className="absolute top-2 right-2">
                  <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">LIVE</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-4 space-x-2">
                <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
                <Button variant="outline" onClick={stopWebcam}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Keep video element mounted but hidden when not in use */}
          {!isWebcamActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ display: 'none' }}
            />
          )}

          {/* AI Processing Status */}
          {isProcessing && (
            <div className={`border-2 rounded-lg p-4 ${
              processingStage === 'error'
                ? 'border-red-300 bg-red-50'
                : processingStage === 'complete'
                ? 'border-green-300 bg-green-50'
                : 'border-blue-300 bg-blue-50'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                {processingStage === 'detection' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800 font-medium">{processingStatus}</span>
                  </>
                )}
                {processingStage === 'embedding' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-800 font-medium">{processingStatus}</span>
                  </>
                )}
                {processingStage === 'complete' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Database className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 font-medium">{processingStatus}</span>
                  </>
                )}
                {processingStage === 'error' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 font-medium">{processingStatus}</span>
                  </>
                )}
              </div>

              {/* Processing Stage Indicators */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    processingStage === 'detection' ? 'bg-blue-600 animate-pulse' :
                    ['embedding', 'complete'].includes(processingStage) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={processingStage === 'detection' ? 'text-blue-800 font-medium' : 'text-gray-600'}>
                    Face Detection
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    processingStage === 'embedding' ? 'bg-purple-600 animate-pulse' :
                    processingStage === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={processingStage === 'embedding' ? 'text-purple-800 font-medium' : 'text-gray-600'}>
                    Embedding Generation
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    processingStage === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={processingStage === 'complete' ? 'text-green-800 font-medium' : 'text-gray-600'}>
                    Database Storage
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    processingStage === 'error' ? 'bg-red-500' :
                    processingStage === 'complete' ? 'bg-green-500' :
                    processingStage === 'embedding' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}
                  style={{
                    width: processingStage === 'detection' ? '33%' :
                           processingStage === 'embedding' ? '66%' :
                           processingStage === 'complete' ? '100%' : '33%'
                  }}
                ></div>
              </div>
            </div>
          )}

          {photos.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No photos captured yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload photos or use webcam to capture clear front-facing images
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <img
                      src={photo.url}
                      alt={`Face photo ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />

                    {/* Photo Info Overlay */}
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {photo.faceDetected ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-700">Face Detected</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-medium text-red-700">Processing Failed</span>
                            </>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePhoto(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* AI Processing Details */}
                      {photo.faceDetected && (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium text-gray-900">
                              {photo.confidence ? `${(photo.confidence * 100).toFixed(1)}%` : 'N/A'}
                            </span>
                          </div>

                          {photo.caseId && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Case ID:</span>
                              <span className="font-medium text-blue-600 text-xs truncate max-w-[100px]" title={photo.caseId}>
                                {photo.caseId}
                              </span>
                            </div>
                          )}

                          {photo.processingTime && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Processing:</span>
                              <span className="font-medium text-gray-900">
                                {photo.processingTime.toFixed(0)}ms
                              </span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs h-6"
                              onClick={() => {
                                navigator.clipboard.writeText(photo.caseId || '');
                                // You could add a toast notification here
                              }}
                            >
                              <Database className="h-3 w-3 mr-1" />
                              Copy ID
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs h-6"
                              onClick={() => {
                                setSelectedPhoto(photo);
                                setIsModalOpen(true);
                              }}
                            >
                              <Search className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <div className="space-y-4">
              {/* AI Statistics */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-900 text-sm">AI Processing Statistics</h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{aiStats.totalProcessed}</div>
                    <div className="text-gray-600">Photos Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{aiStats.facesDetected}</div>
                    <div className="text-gray-600">Faces Detected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {aiStats.averageConfidence > 0 ? `${(aiStats.averageConfidence * 100).toFixed(0)}%` : 'N/A'}
                    </div>
                    <div className="text-gray-600">Avg Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${aiStats.databaseConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {aiStats.databaseConnected ? '✓' : '✗'}
                    </div>
                    <div className="text-gray-600">Database</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-blue-700">
                    <Database className="h-3 w-3 inline mr-1" />
                    Embeddings stored in Supabase for real-time matching
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={async () => {
                      try {
                        const stats = await FaceProcessingService.getDatabaseStatistics();
                        console.log('Database Statistics:', stats);
                        alert(`Database Stats:\nTotal Embeddings: ${stats.totalEmbeddings}\nStorage Used: ~${(stats.storageUsed / 1024).toFixed(2)} KB`);
                      } catch (error) {
                        console.error('Error getting database stats:', error);
                        alert('Error: Could not fetch database statistics');
                      }
                    }}
                  >
                    View DB Stats
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 ml-2"
                    onClick={testSupabaseConnection}
                  >
                    Test Supabase
                  </Button>
                </div>
              </div>

              {/* Processing Summary */}
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>✅ AI Processing Complete!</strong>
                    <p className="text-xs mt-1">
                      {aiStats.facesDetected} face(s) detected and {aiStats.totalProcessed} 128-dimensional embeddings generated.
                      Ready for real-time facial recognition matching.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Face Embedding Details Modal */}
      <FaceEmbeddingModal
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPhoto(null);
        }}
      />
    </Card>
  );
}