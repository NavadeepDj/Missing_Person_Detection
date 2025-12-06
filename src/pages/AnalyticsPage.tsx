import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  UserCheck,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { databaseService } from '@/services/DatabaseService';
import { FaceProcessingService } from '@/services/FaceProcessingService';

interface AnalyticsData {
  totalCases: number;
  activeCases: number;
  foundCases: number;
  closedCases: number;
  totalAlerts: number;
  pendingAlerts: number;
  assignedAlerts: number;
  completedAlerts: number;
  rejectedAlerts: number;
  citizenAlerts: number;
  systemAlerts: number;
  averageSimilarity: number;
  highestSimilarity: number;
  casesWithGPS: number;
  recentActivity: Array<{
    type: 'case' | 'alert';
    description: string;
    timestamp: string;
  }>;
  casesByStatus: Record<string, number>;
  alertsByDay: Array<{ date: string; count: number }>;
  averageResponseTime: number; // in hours
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadAnalytics();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all cases
      const cases = await FaceProcessingService.getAllStoredEmbeddings();
      
      // Fetch all alerts
      const alerts = await databaseService.getRecentAlerts(1000); // Get more for better analytics

      // Calculate case statistics
      const totalCases = cases.length;
      const activeCases = cases.filter(c => {
        const status = c.metadata?.status || 'active';
        return status === 'active';
      }).length;
      const foundCases = cases.filter(c => {
        const status = c.metadata?.status || 'active';
        return status === 'found';
      }).length;
      const closedCases = cases.filter(c => {
        const status = c.metadata?.status || 'active';
        return status === 'closed';
      }).length;

      // Calculate alert statistics
      const totalAlerts = alerts.length;
      const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
      const assignedAlerts = alerts.filter(a => a.status === 'assigned').length;
      const completedAlerts = alerts.filter(a => a.status === 'completed').length;
      const rejectedAlerts = alerts.filter(a => a.status === 'rejected').length;
      const citizenAlerts = alerts.filter(a => a.sourceRole === 'citizen').length;
      const systemAlerts = alerts.filter(a => a.sourceRole === 'system').length;

      // Calculate similarity statistics
      const similarities = alerts.map(a => a.similarity);
      const averageSimilarity = similarities.length > 0
        ? similarities.reduce((sum, s) => sum + s, 0) / similarities.length
        : 0;
      const highestSimilarity = similarities.length > 0
        ? Math.max(...similarities)
        : 0;

