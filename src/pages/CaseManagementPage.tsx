// Enhanced Case Management Page with AI-powered face recognition
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Eye, Edit, Brain, Camera, User, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { FacePhotoUpload } from '@/components/ui/FacePhotoUpload';
import type { MissingPerson, FacePhoto } from '@/types';
import { CacheService } from '@/services/database/CacheService';

export function CaseManagementPage() {
  const [cases, setCases] = useState<MissingPerson[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state for new case
  const [newCase, setNewCase] = useState({
    name: '',
    age: '',
    gender: '',
    lastKnownLocation: '',
    description: '',
    reportedBy: ''
  });

  const [facePhotos, setFacePhotos] = useState<FacePhoto[]>([]);

  // Load cases from cache on mount
  useEffect(() => {
    const loadedCases = CacheService.getMissingPersons();
    setCases(loadedCases);
  }, []);

  // Save cases to cache whenever they change
  useEffect(() => {
    if (cases.length > 0) {
      CacheService.saveMissingPersons(cases);
    }
  }, [cases]);

  const handleCreateCase = () => {
    const caseData: MissingPerson = {
      id: crypto.randomUUID(),
      name: newCase.name,
      age: parseInt(newCase.age),
      gender: newCase.gender as 'male' | 'female' | 'other',
      lastKnownLocation: newCase.lastKnownLocation,
      description: newCase.description,
      photos: facePhotos.map(photo => photo.photoUrl),
      identifiers: [],
      status: 'active',
      dateReported: new Date().toISOString().split('T')[0],
      caseNumber: `CASE-${Date.now()}`,
      reportedBy: newCase.reportedBy,
      facePhotos: facePhotos.length > 0 ? facePhotos : undefined,
      detectionSettings: {
        minSimilarity: 0.75,
        activeAlerts: true
      }
    };

    // Save to state and cache
    setCases(prev => [caseData, ...prev]);
    CacheService.saveMissingPersons([caseData, ...cases]);

    // Save embeddings
    facePhotos.forEach(photo => {
      CacheService.addEmbedding({
        personId: caseData.id,
        embedding: photo.embedding,
        photoId: photo.id
      });
    });

    // Reset form
    setNewCase({
      name: '',
      age: '',
      gender: '',
      lastKnownLocation: '',
      description: '',
      reportedBy: ''
    });
    setFacePhotos([]);
    setIsCreateDialogOpen(false);
  };

  const handlePhotoAdd = (photo: FacePhoto) => {
    setFacePhotos(prev => [...prev, photo]);
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.lastKnownLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      title="AI-Powered Case Management"
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Case Management' }
      ]}
    >
      <div className="space-y-6">
        {/* AI Capabilities Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">AI Face Recognition Enabled</h3>
              <p className="text-sm text-blue-700">
                Upload photos to generate facial embeddings for automatic matching with camera feeds
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {cases.filter(c => c.facePhotos && c.facePhotos.length > 0).length} Cases with AI
            </Badge>
          </div>
        </motion.div>

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-between"
        >
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="found">Found</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Case with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Missing Person Case</DialogTitle>
                <DialogDescription>
                  Add a new missing person case with AI-powered face recognition
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newCase.name}
                      onChange={(e) => setNewCase(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={newCase.age}
                      onChange={(e) => setNewCase(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Enter age"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={newCase.gender} onValueChange={(value) => setNewCase(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportedBy">Reported By *</Label>
                    <Input
                      id="reportedBy"
                      value={newCase.reportedBy}
                      onChange={(e) => setNewCase(prev => ({ ...prev, reportedBy: e.target.value }))}
                      placeholder="Reporter name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Last Known Location *</Label>
                  <Input
                    id="location"
                    value={newCase.lastKnownLocation}
                    onChange={(e) => setNewCase(prev => ({ ...prev, lastKnownLocation: e.target.value }))}
                    placeholder="Enter last known location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCase.description}
                    onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details about the missing person"
                    rows={3}
                  />
                </div>

                {/* Face Photo Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <span>Face Photos for AI Recognition</span>
                    <Badge variant="outline" className="text-xs">
                      {facePhotos.length} photos
                    </Badge>
                  </Label>
                  <FacePhotoUpload
                    personId="temp-new-case"
                    onPhotoAdd={handlePhotoAdd}
                  />
                  <p className="text-xs text-gray-500">
                    Upload clear front-facing photos. AI will generate facial embeddings for automatic matching.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCase}
                  disabled={!newCase.name || !newCase.age || !newCase.gender || !newCase.lastKnownLocation || !newCase.reportedBy}
                >
                  Create Case with AI
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Cases Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Missing Persons Cases</span>
                <Badge variant="outline">{filteredCases.length} total</Badge>
              </CardTitle>
              <CardDescription>
                Manage missing persons cases with AI-powered face recognition capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Reported</TableHead>
                    <TableHead>Last Location</TableHead>
                    <TableHead>AI Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{caseItem.name}</div>
                          {caseItem.facePhotos && caseItem.facePhotos.length > 0 && (
                            <div className="text-xs text-green-600 flex items-center space-x-1">
                              <Brain className="h-3 w-3" />
                              <span>AI Enabled</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{caseItem.age}</TableCell>
                      <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                      <TableCell>{caseItem.dateReported}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{caseItem.lastKnownLocation}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {caseItem.facePhotos && caseItem.facePhotos.length > 0 ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Brain className="h-3 w-3 mr-1" />
                            {caseItem.facePhotos.length} Photo{caseItem.facePhotos.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No AI Data</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredCases.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No cases found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}