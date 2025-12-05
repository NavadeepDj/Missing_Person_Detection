import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Eye,
  CheckCircle,
  User,
  Camera,
  Navigation,
  Phone,
  MessageSquare,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/services/DatabaseService';

export function InvestigatorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedAlerts: 0,
    activeAlerts: 0,
    completedToday: 0,
  });
  const [assignedAlerts, setAssignedAlerts] = useState<any[]>([]);
  const [assignedCases, setAssignedCases] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all alerts
      const alerts = await databaseService.getRecentAlerts(100);

      // Filter for assigned alerts (investigator sees all assigned, not just to them)
      const assigned = alerts.filter(a => a.status === 'assigned' || a.status === 'completed');
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const completedToday = alerts.filter(a => {
        if (a.status !== 'completed' || !a.completedAt) return false;
        const completedDate = new Date(a.completedAt).toISOString().split('T')[0];
        return completedDate === today;
      }).length;

      setStats({
        assignedAlerts: assigned.length,
        activeAlerts: alerts.filter(a => a.status === 'assigned').length,
        completedToday,
      });

      // Get assigned alerts with details
      const activeAssigned = alerts
        .filter(a => a.status === 'assigned')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setAssignedAlerts(activeAssigned);

      // Get unique case IDs from assigned alerts and fetch case details
      const uniqueCaseIds = [...new Set(assigned.map(a => a.caseId))];
      const casesData = [];

      for (const caseId of uniqueCaseIds.slice(0, 5)) {
        try {
          const caseData = await databaseService.getFaceEmbedding(caseId);
          if (caseData) {
            const metadata = caseData.metadata || {};
            casesData.push({
              id: caseId,
              name: metadata.name || metadata.caseName || caseId,
              age: typeof metadata.age === 'number' ? metadata.age : undefined,
              status: metadata.status || 'active',
              location: metadata.location || '',
              createdAt: caseData.createdAt,
            });
          }
        } catch (err) {
          console.error(`Error loading case ${caseId}:`, err);
        }
      }

      setAssignedCases(casesData);
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

  const getPriorityBadge = (similarity: number) => {
    if (similarity >= 0.9) {
      return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
    } else if (similarity >= 0.7) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
  };

  const fieldStats = [
    {
      title: 'Assigned Alerts',
      value: stats.assignedAlerts,
      change: `${stats.activeAlerts} active`,
      icon: Search,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts,
      change: 'Require field response',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      change: 'Resolved today',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Success Rate',
      value: stats.assignedAlerts > 0 
        ? `${Math.round((stats.completedToday / stats.assignedAlerts) * 100)}%`
        : '0%',
      change: 'Today\'s completion',
      icon: MapPin,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
  ];

  // Get highest priority alert
  const urgentAlert = assignedAlerts.length > 0
    ? assignedAlerts.sort((a, b) => b.similarity - a.similarity)[0]
    : null;

  return (
    <Layout 
      title="Field Investigation Dashboard" 
      breadcrumbs={[{ title: 'Investigator Dashboard' }]}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Field Officer {user?.name}
              </h2>
              <p className="text-green-100">
                Real-time alerts and case information for field investigation.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-200">{user?.organization}</p>
              <div className="flex items-center mt-1 justify-end">
                <div className="h-2 w-2 bg-green-300 rounded-full mr-2 animate-pulse"></div>
                <p className="text-sm font-semibold">Real-time</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Urgent Alert Banner */}
        {urgentAlert && urgentAlert.similarity >= 0.85 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>HIGH PRIORITY:</strong> {urgentAlert.metadata?.personName || urgentAlert.caseId} 
                detected with {(urgentAlert.similarity * 100).toFixed(1)}% match confidence.
                {urgentAlert.location && ` Location: ${urgentAlert.location}`}
                <Button size="sm" className="ml-4 bg-red-600 hover:bg-red-700" onClick={() => window.location.href = '/alerts'}>
                  View Alert
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Field Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {fieldStats.map((stat, index) => (
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Alerts for Field Response */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Field Alerts</CardTitle>
                    <CardDescription>
                      Detections requiring immediate field verification
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">{stats.activeAlerts} Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
                ) : assignedAlerts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">No active alerts</div>
                ) : (
                  assignedAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      whileHover={{ scale: 1.02 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">
                            {alert.metadata?.personName || alert.caseId}
                          </h4>
                          <p className="text-sm text-gray-600">{alert.caseId}</p>
                          {alert.location && (
                            <p className="text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {alert.location}
                            </p>
                          )}
                        </div>
                        {getPriorityBadge(alert.similarity)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(alert.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {alert.sourceRole === 'citizen' ? 'Citizen' : 'System'}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Match Confidence</span>
                          <span className="text-xs font-medium">{(alert.similarity * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={alert.similarity * 100} className="h-2" />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.location.href = '/alerts'}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        {alert.location && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const coords = alert.location?.split(',').map(Number);
                              if (coords && coords.length === 2) {
                                window.open(`https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`, '_blank');
                              }
                            }}
                          >
                            <Navigation className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Assigned Cases */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Cases</CardTitle>
                <CardDescription>
                  Missing persons cases under investigation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
                ) : assignedCases.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">No assigned cases</div>
                ) : (
                  assignedCases.map((caseItem) => (
                    <div key={caseItem.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold">{caseItem.name}</h4>
                            {caseItem.age && (
                              <span className="text-sm text-gray-500">({caseItem.age} years)</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{caseItem.id}</p>
                        </div>
                        <Badge 
                          variant={caseItem.status === 'active' ? 'destructive' : 'outline'}
                        >
                          {caseItem.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-3">
                        {caseItem.location && (
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            Location: {caseItem.location}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Created: {formatTimeAgo(caseItem.createdAt)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => window.location.href = '/missing-persons'}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Field Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Field Operations</CardTitle>
              <CardDescription>
                Quick access to field investigation tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  className="h-16 flex-col space-y-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/alerts'}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">View Alerts</span>
                </Button>
                <Button 
                  className="h-16 flex-col space-y-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/map'}
                >
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm">Map View</span>
                </Button>
                <Button 
                  className="h-16 flex-col space-y-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/missing-persons'}
                >
                  <Search className="h-5 w-5" />
                  <span className="text-sm">Cases</span>
                </Button>
                <Button 
                  className="h-16 flex-col space-y-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/alerts'}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
