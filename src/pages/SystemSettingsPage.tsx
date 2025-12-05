import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Database, 
  Server, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Cpu,
  Network
} from 'lucide-react';
import { databaseService } from '@/services/DatabaseService';
import { FaceProcessingService } from '@/services/FaceProcessingService';

interface SystemStats {
  totalCases: number;
  totalAlerts: number;
  activeCases: number;
  pendingAlerts: number;
  databaseStatus: 'online' | 'offline' | 'error';
  storageUsed: number;
  averageSimilarity: number;
  casesWithGPS: number;
}

export function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalCases: 0,
    totalAlerts: 0,
    activeCases: 0,
    pendingAlerts: 0,
    databaseStatus: 'online',
    storageUsed: 0,
    averageSimilarity: 0,
    casesWithGPS: 0,
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemStats();
    const interval = setInterval(() => {
      loadSystemStats();
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);

      // Test database connection
      let dbStatus: 'online' | 'offline' | 'error' = 'online';
      try {
        await databaseService.getRecentAlerts(1);
        dbStatus = 'online';
      } catch (err) {
        dbStatus = 'error';
        console.error('Database connection error:', err);
      }

      // Fetch all cases
      const cases = await FaceProcessingService.getAllStoredEmbeddings();
      
      // Fetch all alerts
      const alerts = await databaseService.getRecentAlerts(1000);

      // Calculate statistics
      const totalCases = cases.length;
      const activeCases = cases.filter(c => {
        const status = c.metadata?.status || 'active';
        return status === 'active';
      }).length;

      const totalAlerts = alerts.length;
      const pendingAlerts = alerts.filter(a => a.status === 'pending').length;

      const similarities = alerts.map(a => a.similarity);
      const averageSimilarity = similarities.length > 0
        ? similarities.reduce((sum, s) => sum + s, 0) / similarities.length
        : 0;

      const casesWithGPS = cases.filter(c => {
        const location = c.metadata?.location || '';
        if (typeof location === 'string' && location.includes(',')) {
          const coords = location.split(',').map(Number);
          return coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]);
        }
        return false;
      }).length;

      // Estimate storage (simplified - in real app, get actual DB size)
      const estimatedStorageMB = (totalCases * 0.5) + (totalAlerts * 0.1); // Rough estimate

      setStats({
        totalCases,
        totalAlerts,
        activeCases,
        pendingAlerts,
        databaseStatus: dbStatus,
        storageUsed: estimatedStorageMB,
        averageSimilarity,
        casesWithGPS,
      });

    } catch (err) {
      console.error('Error loading system stats:', err);
      setStats(prev => ({ ...prev, databaseStatus: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSystemStats();
    setLastRefresh(new Date());
  };

  const getStatusBadge = (status: string) => {
    if (status === 'online') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Online</Badge>;
    } else if (status === 'error') {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Offline</Badge>;
  };

  return (
    <Layout
      title="System Settings"
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Administration', href: '/admin' },
        { title: 'System Settings' }
      ]}
    >
      <div className="space-y-6">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Database Status
                <Button variant="ghost" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                {getStatusBadge(stats.databaseStatus)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalCases}</div>
              <p className="text-xs text-muted-foreground">{stats.activeCases} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingAlerts} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.storageUsed.toFixed(1)} MB</div>
              <p className="text-xs text-muted-foreground">Estimated</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>Real-time system performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Average Similarity Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Match Similarity</span>
                  <span className="text-sm font-bold">{(stats.averageSimilarity * 100).toFixed(1)}%</span>
                </div>
                <Progress value={stats.averageSimilarity * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Average similarity across all alerts
                </p>
              </div>

              {/* GPS Coverage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">GPS Location Coverage</span>
                  <span className="text-sm font-bold">
                    {stats.totalCases > 0 
                      ? ((stats.casesWithGPS / stats.totalCases) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats.totalCases > 0 ? (stats.casesWithGPS / stats.totalCases) * 100 : 0} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.casesWithGPS} of {stats.totalCases} cases have GPS coordinates
                </p>
              </div>

              {/* Active Cases Ratio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Cases Ratio</span>
                  <span className="text-sm font-bold">
                    {stats.totalCases > 0 
                      ? ((stats.activeCases / stats.totalCases) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats.totalCases > 0 ? (stats.activeCases / stats.totalCases) * 100 : 0} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeCases} active out of {stats.totalCases} total cases
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Configuration and environment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Database</span>
                    </div>
                    <Badge variant="outline">Supabase</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">API Status</span>
                    </div>
                    {getStatusBadge(stats.databaseStatus)}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Auto Refresh</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled (30s)</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Storage Type</span>
                    </div>
                    <Badge variant="outline">Cloud</Badge>
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

