// Photo upload component with face detection and embedding generation
import React, { useState, useCallback, useRef } from 'react';
import { Upload, Camera, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FaceDetectionService, type DetectedFace } from '@/services/faceRecognition/FaceDetectionService';
import { EmbeddingService, type EmbeddingResult } from '@/services/faceRecognition/EmbeddingService';
import type { FacePhoto } from '@/types';

interface FacePhotoUploadProps {
  personId: string;
  onPhotoAdd: (photo: FacePhoto) => void;
  className?: string;
}

export function FacePhotoUpload({
  personId,
  onPhotoAdd,
  className
}: FacePhotoUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [embeddingResult, setEmbeddingResult] = useState<EmbeddingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Read and display the image
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedPhoto(imageUrl);
        setUploadProgress(20);

        // Create ImageData from the image
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            // Resize image to reasonable dimensions for processing
            const maxSize = 800;
            let { width, height } = img;

            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            setUploadProgress(40);

            // Detect faces in the image
            const detectionResult = await FaceDetectionService.detectFaces(imageData);
            setUploadProgress(60);

            if (detectionResult && detectionResult.faces.length > 0) {
              setDetectedFaces(detectionResult.faces);

              // Generate embedding for the first detected face
              const firstFace = detectionResult.faces[0];
              const embeddingResult = await EmbeddingService.generateEmbedding(firstFace.imageData);
              setUploadProgress(80);

              if (embeddingResult) {
                setEmbeddingResult(embeddingResult);
                setUploadProgress(100);

                // Create FacePhoto object
                const facePhoto: FacePhoto = {
                  id: crypto.randomUUID(),
                  personId,
                  photoUrl: imageUrl,
                  embedding: embeddingResult.embedding,
                  confidence: embeddingResult.confidence,
                  createdAt: new Date().toISOString()
                };

                onPhotoAdd(facePhoto);
                console.log('✅ Face photo processed successfully');
              } else {
                setError('Failed to generate face embedding');
              }
            } else {
              setError('No face detected in the image. Please upload a clear photo with a visible face.');
            }
          } catch (processingError) {
            console.error('Processing error:', processingError);
            setError('Failed to process image. Please try again.');
          } finally {
            setIsProcessing(false);
          }
        };

        img.src = imageUrl;
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image');
      setIsProcessing(false);
    }
  }, [personId, onPhotoAdd]);

  const handleCameraCapture = useCallback(() => {
    // For now, trigger file input with camera capture
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const resetUpload = useCallback(() => {
    setSelectedPhoto(null);
    setDetectedFaces([]);
    setEmbeddingResult(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={className}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isProcessing
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          {isProcessing ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-800">Processing photo...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-blue-600">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <Upload className="h-12 w-12 text-gray-400" />
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Upload Face Photo
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop or click to select a photo
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG up to 10MB. Clear front-facing photos work best.
                </p>
              </div>
              <div className="flex justify-center space-x-2">
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <Button variant="outline" size="sm" onClick={handleCameraCapture}>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Alert */}
      {error && (
        <Alert className="mt-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Preview and Results */}
      {selectedPhoto && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Photo Analysis</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo Preview */}
              <div>
                <h4 className="text-sm font-medium mb-2">Uploaded Photo</h4>
                <div className="relative">
                  <img
                    src={selectedPhoto}
                    alt="Uploaded"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {detectedFaces.length > 0 && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        {detectedFaces.length} Face{detectedFaces.length > 1 ? 's' : ''} Detected
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Results */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">AI Analysis Results</h4>

                  {detectedFaces.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700">
                          Face detected successfully
                        </span>
                      </div>

                      {embeddingResult && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Embedding Generated:</span>
                            <span className="font-medium">{embeddingResult.embedding.length} dimensions</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium">{(embeddingResult.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Processing Time:</span>
                            <span className="font-medium">{embeddingResult.processingTime.toFixed(2)}ms</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-700">
                        Processing face detection...
                      </span>
                    </div>
                  )}
                </div>

                {detectedFaces.map((face, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Face {index + 1} Confidence:</span>
                      <span className="font-medium">{(face.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Position: ({face.boundingBox.x.toFixed(0)}, {face.boundingBox.y.toFixed(0)})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}