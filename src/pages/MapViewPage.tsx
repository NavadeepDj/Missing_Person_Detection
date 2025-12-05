import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/services/DatabaseService';
import { FaceProcessingService } from '@/services/FaceProcessingService';
import { MapPin, User, Calendar, AlertCircle } from 'lucide-react';

// Create custom icon with label support
const createCustomIcon = (label: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: #dc2626;
        color: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${label.charAt(0).toUpperCase()}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface CaseLocation {
  caseId: string;
  name?: string;
  age?: number;
  status?: string;
  dateReported?: string;
  latitude: number;
  longitude: number;
  location?: string;
}

export function MapViewPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, [user]);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.role === 'admin' || user?.role === 'case_manager') {
        // Admin: Get all cases
        const embeddings = await FaceProcessingService.getAllStoredEmbeddings();
        const caseLocations: CaseLocation[] = [];

        for (const item of embeddings) {
          const metadata = item.metadata || {};
          const location = metadata.location || '';

          // Try to parse location as "lat,lng" or extract from metadata
          let lat: number | null = null;
          let lng: number | null = null;

          // Check if location is in "lat,lng" format
          if (location && typeof location === 'string') {
            const coords = location.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              lat = coords[0];
              lng = coords[1];
            }
          }

          // Check metadata for explicit lat/lng
          if (!lat || !lng) {
            if (typeof metadata.latitude === 'number' && typeof metadata.longitude === 'number') {
              lat = metadata.latitude;
              lng = metadata.longitude;
            }
          }

          // If we have valid coordinates, add to map
          if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            caseLocations.push({
              caseId: item.caseId,
              name: metadata.name || metadata.caseName || '',
              age: typeof metadata.age === 'number' ? metadata.age : undefined,
              status: metadata.status || 'active',
              dateReported: metadata.dateReported || item.createdAt?.slice(0, 10),
              latitude: lat,
              longitude: lng,
              location,
            });
          }
        }

        setCases(caseLocations);
      } else if (user?.role === 'investigator') {
        // Investigator: Show ALL assigned alerts with their locations (not just unique cases)
        const alerts = await databaseService.getRecentAlerts(100);
        const assignedAlerts = alerts.filter(a => a.status === 'assigned' || a.status === 'completed');

        const caseLocations: CaseLocation[] = [];

        for (const alert of assignedAlerts) {
          // Try to get location from alert first (this is where the alert was created)
          let lat: number | null = null;
          let lng: number | null = null;

          // First priority: alert.location field (where the alert was created)
          if (alert.location) {
            const alertCoords = alert.location.split(',').map(Number);
            if (alertCoords.length === 2 && !isNaN(alertCoords[0]) && !isNaN(alertCoords[1])) {
              lat = alertCoords[0];
              lng = alertCoords[1];
            }
          }

          // Second priority: alert metadata latitude/longitude
          if ((!lat || !lng) && alert.metadata) {
            if (typeof alert.metadata.latitude === 'number' && typeof alert.metadata.longitude === 'number') {
              lat = alert.metadata.latitude;
              lng = alert.metadata.longitude;
            }
          }

          // Fallback: Get case location if alert doesn't have location
          if (!lat || !lng) {
            try {
              const caseEmbedding = await databaseService.getFaceEmbedding(alert.caseId);
              if (caseEmbedding) {
                const metadata = caseEmbedding.metadata || {};
                const location = metadata.location || '';

                // Check if location is in "lat,lng" format
                if (location && typeof location === 'string') {
                  const coords = location.split(',').map(Number);
                  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                    lat = coords[0];
                    lng = coords[1];
                  }
                }

                // Check metadata for explicit lat/lng
                if (!lat || !lng) {
                  if (typeof metadata.latitude === 'number' && typeof metadata.longitude === 'number') {
                    lat = metadata.latitude;
                    lng = metadata.longitude;
                  }
                }
              }
            } catch (err) {
              console.error(`Error loading case ${alert.caseId}:`, err);
            }
          }

          // If we have valid coordinates, add to map (show ALL alerts, not just unique cases)
          if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            // Get case name for display
            let caseName = alert.metadata?.personName || alert.caseId;
            try {
              const caseEmbedding = await databaseService.getFaceEmbedding(alert.caseId);
              if (caseEmbedding?.metadata?.name) {
                caseName = caseEmbedding.metadata.name;
              }
            } catch (err) {
              // Ignore errors, use alert metadata
            }

            caseLocations.push({
              caseId: `${alert.caseId}-${alert.id}`, // Unique ID for each alert
              name: caseName,
              age: alert.metadata?.age || undefined,
              status: alert.status === 'completed' ? 'found' : 'active',
              dateReported: alert.createdAt?.slice(0, 10),
              latitude: lat,
              longitude: lng,
              location: alert.location || `${lat},${lng}`,
            });
          }
        }

        setCases(caseLocations);
      }
    } catch (err) {
      console.error('❌ Failed to load cases for map', err);
      setError('Failed to load cases for map view.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate center of all markers
  const getMapCenter = (): [number, number] => {
    if (cases.length === 0) {
      return [0, 0]; // Default center
    }

    const avgLat = cases.reduce((sum, c) => sum + c.latitude, 0) / cases.length;
    const avgLng = cases.reduce((sum, c) => sum + c.longitude, 0) / cases.length;
    return [avgLat, avgLng];
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Active', className: 'bg-red-100 text-red-800' },
      found: { label: 'Found', className: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusMap[status || 'active'] || statusMap.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Layout
      title="Map View"
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Map View' }
      ]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'admin' || user?.role === 'case_manager'
                ? 'All Cases Map View'
                : 'Assigned Cases Map View'}
            </CardTitle>
            <CardDescription>
              {user?.role === 'admin' || user?.role === 'case_manager'
                ? 'Geographic view of all missing persons cases with GPS locations'
                : 'Geographic view of your assigned cases with GPS locations'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-gray-500">
                Loading map data...
              </div>
            ) : error ? (
              <div className="py-12 text-center text-sm text-red-600">
                {error}
              </div>
            ) : cases.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                {user?.role === 'investigator'
                  ? 'No assigned cases with GPS locations found.'
                  : 'No cases with GPS locations found.'}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{cases.length}</strong> case{cases.length !== 1 ? 's' : ''} with GPS locations
                  </div>
                </div>

                {/* Map */}
                <div className="h-[600px] rounded-md overflow-hidden border border-gray-300">
                  <MapContainer
                    center={getMapCenter()}
                    zoom={cases.length === 1 ? 15 : 10}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    attributionControl={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {cases.map((caseItem, index) => {
                      const label = caseItem.name || caseItem.caseId;
                      const labelChar = label.charAt(0).toUpperCase();
                      return (
                        <Marker 
                          key={index} 
                          position={[caseItem.latitude, caseItem.longitude]}
                          icon={createCustomIcon(labelChar)}
                        >
                          <Popup>
                            <div className="min-w-[200px]">
                              <div className="font-semibold text-lg mb-2">
                                {caseItem.name || caseItem.caseId}
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Case ID:</span>
                                  <span className="text-muted-foreground">{caseItem.caseId}</span>
                                </div>
                                {caseItem.age && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    <span>Age: {caseItem.age}</span>
                                  </div>
                                )}
                                {caseItem.dateReported && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    <span>Reported: {caseItem.dateReported}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {getStatusBadge(caseItem.status)}
                                </div>
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                  <MapPin className="h-3 w-3 text-red-600" />
                                  <span className="text-xs font-mono">
                                    {caseItem.latitude.toFixed(5)}, {caseItem.longitude.toFixed(5)}
                                  </span>
                                </div>
                                <div className="mt-2 pt-2 border-t">
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${caseItem.latitude},${caseItem.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Open in Google Maps →
                                  </a>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Case List */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {cases.map((caseItem, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold">
                          {caseItem.name || caseItem.caseId}
                        </div>
                        {getStatusBadge(caseItem.status)}
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>Case: {caseItem.caseId}</div>
                        {caseItem.age && <div>Age: {caseItem.age}</div>}
                        {caseItem.dateReported && <div>Reported: {caseItem.dateReported}</div>}
                        <div className="flex items-center gap-1 pt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="font-mono">
                            {caseItem.latitude.toFixed(5)}, {caseItem.longitude.toFixed(5)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

