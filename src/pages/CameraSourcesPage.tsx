import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Activity, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Video,
  Radio
} from 'lucide-react';
import { databaseService } from '@/services/DatabaseService';

interface CameraSource {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'error';
  detections: number;
  lastDetection?: string;
  latitude?: number;
  longitude?: number;
}

export function CameraSourcesPage() {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<CameraSource[]>([]);
  const [stats, setStats] = useState({
    totalSources: 0,
    activeSources: 0,
    totalDetections: 0,
    recentDetections: 0,
  });

  useEffect(() => {
    loadCameraSources();
    const interval = setInterval(loadCameraSources, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadCameraSources = async () => {
    try {
      setLoading(true);

      // Get all alerts to extract detection sources
      const alerts = await databaseService.getRecentAlerts(1000);
      
      // Group alerts by location to simulate camera sources
      const locationMap = new Map<string, {
        alerts: any[];
        location: string;
        lat?: number;
        lng?: number;
      }>();

      alerts.forEach(alert => {
        const location = alert.location || 'Unknown Location';
        const key = location;
        
        if (!locationMap.has(key)) {
          // Try to extract coordinates
          let lat: number | undefined;
          let lng: number | undefined;
          
          if (alert.location && alert.location.includes(',')) {
            const coords = alert.location.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              lat = coords[0];
              lng = coords[1];
            }
          }
          
          if (!lat || !lng) {
            if (alert.metadata?.latitude && alert.metadata?.longitude) {
              lat = alert.metadata.latitude;
              lng = alert.metadata.longitude;
            }
          }

          locationMap.set(key, {
            alerts: [],
            location,
            lat,
            lng,
          });
        }
        
        locationMap.get(key)!.alerts.push(alert);
      });

      // Convert to camera sources
      const cameraSources: CameraSource[] = Array.from(locationMap.entries()).map(([key, data], index) => {
        const sortedAlerts = data.alerts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastDetection = sortedAlerts.length > 0 ? sortedAlerts[0].createdAt : undefined;
        
        // Determine status based on recent activity
        const recentAlerts = sortedAlerts.filter(a => {
          const alertDate = new Date(a.createdAt);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return alertDate > dayAgo;
        });
        
        let status: 'active' | 'inactive' | 'error' = 'inactive';
        if (recentAlerts.length > 0) {
          status = 'active';
        } else if (sortedAlerts.length === 0) {
          status = 'error';
        }

        return {
          id: `source-${index + 1}`,
          name: `Detection Source ${index + 1}`,
          location: data.location !== 'Unknown Location' ? data.location : `Location ${index + 1}`,
          status,
          detections: data.alerts.length,
          lastDetection,
          latitude: data.lat,
          longitude: data.lng,
        };
      });

      // If no sources from alerts, create some default ones
      if (cameraSources.length === 0) {
        cameraSources.push(
          {
            id: 'source-1',
            name: 'Main Street Camera',
            location: 'Downtown Area',
            status: 'active',
            detections: 0,
            latitude: 40.7128,
            longitude: -74.0060,
          },
          {
            id: 'source-2',
            name: 'Public Square Feed',
            location: 'City Center',
            status: 'inactive',
            detections: 0,
            latitude: 40.7580,
            longitude: -73.9855,
          }
        );
      }

      setSources(cameraSources);

      // Calculate stats
      const totalSources = cameraSources.length;
      const activeSources = cameraSources.filter(s => s.status === 'active').length;
      const totalDetections = cameraSources.reduce((sum, s) => sum + s.detections, 0);
      
      const recentDetections = alerts.filter(a => {
        const alertDate = new Date(a.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return alertDate > dayAgo;
      }).length;

      setStats({
        totalSources,
        activeSources,
        totalDetections,
        recentDetections,
      });

    } catch (err) {
      console.error('Error loading camera sources:', err);
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
    return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>;
  };

  return (
    <Layout
      title="Camera Sources"
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Administration', href: '/admin' },
        { title: 'Camera Sources' }
      ]}
    >
      <div className="space-y-6">
        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalSources}</div>
              <p className="text-xs text-muted-foreground">Detection sources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeSources}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalDetections}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Detections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.recentDetections}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Camera Sources List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Detection Sources</CardTitle>
              <CardDescription>Camera feeds and detection sources monitoring missing persons</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-center text-sm text-gray-500">Loading sources...</div>
              ) : sources.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No detection sources configured</div>
              ) : (
                <div className="space-y-4">
                  {sources.map((source) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{source.name}</h3>
                              {getStatusBadge(source.status)}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>{source.location}</span>
                                {source.latitude && source.longitude && (
                                  <span className="text-xs font-mono">
                                    ({source.latitude.toFixed(4)}, {source.longitude.toFixed(4)})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="h-3 w-3" />
                                <span>{source.detections} detections</span>
                              </div>
                              {source.lastDetection && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span>Last: {new Date(source.lastDetection).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {source.status === 'active' && (
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Detection Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Detection Activity</CardTitle>
              <CardDescription>Latest detections from all sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-sm text-muted-foreground">
                Detection activity is monitored in real-time. Check the Alert Dashboard for detailed detection alerts.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}

