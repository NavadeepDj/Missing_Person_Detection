import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Copy, Eye, EyeOff, Database, Brain, Clock, Hash } from 'lucide-react';

interface ProcessedPhoto {
  url: string;
  embedding?: number[];
  confidence?: number;
  processingTime?: number;
  caseId?: string;
  embeddingId?: string;
  faceDetected?: boolean;
}

interface FaceEmbeddingModalProps {
  photo: ProcessedPhoto;
  isOpen: boolean;
  onClose: () => void;
}

export function FaceEmbeddingModal({ photo, isOpen, onClose }: FaceEmbeddingModalProps) {
  const [showFullEmbedding, setShowFullEmbedding] = useState(false);
  const [copiedText, setCopiedText] = useState<string>('');

  if (!isOpen || !photo) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const formatEmbeddingValue = (value: number) => {
    return value.toFixed(6);
  };

  const getEmbeddingStats = () => {
    if (!photo.embedding) return null;

    const embedding = photo.embedding;
    const min = Math.min(...embedding);
    const max = Math.max(...embedding);
    const avg = embedding.reduce((sum, val) => sum + val, 0) / embedding.length;

    return { min, max, avg };
  };

  const stats = getEmbeddingStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Face Embedding Details</h2>
              <p className="text-sm text-gray-600">128-dimensional facial recognition vector</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Photo Preview */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-gray-600" />
                  <span>Original Photo</span>
                </h3>
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={photo.url}
                    alt="Face photo"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {photo.confidence ? `${(photo.confidence * 100).toFixed(1)}% Confidence` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Processing Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span>Processing Information</span>
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Case ID</div>
                      <div className="font-mono text-sm font-medium text-blue-800 truncate" title={photo.caseId}>
                        {photo.caseId || 'N/A'}
                      </div>
                      {photo.caseId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 text-xs"
                          onClick={() => copyToClipboard(photo.caseId!, 'caseId')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedText === 'caseId' ? 'Copied!' : 'Copy'}
                        </Button>
                      )}
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Embedding ID</div>
                      <div className="font-mono text-sm font-medium text-purple-800 truncate" title={photo.embeddingId}>
                        {photo.embeddingId || 'N/A'}
                      </div>
                      {photo.embeddingId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 text-xs"
                          onClick={() => copyToClipboard(photo.embeddingId!, 'embeddingId')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedText === 'embeddingId' ? 'Copied!' : 'Copy'}
                        </Button>
                      )}
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Confidence</div>
                      <div className="text-lg font-bold text-green-800">
                        {photo.confidence ? `${(photo.confidence * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Processing Time</div>
                      <div className="text-lg font-bold text-orange-800">
                        {photo.processingTime ? `${photo.processingTime.toFixed(0)}ms` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Storage Location */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Storage Location</span>
                    </div>
                    <Badge variant={photo.embeddingId?.startsWith('local_') ? 'secondary' : 'default'}>
                      {photo.embeddingId?.startsWith('local_') ? 'Local Browser Storage' : 'Supabase Database'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedding Statistics */}
            {stats && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Hash className="h-5 w-5 text-gray-600" />
                  <span>Embedding Statistics</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatEmbeddingValue(stats.min)}
                    </div>
                    <div className="text-sm text-gray-600">Minimum Value</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatEmbeddingValue(stats.max)}
                    </div>
                    <div className="text-sm text-gray-600">Maximum Value</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatEmbeddingValue(stats.avg)}
                    </div>
                    <div className="text-sm text-gray-600">Average Value</div>
                  </div>
                </div>
              </div>
            )}

            {/* Embedding Values */}
            {photo.embedding && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Database className="h-5 w-5 text-gray-600" />
                    <span>128-Dimensional Embedding Vector</span>
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullEmbedding(!showFullEmbedding)}
                  >
                    {showFullEmbedding ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showFullEmbedding ? 'Show Less' : 'Show All'}
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-xs font-mono">
                    {photo.embedding.slice(0, showFullEmbedding ? 128 : 32).map((value, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-center ${
                          value > 0.5 ? 'bg-blue-100 text-blue-900' :
                          value < -0.5 ? 'bg-red-100 text-red-900' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {formatEmbeddingValue(value)}
                      </div>
                    ))}
                  </div>

                  {!showFullEmbedding && photo.embedding.length > 32 && (
                    <div className="text-center mt-3 text-sm text-gray-600">
                      Showing 32 of 128 values - Click "Show All" to view complete vector
                    </div>
                  )}

                  {/* Copy Full Embedding */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        JSON.stringify(photo.embedding),
                        'embedding'
                      )}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedText === 'embedding' ? 'Embedding Copied!' : 'Copy Full Embedding'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Brain className="h-5 w-5 text-gray-600" />
                <span>Technical Details</span>
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium ml-2">MobileFaceNet + Face Detection</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium ml-2">128D Float Array</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Normalization:</span>
                    <span className="font-medium ml-2">L2 Normalized</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Similarity:</span>
                    <span className="font-medium ml-2">Cosine Similarity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}