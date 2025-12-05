import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Shield, 
  Settings, 
  Database, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Server,
  Camera,
  UserCheck,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/services/DatabaseService';
import { FaceProcessingService } from '@/services/FaceProcessingService';

export function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    totalAlerts: 0,
    pendingAlerts: 0,
    assignedAlerts: 0,
    completedAlerts: 0,
    averageSimilarity: 0,
    casesWithGPS: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [recentCases, setRecentCases] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all cases
      const cases = await FaceProcessingService.getAllStoredEmbeddings();
      
      // Fetch all alerts
      const alerts = await databaseService.getRecentAlerts(100);

      // Calculate statistics
      const totalCases = cases.length;
      const activeCases = cases.filter(c => {
        const status = c.metadata?.status || 'active';
        return status === 'active';
      }).length;

      const totalAlerts = alerts.length;
      const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
      const assignedAlerts = alerts.filter(a => a.status === 'assigned').length;
      const completedAlerts = alerts.filter(a => a.status === 'completed').length;

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

      setStats({
        totalCases,
        activeCases,
        totalAlerts,
        pendingAlerts,
        assignedAlerts,
        completedAlerts,
        averageSimilarity,
        casesWithGPS,
      });

      // Recent alerts (last 5)
      const recentAlertsData = alerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setRecentAlerts(recentAlertsData);

      // Recent cases (last 5)
      const recentCasesData = cases
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(c => ({
          id: c.caseId,
          name: c.metadata?.name || c.caseId,
          status: c.metadata?.status || 'active',
          createdAt: c.createdAt,
        }));

      setRecentCases(recentCasesData);
    } catch (err) {
      console.error('❌ Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const systemStats = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      change: `${stats.activeCases} active`,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Total Alerts',
      value: stats.totalAlerts,
      change: `${stats.pendingAlerts} pending`,
      icon: Activity,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'Avg Match Quality',
      value: `${(stats.averageSimilarity * 100).toFixed(1)}%`,
      change: 'Similarity score',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'GPS Coverage',
      value: stats.casesWithGPS,
      change: `of ${stats.totalCases} cases`,
      icon: Server,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
  ];

  return (
    <Layout 
      title="System Administration" 
      breadcrumbs={[{ title: 'Admin Dashboard' }]}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 to-purple-600 text-white p-6 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-8 w-8" />
                <h2 className="text-2xl font-bold">
                  Welcome back, {user?.name}
                </h2>
              </div>
              <p className="text-red-100">
                System overview and administrative controls for TraceVision platform.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-white/20 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 bg-green-300 rounded-full animate-pulse" />
              <span>Real-time data</span>
            </div>
          </div>
        </motion.div>

        {/* System Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {systemStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold text-gray-300">...</div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.change}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Alerts</CardTitle>
                    <CardDescription>
                      Latest detection alerts in the system
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">{stats.pendingAlerts} pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
                ) : recentAlerts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">No alerts yet</div>
                ) : (
                  <div className="space-y-3">
                    {recentAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {alert.metadata?.personName || alert.caseId}
                          </p>
                          <p className="text-xs text-gray-500">
                            {alert.sourceRole === 'citizen' ? 'Citizen report' : 'System detection'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={alert.status === 'pending' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {alert.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {(alert.similarity * 100).toFixed(1)}% match
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          {formatTimeAgo(alert.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Cases */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Cases</CardTitle>
                <CardDescription>
                  Latest missing persons cases added
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
                ) : recentCases.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">No cases yet</div>
                ) : (
                  <div className="space-y-3">
                    {recentCases.map((caseItem) => (
                      <div key={caseItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{caseItem.name}</p>
                          <p className="text-xs text-gray-500">{caseItem.id}</p>
                          <Badge 
                            variant={caseItem.status === 'active' ? 'destructive' : 'outline'}
                            className="text-xs mt-1"
                          >
                            {caseItem.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          {formatTimeAgo(caseItem.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alert Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Alert Status Overview</CardTitle>
              <CardDescription>
                Current distribution of alerts by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="text-sm font-bold">{stats.pendingAlerts}</span>
                  </div>
                  <Progress 
                    value={stats.totalAlerts > 0 ? (stats.pendingAlerts / stats.totalAlerts) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Assigned</span>
                    </div>
                    <span className="text-sm font-bold">{stats.assignedAlerts}</span>
                  </div>
                  <Progress 
                    value={stats.totalAlerts > 0 ? (stats.assignedAlerts / stats.totalAlerts) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <span className="text-sm font-bold">{stats.completedAlerts}</span>
                  </div>
                  <Progress 
                    value={stats.totalAlerts > 0 ? (stats.completedAlerts / stats.totalAlerts) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold">{stats.totalAlerts}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Admin Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Administrative Actions</CardTitle>
              <CardDescription>
                Quick access to common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-20 flex-col space-y-2" variant="outline">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Manage Users</span>
                </Button>
                <Button className="h-20 flex-col space-y-2" variant="outline">
                  <Camera className="h-6 w-6" />
                  <span className="text-sm">Camera Config</span>
                </Button>
                <Button className="h-20 flex-col space-y-2" variant="outline">
                  <Database className="h-6 w-6" />
                  <span className="text-sm">AI Models</span>
                </Button>
                <Button className="h-20 flex-col space-y-2" variant="outline">
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">System Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
