import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, Eye, CheckCircle, X, AlertTriangle as LucideAlertTriangle, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { databaseService } from '@/services/DatabaseService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  createdAt: string;
  location?: string | null;
  photoUrl?: string | null;
  metadata?: any;
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    loadAlerts();
  }, []);

  const getStatusBadge = (sourceRole: string) => {
    if (sourceRole === 'citizen') {
      return <Badge variant="destructive">Public Tip</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">System</Badge>;
  };

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
          className="grid gap-4 md:grid-cols-3"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">Stored in the last period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Public Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.sourceRole === 'citizen').length}
              </div>
              <p className="text-xs text-muted-foreground">Submitted by citizens</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Highest Similarity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {alerts.length
                  ? `${(Math.max(...alerts.map(a => a.similarity)) * 100).toFixed(1)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Top match confidence</p>
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
              ) : alerts.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No alerts yet.</div>
              ) : (
                <div className="space-y-4">
                {alerts.map((alert) => (
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
                          {getStatusBadge(alert.sourceRole)}
                        </div>
                        
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          {alert.location && (() => {
                            // Parse location string "lat,lon" or use metadata
                            const coords = alert.location.split(',').map(Number);
                            const lat = alert.metadata?.latitude || coords[0];
                            const lon = alert.metadata?.longitude || coords[1];
                            
                            if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    <span className="font-mono text-xs">{lat.toFixed(5)}, {lon.toFixed(5)}</span>
                                  </div>
                                  
                                  {/* Map Display */}
                                  <div className="h-48 rounded-md overflow-hidden border border-gray-300">
                                    <MapContainer
                                      center={[lat, lon]}
                                      zoom={15}
                                      style={{ height: '100%', width: '100%' }}
                                      zoomControl={true}
                                      attributionControl={false}
                                    >
                                      <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                      />
                                      <Marker position={[lat, lon]}>
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
                                      href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`}
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
                                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
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
                              );
                            }
                            return (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {alert.location}
                              </div>
                            );
                          })()}
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
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
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
