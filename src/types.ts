export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'case_manager' | 'investigator' | 'citizen';
  organization?: string;
}

export interface FacePhoto {
  id: string;
  personId: string;
  photoUrl: string;
  embedding: number[];
  confidence: number;
  createdAt: string;
}

export interface MissingPerson {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  lastKnownLocation: string;
  description: string;
  photos: string[];
  identifiers: string[];
  status: 'active' | 'found' | 'closed';
  dateReported: string;
  caseNumber: string;
  reportedBy: string;
  // AI Detection fields
  faceEmbedding?: number[];
  facePhotos?: FacePhoto[];
  detectionSettings?: {
    minSimilarity: number;
    activeAlerts: boolean;
  };
}

export interface Alert {
  id: string;
  caseId: string;
  personName: string;
  detectionTime: string;
  location: string;
  confidence: number;
  imageUrl: string;
  cameraId: string;
  status: 'new' | 'verified' | 'false_positive';
  verifiedBy?: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive';
}
