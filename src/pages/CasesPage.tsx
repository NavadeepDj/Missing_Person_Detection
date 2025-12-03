import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { SimplePhotoUpload } from '@/components/ui/SimplePhotoUpload';
import { FaceProcessingService } from '@/services/FaceProcessingService';
import { databaseService } from '@/services/DatabaseService';

type CaseRow = {
  id: string;
  caseId: string;
  name?: string;
  age?: number;
  status?: string;
  dateReported?: string;
  location?: string;
  alerts?: number;
  createdAt: string;
  embedding: number[];
  metadata?: any;
};

export function CasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const embeddings = await FaceProcessingService.getAllStoredEmbeddings();

        const mapped: CaseRow[] = embeddings.map((item) => {
          const metadata = item.metadata || {};
          return {
            id: item.id,
            caseId: item.caseId,
            name: metadata.name || metadata.caseName || '',
            age: typeof metadata.age === 'number' ? metadata.age : undefined,
            status: metadata.status || 'active',
            dateReported: metadata.dateReported || item.createdAt?.slice(0, 10),
            location: metadata.location || '',
            alerts: typeof metadata.alerts === 'number' ? metadata.alerts : 0,
            createdAt: item.createdAt,
            embedding: item.embedding,
            metadata,
          };
        });

        setCases(mapped);
      } catch (err) {
        console.error('❌ Failed to load cases from database', err);
        setError('Failed to load cases from database.');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const handleEditCase = async (caseItem: CaseRow) => {
    const currentName = caseItem.name || '';
    const currentAge = caseItem.age !== undefined ? String(caseItem.age) : '';
    const currentStatus = caseItem.status || 'active';
    const currentLocation = caseItem.location || '';

    const name = window.prompt('Name for this case:', currentName);
    if (name === null) return;

    const ageInput = window.prompt('Age (optional):', currentAge);
    if (ageInput === null) return;
    const age = ageInput ? Number(ageInput) : undefined;

    const status = window.prompt('Status (active/found/closed):', currentStatus) || currentStatus;
    const location = window.prompt('Last known location (optional):', currentLocation) ?? currentLocation;

    const updatedMetadata = {
      ...(caseItem.metadata || {}),
      name,
      age,
      status,
      location,
      dateReported: caseItem.dateReported || new Date(caseItem.createdAt).toISOString().slice(0, 10),
    };

    try {
      setSavingId(caseItem.caseId);
      const result = await databaseService.updateFaceEmbedding(caseItem.caseId, caseItem.embedding, updatedMetadata);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update case details');
      }

      setCases((prev) =>
        prev.map((c) =>
          c.caseId === caseItem.caseId
            ? {
                ...c,
                name,
                age,
                status,
                location,
                metadata: updatedMetadata,
              }
            : c,
        ),
      );
    } catch (err) {
      console.error('❌ Failed to update case metadata', err);
      window.alert('Failed to update case details. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive">Active</Badge>;
      case 'found':
        return <Badge className="bg-green-100 text-green-800">Found</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout 
      title="Case Management" 
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Case Management' }
      ]}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 justify-between"
        >
          <div className="flex gap-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Advanced Search
            </Button>
          </div>
        </motion.div>

        {/* Cases Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Active Cases</CardTitle>
              <CardDescription>
                All cases created when photos are uploaded and embeddings are stored
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 text-sm text-red-600">
                  {error}
                </div>
              )}
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading cases from database...</div>
              ) : cases.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No cases yet. Upload a photo below to create the first case.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Reported</TableHead>
                      <TableHead>Last Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell className="font-mono text-xs">{caseItem.caseId}</TableCell>
                        <TableCell>{caseItem.name || <span className="text-gray-400 italic">Unknown</span>}</TableCell>
                        <TableCell>{caseItem.age ?? '-'}</TableCell>
                        <TableCell>{getStatusBadge(caseItem.status || 'active')}</TableCell>
                        <TableCell>{caseItem.dateReported || caseItem.createdAt.slice(0, 10)}</TableCell>
                        <TableCell>{caseItem.location || <span className="text-gray-400 italic">Not set</span>}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCase(caseItem)}
                              disabled={savingId === caseItem.caseId}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              {savingId === caseItem.caseId ? 'Saving…' : 'Edit'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Photo Upload Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🧠 AI Photo Upload Demo</span>
                <Badge variant="outline">Beta Feature</Badge>
              </CardTitle>
              <CardDescription>
                Test the AI-powered face recognition system by uploading photos below.
                This demonstrates how missing persons photos are processed for facial recognition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">How AI Detection Works:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Upload clear front-facing photos of missing persons</li>
                    <li>AI detects faces and generates 512-dimensional ArcFace facial embeddings</li>
                    <li>Embeddings are stored in the database for matching</li>
                    <li>Camera feeds are monitored for real-time face detection</li>
                    <li>Matches trigger alerts to investigators</li>
                  </ol>
                </div>

                <SimplePhotoUpload
                  onPhotoSelect={async (photoUrl, aiProcessed) => {
                    console.log('📸 Photo uploaded:', photoUrl, 'AI processed:', aiProcessed);
                  }}
                  maxPhotos={3}
                />

                <div className="text-xs text-gray-500 text-center">
                  This is a demonstration. Full AI processing requires TensorFlow.js integration.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
