import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Video, 
  Eye, 
  AlertTriangle, 
  Clock,
  Download,
  Trash2,
  Play
} from 'lucide-react';

interface DetectionResult {
  id: string;
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
  confidence?: number;
  detectedPersons?: number;
  timestamp: string;
  resultUrl?: string;
}

export function DetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
    } else {
      alert('Please select a valid video file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleUpload = () => {
    if (!file) return;

    setIsProcessing(true);
    
    // Simulate processing
    const newResult: DetectionResult = {
      id: Date.now().toString(),
      fileName: file.name,
      status: 'processing',
      timestamp: new Date().toLocaleString(),
    };

    setDetectionResults(prev => [newResult, ...prev]);

    // Simulate API call delay
    setTimeout(() => {
      setDetectionResults(prev => 
        prev.map(result => 
          result.id === newResult.id 
            ? { 
                ...result, 
                status: 'completed',
                confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
                detectedPersons: Math.floor(Math.random() * 5) + 1,
                resultUrl: '#'
              }
            : result
        )
      );
      setIsProcessing(false);
      setFile(null);
    }, 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout 
      title="Video Detection" 
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Video Detection' }
      ]}
    >
      <div className="space-y-6">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Upload Video for Detection
              </CardTitle>
              <CardDescription>
                Upload a video file to run AI detection and identify missing persons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drag and drop your video file here
                  </p>
                  <p className="text-gray-500 mb-4">
                    or click to browse files
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </div>

                {/* Selected File */}
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Video className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleUpload}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start Detection
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setFile(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detection Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Detection Results</CardTitle>
              <CardDescription>
                View the results of your video detection analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectionResults.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No detections yet</h3>
                  <p className="text-gray-500">
                    Upload a video to see detection results here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {detectionResults.map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Video className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{result.fileName}</p>
                          <p className="text-sm text-gray-500">{result.timestamp}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {getStatusBadge(result.status)}
                        
                        {result.status === 'completed' && (
                          <>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {result.confidence}% confidence
                              </p>
                              <Progress value={result.confidence} className="w-20 h-2 mt-1" />
                            </div>
                            <Badge variant="secondary">
                              {result.detectedPersons} persons
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Report
                            </Button>
                          </>
                        )}
                        
                        {result.status === 'processing' && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Processing...</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Detection Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Supported Formats</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• MP4 (recommended)</li>
                    <li>• AVI</li>
                    <li>• MOV</li>
                    <li>• WMV</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Maximum file size: 100MB</li>
                    <li>• Minimum duration: 5 seconds</li>
                    <li>• Maximum duration: 10 minutes</li>
                    <li>• Good lighting conditions recommended</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}