      // Count cases with GPS
      const casesWithGPS = cases.filter(c => {
        const location = c.metadata?.location || '';
        if (typeof location === 'string' && location.includes(',')) {
          const coords = location.split(',').map(Number);
          return coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]);
        }
        return false;
      }).length;

      // Cases by status
      const casesByStatus: Record<string, number> = {};
      cases.forEach(c => {
        const status = c.metadata?.status || 'active';
        casesByStatus[status] = (casesByStatus[status] || 0) + 1;
      });

      // Recent activity (last 10 items)
      const recentActivity: Array<{ type: 'case' | 'alert'; description: string; timestamp: string }> = [];
      
      // Add recent cases
      cases
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .forEach(c => {
          const name = c.metadata?.name || c.caseId;
          recentActivity.push({
            type: 'case',
            description: `Case created: ${name}`,
            timestamp: c.createdAt,
          });
        });

      // Add recent alerts
      alerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .forEach(a => {
          const personName = a.metadata?.personName || a.caseId;
          recentActivity.push({
            type: 'alert',
            description: `Alert: ${personName} (${(a.similarity * 100).toFixed(1)}% match)`,
            timestamp: a.createdAt,
          });
        });

      // Sort by timestamp and take top 10
      recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10);

      // Alerts by day (last 7 days)
      const alertsByDay: Array<{ date: string; count: number }> = [];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      last7Days.forEach(date => {
        const count = alerts.filter(a => {
          const alertDate = new Date(a.createdAt).toISOString().split('T')[0];
          return alertDate === date;
        }).length;
        alertsByDay.push({ date, count });
      });

      // Calculate average response time (from alert creation to completion)
      const completedAlertsWithTimes = alerts
        .filter(a => a.status === 'completed' && a.completedAt && a.createdAt)
        .map(a => {
          const created = new Date(a.createdAt).getTime();
          const completed = new Date(a.completedAt!).getTime();
          return (completed - created) / (1000 * 60 * 60); // Convert to hours
        });

      const averageResponseTime = completedAlertsWithTimes.length > 0
        ? completedAlertsWithTimes.reduce((sum, t) => sum + t, 0) / completedAlertsWithTimes.length
        : 0;

      setData({
        totalCases,
        activeCases,
        foundCases,
        closedCases,
        totalAlerts,
        pendingAlerts,
        assignedAlerts,
        completedAlerts,
        rejectedAlerts,
        citizenAlerts,
        systemAlerts,
        averageSimilarity,
        highestSimilarity,
        casesWithGPS,
        recentActivity,
        casesByStatus,
        alertsByDay,
        averageResponseTime,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ Failed to load analytics', err);
      setError('Failed to load analytics data.');
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

  if (loading && !data) {
    return (
      <Layout title="Analytics & Reports" breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Analytics' }]}>
        <div className="py-12 text-center text-sm text-gray-500">Loading analytics...</div>
      </Layout>
    );
  }

  if (error && !data) {
    return (
      <Layout title="Analytics & Reports" breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Analytics' }]}>
        <div className="py-12 text-center text-sm text-red-600">{error}</div>
      </Layout>
    );
  }

  if (!data) return null;

  const successRate = data.totalAlerts > 0
    ? (data.completedAlerts / data.totalAlerts) * 100
    : 0;

  const maxAlertsPerDay = Math.max(...data.alertsByDay.map(d => d.count), 1);

  return (
    <Layout
      title="Analytics & Reports"
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Analytics' }
      ]}
    >
      <div className="space-y-6">
        {/* Real-time Indicator */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Real-time • Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.totalCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.activeCases} active, {data.foundCases} found
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.totalAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.pendingAlerts} pending, {data.completedAlerts} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {successRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.completedAlerts} of {data.totalAlerts} alerts resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {data.averageResponseTime > 0
                  ? `${data.averageResponseTime.toFixed(1)}h`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From alert to completion
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alert Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Alert Status Breakdown</CardTitle>
              <CardDescription>Current status of all alerts in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="text-sm font-bold">{data.pendingAlerts}</span>
                  </div>
                  <Progress 
                    value={data.totalAlerts > 0 ? (data.pendingAlerts / data.totalAlerts) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Assigned</span>
                    </div>
                    <span className="text-sm font-bold">{data.assignedAlerts}</span>
                  </div>
                  <Progress 
                    value={data.totalAlerts > 0 ? (data.assignedAlerts / data.totalAlerts) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <span className="text-sm font-bold">{data.completedAlerts}</span>
                  </div>
                  <Progress 
                    value={data.totalAlerts > 0 ? (data.completedAlerts / data.totalAlerts) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Rejected</span>
                    </div>
                    <span className="text-sm font-bold">{data.rejectedAlerts}</span>
                  </div>
                  <Progress 
                    value={data.totalAlerts > 0 ? (data.rejectedAlerts / data.totalAlerts) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Alert Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Citizen Reports</span>
                  <span className="text-sm font-bold text-red-600">{data.citizenAlerts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Detections</span>
                  <span className="text-sm font-bold text-blue-600">{data.systemAlerts}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Match Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Similarity</span>
                  <span className="text-sm font-bold">{(data.averageSimilarity * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Highest Match</span>
                  <span className="text-sm font-bold text-green-600">
                    {(data.highestSimilarity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">GPS Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.casesWithGPS}</div>
              <p className="text-xs text-muted-foreground mt-1">
                of {data.totalCases} cases have GPS data
              </p>
              <Progress 
                value={data.totalCases > 0 ? (data.casesWithGPS / data.totalCases) * 100 : 0} 
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts Trend (Last 7 Days) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Alerts Trend (Last 7 Days)</CardTitle>
              <CardDescription>Daily alert count over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.alertsByDay.map((day, index) => {
                  const date = new Date(day.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {dayName}, {dayNum}
                        </span>
                        <span className="font-medium">{day.count} alerts</span>
                      </div>
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${(day.count / maxAlertsPerDay) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest cases and alerts in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentActivity.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    No recent activity
                  </div>
                ) : (
                  data.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                    >
                      <div className={`mt-0.5 p-1.5 rounded-full ${
                        activity.type === 'case' ? 'bg-blue-100' : 'bg-red-100'
                      }`}>
                        {activity.type === 'case' ? (
                          <Users className="h-3 w-3 text-blue-600" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}

