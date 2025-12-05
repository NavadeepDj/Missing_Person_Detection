import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, Eye, CheckCircle, X, AlertTriangle as LucideAlertTriangle, UserCheck, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { databaseService } from '@/services/DatabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { AlertStatus } from '@/types';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface AlertItem {
  id: string;
  caseId: string;
  similarity: number;
  sourceRole: string;
  status: string;
  assignedTo?: string;
  assignedAt?: string;
  completedAt?: string;
  createdAt: string;
  location?: string | null;
  photoUrl?: string | null;
  metadata?: any;
}

// Workflow stages
const WORKFLOW_STAGES = [
  { key: 'pending', label: 'Citizen Identified', icon: '👤' },
  { key: 'assigned', label: 'Admin Accepted', icon: '✅' },
  { key: 'completed', label: 'Field Officer Found', icon: '🎯' },
];

// Field Officer ID (in real app, this would be fetched from database or use role-based assignment)
const FIELD_OFFICER_ID = 'field_officer';

export function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAlert, setProcessingAlert] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseService.getRecentAlerts(50);
      setAlerts(data);
    } catch (err) {
      console.error('❌ Failed to load alerts', err);
      setError('Failed to load alerts from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAlert = async (alertId: string) => {
    try {
      setProcessingAlert(alertId);
      const result = await databaseService.assignAlert(alertId, FIELD_OFFICER_ID);
      if (result.success) {
        await loadAlerts(); // Reload alerts
      } else {
        alert(`Failed to assign alert: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Error assigning alert:', err);
      alert('Failed to assign alert. Please try again.');
    } finally {
      setProcessingAlert(null);
    }
  };

  const handleCompleteAlert = async (alertId: string) => {
    try {
      setProcessingAlert(alertId);
      const result = await databaseService.completeAlert(alertId);
      if (result.success) {
        await loadAlerts(); // Reload alerts
      } else {
        alert(`Failed to complete alert: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Error completing alert:', err);
      alert('Failed to complete alert. Please try again.');
    } finally {
      setProcessingAlert(null);
    }
  };

  const handleRejectAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to reject this alert? This action cannot be undone.')) {
      return;
    }
    try {
      setProcessingAlert(alertId);
      const result = await databaseService.rejectAlert(alertId);
      if (result.success) {
        await loadAlerts(); // Reload alerts
      } else {
        alert(`Failed to reject alert: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Error rejecting alert:', err);
      alert('Failed to reject alert. Please try again.');
    } finally {
      setProcessingAlert(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      pending: { label: 'Pending Review', variant: 'destructive', className: 'bg-yellow-100 text-yellow-800' },
      assigned: { label: 'Assigned', variant: 'default', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', variant: 'default', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', variant: 'outline', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getSourceBadge = (sourceRole: string) => {
    if (sourceRole === 'citizen') {
      return <Badge variant="destructive">Public Tip</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">System</Badge>;
  };

  const getWorkflowProgress = (status: AlertStatus) => {
    const statusIndex = ['pending', 'assigned', 'completed'].indexOf(status);
    const progress = status === 'rejected' ? 0 : ((statusIndex + 1) / 3) * 100;
    return { progress, currentStage: statusIndex + 1 };
  };

  const canAdminAction = (alert: AlertItem) => {
    return (user?.role === 'admin' || user?.role === 'case_manager') && alert.status === 'pending';
  };

  const canInvestigatorAction = (alert: AlertItem) => {
    // Any investigator can complete any assigned alert
    return user?.role === 'investigator' && alert.status === 'assigned';
  };

  // Filter alerts based on role
  const filteredAlerts = alerts.filter(alert => {
    if (user?.role === 'investigator') {
      // Investigators see only assigned alerts or completed ones
      return alert.status === 'assigned' || alert.status === 'completed';
    }
    // Admin and case managers see all alerts
    return true;
  });

  return (
    <Layout 
      title="Alert Dashboard" 
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Alert Dashboard' }
      ]}
    >
      <div className="space-y-6">
        {/* Alert Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">All alerts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => a.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {alerts.filter(a => a.status === 'assigned').length}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Real-time Alerts</CardTitle>
              <CardDescription>
                Latest detection alerts from the AI monitoring system and public citizen uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {loading ? (
                <div className="py-6 text-center text-sm text-gray-500">Loading alerts...</div>
              ) : filteredAlerts.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No alerts yet.</div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => {
                    // Try multiple sources for location: alert.location string, alert.metadata.latitude/longitude
                    let lat: number | undefined;
                    let lng: number | undefined;
                    
                    // First try alert.location field (format: "lat,lng")
                    if (alert.location) {
                      const locationParts = alert.location.split(',').map(Number);
                      if (locationParts.length === 2 && !isNaN(locationParts[0]) && !isNaN(locationParts[1])) {
                        lat = locationParts[0];
                        lng = locationParts[1];
                      }
                    }
                    
                    // Fallback to metadata latitude/longitude
                    if ((!lat || !lng) && alert.metadata) {
                      if (typeof alert.metadata.latitude === 'number' && typeof alert.metadata.longitude === 'number') {
                        lat = alert.metadata.latitude;
                        lng = alert.metadata.longitude;
                      }
                    }
                    
                    const hasLocation = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
                    const { progress, currentStage } = getWorkflowProgress(alert.status as AlertStatus);

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">
                              {(alert.metadata?.personName ||
                                alert.caseId.split('-')[1] ||
                                alert.caseId[0] ||
                                '?')
                                .toString()
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {alert.metadata?.personName
                                    ? `${alert.metadata.personName} (${alert.caseId})`
                                    : alert.caseId}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Source: {alert.sourceRole === 'citizen' ? 'Public citizen' : 'System'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getSourceBadge(alert.sourceRole)}
                                {getStatusBadge(alert.status)}
                              </div>
                            </div>
                            
                            {/* Workflow Progress Bar */}
                            <div className="mb-3 mt-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Workflow Progress</span>
                                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                              </div>
                              <div className="relative">
                                <Progress value={progress} className="h-2" />
                                <div className="flex justify-between mt-1">
                                  {WORKFLOW_STAGES.map((stage, idx) => (
                                    <div
                                      key={stage.key}
                                      className={`text-xs flex flex-col items-center ${
                                        idx < currentStage ? 'text-green-600 font-medium' : 
                                        idx === currentStage - 1 && alert.status !== 'rejected' ? 'text-blue-600 font-medium' : 
                                        'text-gray-400'
                                      }`}
                                    >
                                      <span className="text-base">{stage.icon}</span>
                                      <span className="mt-0.5">{stage.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid gap-2 text-sm text-muted-foreground">
                              {hasLocation && (
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    <span className="font-mono text-xs">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                                  </div>
                                  
                                  {/* Map Display */}
                                  <div className="h-48 rounded-md overflow-hidden border border-gray-300">
                                    <MapContainer
                                      center={[lat, lng]}
                                      zoom={15}
                                      style={{ height: '100%', width: '100%' }}
                                      zoomControl={true}
                                      attributionControl={false}
                                    >
                                      <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                      />
                                      <Marker position={[lat, lng]}>
                                        <Popup>
                                          Alert Location<br />
                                          {alert.metadata?.personName || alert.caseId}
                                        </Popup>
                                      </Marker>
                                    </MapContainer>
                                  </div>
                                  
                                  {/* Map Links */}
                                  <div className="flex flex-wrap gap-2">
                                    <a
                                      href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline inline-flex items-center space-x-1"
                                    >
                                      <span>View on OpenStreetMap</span>
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-red-600 hover:underline inline-flex items-center space-x-1"
                                    >
                                      <span>Open in Google Maps</span>
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  </div>
                                </div>
                              )}
                              {!hasLocation && alert.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {alert.location}
                                </div>
                              )}
                              {!hasLocation && !alert.location && (
                                <div className="flex items-center text-muted-foreground">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  Location: Not available
                                </div>
                              )}
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {new Date(alert.createdAt).toLocaleString()}
                              </div>
                              {alert.assignedAt && (
                                <div className="flex items-center text-blue-600">
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Assigned: {new Date(alert.assignedAt).toLocaleString()}
                                </div>
                              )}
                              {alert.completedAt && (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Completed: {new Date(alert.completedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Match Similarity</span>
                                <span className="text-sm font-medium">
                                  {(alert.similarity * 100).toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={alert.similarity * 100} className="h-2" />
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            {canAdminAction(alert) && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => handleAssignAlert(alert.id)}
                                  disabled={processingAlert === alert.id}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Assign to Field Officer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleRejectAlert(alert.id)}
                                  disabled={processingAlert === alert.id}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {canInvestigatorAction(alert) && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleCompleteAlert(alert.id)}
                                disabled={processingAlert === alert.id}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Found
                              </Button>
                            )}
                            {alert.status === 'completed' && (
                              <Badge className="bg-green-100 text-green-800 w-full justify-center">
                                ✓ Completed
                              </Badge>
                            )}
                            {alert.status === 'rejected' && (
                              <Badge className="bg-gray-100 text-gray-800 w-full justify-center">
                                ✗ Rejected
                              </Badge>
                            )}
                            {!canAdminAction(alert) && !canInvestigatorAction(alert) && alert.status !== 'completed' && alert.status !== 'rejected' && (
                              <Button size="sm" variant="outline" disabled>
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* High Priority Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Alert className="border-red-200 bg-red-50">
            <LucideAlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Note:</strong> Public citizen alerts should always be verified by trained
              personnel before action is taken.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </Layout>
  );
}
