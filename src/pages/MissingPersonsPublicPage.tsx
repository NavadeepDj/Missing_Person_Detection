import { useEffect, useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FaceProcessingService } from '@/services/FaceProcessingService';
import { databaseService } from '@/services/DatabaseService';
import { MatchingService } from '@/services/faceRecognition/MatchingService';
import { AlertTriangle, CheckCircle, Camera, Upload } from 'lucide-react';

interface MissingCase {
  id: string;
  caseId: string;
  name?: string;
  age?: number;
  status?: string;
  dateReported?: string;
  location?: string;
  createdAt: string;
  embedding: number[];
  metadata?: any;
}

export function MissingPersonsPublicPage() {
  const [cases, setCases] = useState<MissingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<MissingCase | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const embeddings = await FaceProcessingService.getAllStoredEmbeddings();

        const mapped: MissingCase[] = embeddings.map((item) => {
          const metadata = item.metadata || {};
          return {
            id: item.id,
            caseId: item.caseId,
            name: metadata.name || metadata.caseName || '',
            age: typeof metadata.age === 'number' ? metadata.age : undefined,
            status: metadata.status || 'active',
            dateReported: metadata.dateReported || item.createdAt?.slice(0, 10),
            location: metadata.location || '',
            createdAt: item.createdAt,
            embedding: item.embedding,
            metadata,
          };
        });

        // Only show active missing persons
        setCases(mapped.filter((c) => (c.status || 'active') === 'active'));
      } catch (err) {
        console.error('❌ Failed to load missing cases', err);
        setError('Failed to load missing persons from database.');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const getBrowserLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (!('geolocation' in navigator)) {
      console.warn('ℹ️ Browser geolocation API not available');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 Browser GPS location acquired (public citizen):', { latitude, longitude });
          resolve({ latitude, longitude });
        },
        (geoError) => {
          console.warn('⚠️ Browser geolocation failed or was denied (public citizen):', geoError);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        },
      );
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCase) return;

    setMatchMessage(null);
    setMatchError(null);
    setIsUploading(true);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file.');
      }

      const reader = new FileReader();
      const photoUrl: string = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') resolve(result);
          else reject(new Error('Failed to read image file'));
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      // Generate embedding from uploaded photo
      const processResult = await FaceProcessingService.processImage(photoUrl);
      if (!processResult.success || !processResult.embedding) {
        throw new Error(processResult.error || 'Failed to process face in photo.');
      }

      const queryEmbedding = processResult.embedding;

      // Compare against the selected missing person's embedding
      const verify = MatchingService.verifyMatch(queryEmbedding, selectedCase.embedding, 0.8);

      // Get browser GPS (if available)
      const browserLocation = await getBrowserLocation();
      const latitude = browserLocation?.latitude;
      const longitude = browserLocation?.longitude;

      if (verify.isMatch) {
        await databaseService.createAlert({
          caseId: selectedCase.caseId,
          similarity: verify.similarity,
          sourceRole: 'citizen',
          latitude,
          longitude,
          photoUrl,
        });

        const locText =
          typeof latitude === 'number' && typeof longitude === 'number'
            ? `Approx. location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Location not available';

        setMatchMessage(
          `Possible match with case ${selectedCase.caseId} (${selectedCase.name || 'Unknown'}). Similarity ${(verify.similarity * 100).toFixed(1)}%. ${locText}`,
        );
      } else {
        setMatchMessage(
          `No strong match found for case ${selectedCase.caseId}. Similarity ${(verify.similarity * 100).toFixed(1)}%.`,
        );
      }
    } catch (err) {
      console.error('❌ Error processing citizen upload:', err);
      setMatchError(
        err instanceof Error ? err.message : 'Failed to process the uploaded photo.',
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startReportForCase = (c: MissingCase) => {
    setSelectedCase(c);
    setMatchMessage(null);
    setMatchError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout
      title="Missing Persons (Public Citizen)"
      breadcrumbs={[{ title: 'Missing Persons (Public Citizen)' }]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Missing Persons</CardTitle>
            <CardDescription>
              If you recognize someone in this list, click <span className="font-semibold">Report
              Sighting</span> on their card, then upload a clear photo of the person you see. The
              system will compare it with that specific missing person and send an alert to admins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading missing persons...
              </div>
            ) : cases.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No active missing persons are currently in the system.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cases.map((c) => (
                  <Card key={c.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {c.name || <span className="italic text-gray-500">Unknown Name</span>}
                        </CardTitle>
                        <Badge variant="destructive">Missing</Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Case ID: <span className="font-mono">{c.caseId}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-gray-700">
                      <div>
                        <span className="font-semibold">Age:</span> {c.age ?? 'Unknown'}
                      </div>
                      <div>
                        <span className="font-semibold">Last seen:</span>{' '}
                        {c.location || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-semibold">Date reported:</span>{' '}
                        {c.dateReported || c.createdAt.slice(0, 10)}
                      </div>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant={selectedCase?.caseId === c.caseId ? 'default' : 'outline'}
                          className="w-full justify-center text-xs"
                          onClick={() => startReportForCase(c)}
                        >
                          <Camera className="h-3 w-3 mr-1" />
                          {selectedCase?.caseId === c.caseId
                            ? 'Selected for Sighting Report'
                            : 'Report Sighting'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload a Photo for the Selected Person</CardTitle>
            <CardDescription>
              First choose a missing person above, then upload a clear front-facing photo of the
              person you see. Your approximate GPS location may be used to help responders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCase ? (
              <div className="py-6 text-sm text-gray-500">
                Select a missing person card above to start a sighting report.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-700">
                  Reporting for case{' '}
                  <span className="font-mono font-semibold">{selectedCase.caseId}</span>{' '}
                  ({selectedCase.name || 'Unknown Name'})
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photo
                  </Button>
                </div>

                {isUploading && (
                  <div className="text-xs text-gray-600">
                    Processing photo and comparing with selected missing person...
                  </div>
                )}

                {matchError && (
                  <div className="border border-red-200 bg-red-50 text-red-800 text-xs rounded-md p-3">
                    {matchError}
                  </div>
                )}

                {matchMessage && (
                  <div className="border border-yellow-200 bg-yellow-50 text-yellow-800 text-xs rounded-md p-3 flex items-start space-x-2">
                    {matchMessage.includes('Possible match') ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                    )}
                    <span>{matchMessage}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


