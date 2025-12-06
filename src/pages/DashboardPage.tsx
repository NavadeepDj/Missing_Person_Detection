import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  AlertTriangle, 
  Eye, 
  Clock,
  MapPin,
  Camera,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FaceProcessingService } from '@/services/FaceProcessingService';

export function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    casesWithPhotos: 0,
  });
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

      // Fetch all cases (public missing persons database)
      const cases = await FaceProcessingService.getAllStoredEmbeddings();

      const totalCases = cases.length;
      const activeCases = cases.filter(c => {
        const status = c.metadata?.status || 'active';
        return status === 'active';
      }).length;

      setStats({
        totalCases,
        activeCases,
        casesWithPhotos: totalCases, // All cases have photos/embeddings
      });

      // Recent cases (last 5)
      const recentCasesData = cases
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(c => ({
          id: c.caseId,
          name: c.metadata?.name || c.caseId,
          age: typeof c.metadata?.age === 'number' ? c.metadata.age : undefined,
          status: c.metadata?.status || 'active',
          location: c.metadata?.location || '',
          dateReported: c.metadata?.dateReported || c.createdAt?.slice(0, 10),
          createdAt: c.createdAt,
        }));

      setRecentCases(recentCasesData);
    } catch (err) {
      console.error('❌ Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const _formatTimeAgo = (timestamp: string) => {
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

  const statsData = [
    {
      title: 'Active Cases',
      value: stats.activeCases,
      change: `${stats.totalCases} total cases`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Total Missing Persons',
      value: stats.totalCases,
      change: 'In database',
      icon: Search,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      title: 'Cases with Photos',
      value: stats.casesWithPhotos,
      change: 'Available for matching',
      icon: Camera,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Help Needed',
      value: stats.activeCases,
      change: 'Active searches',
      icon: AlertTriangle,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
  ];

  return (
    <Layout 
      title="Dashboard" 
      breadcrumbs={[{ title: 'Dashboard' }]}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name}
              </h2>
              <p className="text-blue-100">
                Help us find missing persons. Your contributions make a difference.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-white/20 px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 bg-green-300 rounded-full animate-pulse" />
              <span>Real-time data</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {statsData.map((stat, index) => (
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

        {/* Recent Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Missing Persons</CardTitle>
                  <CardDescription>
                    Latest cases added to the database
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/missing-persons'}
                >
                  <Search className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
              ) : recentCases.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No cases yet</div>
              ) : (
                <div className="space-y-3">
                  {recentCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">
                            {(caseItem.name || caseItem.id).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{caseItem.name}</h4>
                            {caseItem.age && (
                              <span className="text-sm text-gray-500">({caseItem.age} years)</span>
                            )}
                            <Badge 
                              variant={caseItem.status === 'active' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {caseItem.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{caseItem.id}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {caseItem.location && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {caseItem.location}
                              </div>
                            )}
                            {caseItem.dateReported && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Reported: {caseItem.dateReported}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = '/missing-persons'}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>How You Can Help</CardTitle>
              <CardDescription>
                Contribute to finding missing persons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Camera className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold">Upload Photos</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    If you see someone who might be a missing person, upload their photo. 
                    Our AI will automatically check against the database.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.location.href = '/missing-persons'}
                  >
                    Upload Photo
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Search className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="font-semibold">Browse Cases</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    View all active missing persons cases. Keep an eye out and report 
                    any sightings to help bring them home.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="mt-3"
                    onClick={() => window.location.href = '/missing-persons'}
                  >
                    View Cases
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
