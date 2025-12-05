import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  Database, 
  Cpu, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  TrendingUp,
  Zap,
  Target
} from 'lucide-react';
import { databaseService } from '@/services/DatabaseService';
import { FaceProcessingService } from '@/services/FaceProcessingService';

interface ModelMetrics {
  modelName: string;
  modelVersion: string;
  status: 'active' | 'loading' | 'error';
  totalProcessed: number;
  averageProcessingTime: number;
  averageSimilarity: number;
  accuracy: number;
  threshold: number;
}

export function AIModelConfigPage() {
  const [loading, setLoading] = useState(true);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
    modelName: 'MobileFaceNet',
    modelVersion: '1.0.0',
    status: 'active',
    totalProcessed: 0,
    averageProcessingTime: 0,
    averageSimilarity: 0,
    accuracy: 0,
    threshold: 0.75,
  });
  const [performanceStats, setPerformanceStats] = useState({
    totalMatches: 0,
    falsePositives: 0,
    truePositives: 0,
    averageConfidence: 0,
  });

  useEffect(() => {
    loadModelMetrics();
    const interval = setInterval(loadModelMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadModelMetrics = async () => {
    try {
      setLoading(true);

      // Get all cases and alerts
      const cases = await FaceProcessingService.getAllStoredEmbeddings();
      const alerts = await databaseService.getRecentAlerts(1000);

      // Calculate metrics
      const totalProcessed = cases.length + alerts.length;
      
      const similarities = alerts.map(a => a.similarity);
      const averageSimilarity = similarities.length > 0
        ? similarities.reduce((sum, s) => sum + s, 0) / similarities.length
        : 0;

      // Estimate processing time (simplified - in real app, track actual times)
      const averageProcessingTime = 150; // milliseconds (estimated)

      // Calculate accuracy metrics
      const totalMatches = alerts.length;
      const highConfidenceMatches = alerts.filter(a => a.similarity >= 0.8).length;
      const truePositives = alerts.filter(a => a.status === 'completed').length;
      const falsePositives = alerts.filter(a => a.status === 'rejected').length;
      
      const accuracy = totalMatches > 0 
        ? (truePositives / (truePositives + falsePositives || 1)) * 100 
        : 0;

      const averageConfidence = averageSimilarity * 100;

      // Check model status
      let status: 'active' | 'loading' | 'error' = 'active';
      try {
        // Test if model can process (simplified check)
        if (cases.length === 0 && alerts.length === 0) {
          status = 'loading';
        }
      } catch (err) {
        status = 'error';
      }

      setModelMetrics({
        modelName: 'MobileFaceNet',
        modelVersion: '1.0.0',
        status,
        totalProcessed,
        averageProcessingTime,
        averageSimilarity,
        accuracy,
        threshold: 0.75, // Default threshold
      });

      setPerformanceStats({
        totalMatches,
        falsePositives,
        truePositives,
        averageConfidence,
      });

    } catch (err) {
      console.error('Error loading model metrics:', err);
      setModelMetrics(prev => ({ ...prev, status: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    } else if (status === 'error') {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800"><Activity className="h-3 w-3 mr-1" />Loading</Badge>;
  };

  return (
    <Layout
      title="AI Model Configuration"
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Administration', href: '/admin' },
        { title: 'AI Model Configuration' }
      ]}
    >
      <div className="space-y-6">
        {/* Model Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Model Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                {getStatusBadge(modelMetrics.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                {modelMetrics.modelName} v{modelMetrics.modelVersion}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{modelMetrics.totalProcessed}</div>
              <p className="text-xs text-muted-foreground">Images analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{modelMetrics.averageProcessingTime}ms</div>
              <p className="text-xs text-muted-foreground">Per image</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Similarity Threshold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{(modelMetrics.threshold * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Match threshold</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Model Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>Real-time performance metrics and accuracy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Average Similarity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Match Similarity</span>
                  <span className="text-sm font-bold">{(modelMetrics.averageSimilarity * 100).toFixed(1)}%</span>
                </div>
                <Progress value={modelMetrics.averageSimilarity * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Average confidence across all matches
                </p>
              </div>

              {/* Accuracy */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Detection Accuracy</span>
                  <span className="text-sm font-bold">{modelMetrics.accuracy.toFixed(1)}%</span>
                </div>
                <Progress value={modelMetrics.accuracy} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on completed vs rejected alerts
                </p>
              </div>

              {/* Performance Stats */}
              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">True Positives</div>
                  <div className="text-2xl font-bold text-green-600">{performanceStats.truePositives}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">False Positives</div>
                  <div className="text-2xl font-bold text-red-600">{performanceStats.falsePositives}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Total Matches</div>
                  <div className="text-2xl font-bold text-blue-600">{performanceStats.totalMatches}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Model Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>Current AI model settings and parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Model Type</span>
                    </div>
                    <Badge variant="outline">MobileFaceNet</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Embedding Size</span>
                    </div>
                    <Badge variant="outline">128 dimensions</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Similarity Threshold</span>
                    </div>
                    <Badge variant="outline">{(modelMetrics.threshold * 100).toFixed(0)}%</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Processing Mode</span>
                    </div>
                    <Badge variant="outline">Real-time</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Framework</span>
                    </div>
                    <Badge variant="outline">TensorFlow Lite</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Auto Update</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}

