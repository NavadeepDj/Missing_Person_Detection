import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Users, Shield, UserCheck, Clock, Mail, Building2, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/services/DatabaseService';
import { FaceProcessingService } from '@/services/FaceProcessingService';

interface UserActivity {
  userId: string;
  email: string;
  role: string;
  casesCreated: number;
  alertsCreated: number;
  lastActivity?: string;
}

export function UserManagementPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    admins: 0,
    caseManagers: 0,
    investigators: 0,
    citizens: 0,
  });
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadUserData();
    const interval = setInterval(loadUserData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get all cases and alerts to calculate user activity
      const cases = await FaceProcessingService.getAllStoredEmbeddings();
      const alerts = await databaseService.getRecentAlerts(1000);

      // Dummy users from AuthContext (in real app, this would come from database)
      const dummyUsers = [
        { id: '1', email: 'admin@tracevision.com', role: 'admin', name: 'Admin User', organization: 'TraceVision HQ' },
        { id: '2', email: 'sarah.johnson@police.gov', role: 'case_manager', name: 'Detective Sarah Johnson', organization: 'City Police Department' },
        { id: '3', email: 'mike.chen@police.gov', role: 'investigator', name: 'Officer Mike Chen', organization: 'City Police Department' },
        { id: '4', email: 'coordinator@missingpersons.org', role: 'case_manager', name: 'NGO Coordinator', organization: 'Missing Persons NGO' },
        { id: '5', email: 'citizen@tracevision.com', role: 'citizen', name: 'Public Citizen', organization: 'Community User' },
      ];

      // Calculate user stats
      const roleCounts = {
        admin: 0,
        case_manager: 0,
        investigator: 0,
        citizen: 0,
      };

      dummyUsers.forEach(u => {
        if (u.role === 'admin') roleCounts.admin++;
        else if (u.role === 'case_manager') roleCounts.case_manager++;
        else if (u.role === 'investigator') roleCounts.investigator++;
        else if (u.role === 'citizen') roleCounts.citizen++;
      });

      // Calculate user activities (simplified - in real app, track by user_id)
      const activities: UserActivity[] = dummyUsers.map(u => {
        // Count cases created by this user (simplified - would track creator in real app)
        const casesCreated = Math.floor(cases.length / dummyUsers.length);
        // Count alerts created by this user
        const userAlerts = alerts.filter(a => 
          a.sourceRole === u.role || 
          (u.role === 'citizen' && a.sourceRole === 'citizen')
        );
        const alertsCreated = userAlerts.length;

        // Get last activity from alerts
        const userRecentAlerts = alerts
          .filter(a => a.sourceRole === u.role || (u.role === 'citizen' && a.sourceRole === 'citizen'))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastActivity = userRecentAlerts.length > 0 ? userRecentAlerts[0].createdAt : undefined;

        return {
          userId: u.id,
          email: u.email,
          role: u.role,
          casesCreated,
          alertsCreated,
          lastActivity,
        };
      });

      setUserStats({
        totalUsers: dummyUsers.length,
        admins: roleCounts.admin,
        caseManagers: roleCounts.case_manager,
        investigators: roleCounts.investigator,
        citizens: roleCounts.citizen,
      });

      setUserActivities(activities);

      // Recent activity (last 10 alerts)
      const recent = alerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      setRecentActivity(recent);

    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      admin: { label: 'Administrator', variant: 'destructive', className: 'bg-red-100 text-red-800' },
      case_manager: { label: 'Case Manager', variant: 'default', className: 'bg-blue-100 text-blue-800' },
      investigator: { label: 'Investigator', variant: 'default', className: 'bg-green-100 text-green-800' },
      citizen: { label: 'Citizen', variant: 'outline', className: 'bg-gray-100 text-gray-800' },
    };
    const config = roleMap[role] || roleMap.citizen;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <Layout
      title="User Management"
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Administration', href: '/admin' },
        { title: 'User Management' }
      ]}
    >
      <div className="space-y-6">
        {/* User Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-5"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{userStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{userStats.admins}</div>
              <p className="text-xs text-muted-foreground">Admin users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Case Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{userStats.caseManagers}</div>
              <p className="text-xs text-muted-foreground">Case managers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Investigators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{userStats.investigators}</div>
              <p className="text-xs text-muted-foreground">Field officers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Citizens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{userStats.citizens}</div>
              <p className="text-xs text-muted-foreground">Public users</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* User List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>All registered users and their activity</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-center text-sm text-gray-500">Loading users...</div>
              ) : (
                <div className="space-y-4">
                  {userActivities.map((activity) => (
                    <motion.div
                      key={activity.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{activity.email}</span>
                            {getRoleBadge(activity.role)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {activity.casesCreated} cases
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {activity.alertsCreated} alerts
                            </span>
                            {activity.lastActivity && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(activity.lastActivity).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Latest actions by users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-6 text-center text-sm text-gray-500">Loading activity...</div>
              ) : recentActivity.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No recent activity</div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">
                            Alert created for {activity.metadata?.personName || activity.caseId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.sourceRole === 'citizen' ? 'Public tip' : 'System detection'} • {new Date(activity.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {(activity.similarity * 100).toFixed(1)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}

