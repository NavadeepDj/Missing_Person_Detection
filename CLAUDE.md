# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TraceVision** is a modern React-based missing persons detection and case management system. This is a demo application that showcases a complete UI/UX for law enforcement and NGOs to manage missing persons cases with simulated AI-powered detection alerts.

## Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Run ESLint
bun run lint

# Preview production build
bun run preview

# Add new shadcn/ui components
bunx shadcn@latest add [component-name]
```

## Tech Stack & Architecture

### Core Technologies
- **React 19** with TypeScript and strict type checking
- **Vite** as build tool and dev server
- **Bun** as package manager
- **Tailwind CSS v4** with Vite integration
- **shadcn/ui** component library (New York style)

### Authentication System
- **Role-based access control** with three user types: `admin`, `case_manager`, `investigator`
- **Dummy authentication** stored in `src/contexts/AuthContext.tsx` with test credentials
- **Protected routes** using `ProtectedRoute` component
- **Persistent auth** via localStorage

### Project Structure
```
src/
├── components/
│   ├── layout/          # Navbar, Sidebar components
│   └── ui/              # 20+ shadcn/ui reusable components
├── contexts/            # AuthContext for global state
├── pages/               # 13 page components (Dashboard, Cases, Alerts, etc.)
├── types/               # TypeScript interfaces for User, MissingPerson, Alert, Camera
├── lib/                 # Utility functions
├── hooks/               # Custom React hooks
└── assets/              # Static assets
```

### Path Aliases
- `@/` resolves to `src/` (configured in vite.config.ts and tsconfig.json)

## Test Credentials

All authentication uses dummy data for development:

### Admin
- Email: `admin@tracevision.com`
- Password: `admin123`
- Access: Full system administration

### Case Manager (Police)
- Email: `sarah.johnson@police.gov`
- Password: `police123`
- Access: Case management and analytics

### Case Manager (NGO)
- Email: `coordinator@missingpersons.org`
- Password: `ngo123`
- Access: Case management and alerts

### Investigator
- Email: `mike.chen@police.gov`
- Password: `officer123`
- Access: View-only interface

## Key Components & Patterns

### Authentication Flow
1. User credentials validated against `DUMMY_USERS` array in `AuthContext.tsx`
2. Successful login stores user in localStorage and context
3. `ProtectedRoute` component checks auth status and redirects if needed
4. Role-based dashboard rendering based on `user.role`

### UI Component Architecture
- **shadcn/ui components** in `src/components/ui/` - use these for consistency
- **Layout components** in `src/components/layout/` - Navbar, Sidebar
- **Page components** in `src/pages/` - Feature-specific pages
- All components use **Tailwind CSS classes** and **CSS variables** for theming

### State Management
- **React Context** for authentication state (`AuthContext`)
- **Component state** for local UI state
- **localStorage** for auth persistence
- No external state management library (Redux, Zustand, etc.)

## Development Guidelines

### Code Standards
- **TypeScript strict mode** enabled - all code must be properly typed
- **ESLint** with modern flat config, React hooks, and refresh support
- **Component-first development** - build reusable components
- **shadcn/ui patterns** - follow established component patterns

### Styling Conventions
- Use **Tailwind CSS utility classes** for styling
- Leverage **shadcn/ui components** for consistent design
- CSS variables defined for theme colors and spacing
- Responsive design with mobile-first approach

### File Organization
- Keep components in appropriate directories (`ui/` for reusable, `layout/` for structure)
- TypeScript interfaces in `src/types/index.ts`
- Utility functions in `src/lib/utils.ts`
- Custom hooks in `src/hooks/`

## AI Detection System

### MobileFaceNet Integration
- **Model**: `output_model.tflite` - MobileFaceNet for 128-dimensional face embeddings
- **Framework**: Uses TensorFlow Lite or tflite-web for browser-based inference
- **Preprocessing**: Images resized to 112x112, normalized to [-1, 1] range
- **Similarity Threshold**: Default 0.75 for face matching (configurable)

### Database Architecture
- **Primary Database**: Supabase for persistent storage of embeddings and case data
- **Local Fallback**: Browser localStorage for offline demo capabilities
- **Real-time Sync**: Supabase real-time subscriptions for live alerts across clients

### Supabase Database Schema
```sql
-- Missing persons with face embeddings
CREATE TABLE missing_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  last_known_location TEXT,
  description TEXT,
  case_number TEXT UNIQUE,
  reported_by TEXT,
  status TEXT DEFAULT 'active',
  date_reported TIMESTAMP DEFAULT NOW(),
  face_embedding VECTOR(128),  -- Supabase pgvector extension
  created_at TIMESTAMP DEFAULT NOW()
);

-- Face photos with multiple angles per person
CREATE TABLE face_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES missing_persons(id),
  photo_url TEXT,
  embedding VECTOR(128),
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI detection alerts
CREATE TABLE detection_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES missing_persons(id),
  detection_time TIMESTAMP DEFAULT NOW(),
  location TEXT,
  similarity_score FLOAT,
  camera_id TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'new',
  verified_by UUID REFERENCES auth.users(id),
  embedding VECTOR(128),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Camera configuration
CREATE TABLE cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  coordinates POINT,
  status TEXT DEFAULT 'active',
  detection_threshold FLOAT DEFAULT 0.75,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Face Recognition Architecture
```
src/
├── services/
│   ├── supabase/
│   │   ├── supabaseClient.ts           # Supabase client configuration
│   │   ├── storage.ts                  # Image upload to Supabase Storage
│   │   └── realtime.ts                 # Real-time subscriptions
│   ├── faceRecognition/
│   │   ├── FaceDetectionService.ts     # MediaPipe face detection & cropping
│   │   ├── EmbeddingService.ts         # MobileFaceNet embedding generation
│   │   ├── MatchingService.ts          # Cosine similarity calculation
│   │   └── models/
│   │       └── output_model.tflite     # MobileFaceNet model
│   ├── database/
│   │   ├── MissingPersonsService.ts    # CRUD operations with embeddings
│   │   ├── AlertsService.ts            # Alert management
│   │   └── CacheService.ts             # LocalStorage fallback
│   └── camera/
│       ├── CameraService.ts            # Camera feed integration
│       └── ImageProcessor.ts           # Real-time frame processing
```

### Enhanced Data Models
**Missing Person Interface** (with database sync):
```typescript
export interface MissingPerson {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  lastKnownLocation: string;
  description: string;
  caseNumber: string;
  reportedBy: string;
  status: 'active' | 'found' | 'closed';
  dateReported: string;
  faceEmbedding?: number[];        // 128-dimensional embedding
  photos: FacePhoto[];            // Multiple photos with embeddings
  detectionSettings?: {
    minSimilarity: number;        // Matching threshold
    activeAlerts: boolean;
  };
}

export interface FacePhoto {
  id: string;
  personId: string;
  photoUrl: string;
  embedding: number[];
  confidence: number;
  createdAt: string;
}
```

**Alert Interface** (real-time sync):
```typescript
export interface Alert {
  id: string;
  personId: string;
  personName: string;
  detectionTime: string;
  location: string;
  similarityScore: number;        // Match confidence (0-1)
  imageUrl: string;
  cameraId: string;
  status: 'new' | 'verified' | 'false_positive';
  verifiedBy?: string;
  embeddingComparison: {
    registeredEmbedding: number[];
    detectedEmbedding: number[];
  };
  detectionMetadata: {
    modelVersion: string;
    processingTime: number;
    threshold: number;
  };
}
```

### Implementation Workflow

**Phase 1: Supabase Setup & Registration**
1. Configure Supabase project with pgvector extension for embeddings
2. Extend `CaseManagement.tsx` with photo upload and face detection
3. Generate embeddings and store both in Supabase and localStorage
4. Implement real-time sync between local cache and database

**Phase 2: Camera Integration & Detection**
1. Enhance `Cameras.tsx` with camera management (stored in Supabase)
2. Implement real-time frame processing with face detection
3. Store detection results and generate alerts in Supabase
4. Use Supabase real-time subscriptions for live alert updates

**Phase 3: Real-time Multi-client Alerts**
1. Upgrade `Alerts.tsx` with real-time Supabase subscriptions
2. Show live alerts across all connected clients
3. Implement alert verification with Supabase user authentication
4. Add offline support with localStorage fallback

### Database Services Implementation

**Supabase Client Configuration**:
```typescript
// src/services/supabase/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

**Missing Persons Service with Sync**:
```typescript
// src/services/database/MissingPersonsService.ts
class MissingPersonsService {
  // Create missing person with embeddings
  async createWithEmbeddings(data: MissingPersonFormData): Promise<MissingPerson> {
    // Upload photos to Supabase Storage
    // Generate embeddings using MobileFaceNet
    // Store in Supabase database with pgvector
    // Cache in localStorage for offline access
  }

  // Real-time subscriptions for live updates
  subscribeToUpdates(callback: (person: MissingPerson) => void) {
    return supabase
      .channel('missing_persons_updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'missing_persons' },
        callback
      )
      .subscribe();
  }
}
```

**AI Detection Service with Database Integration**:
```typescript
// src/services/faceRecognition/MatchingService.ts
class MatchingService {
  async findMatches(detectedEmbedding: number[]): Promise<PotentialMatch[]> {
    // Query Supabase for similar embeddings using pgvector
    const { data: matches } = await supabase.rpc('find_similar_faces', {
      query_embedding: detectedEmbedding,
      similarity_threshold: 0.75
    });

    // Fallback to localStorage if offline
    if (!matches && navigator.onLine === false) {
      return this.findLocalMatches(detectedEmbedding);
    }

    return matches || [];
  }
}
```

### Supabase SQL Functions for Vector Search
```sql
-- Create function for finding similar faces
CREATE OR REPLACE FUNCTION find_similar_faces(
  query_embedding VECTOR(128),
  similarity_threshold FLOAT DEFAULT 0.75
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  similarity FLOAT,
  photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.id,
    mp.name,
    1 - (mp.face_embedding <=> query_embedding) as similarity,
    fp.photo_url
  FROM missing_persons mp
  LEFT JOIN face_photos fp ON mp.id = fp.person_id
  WHERE 1 - (mp.face_embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC;
END;
$$ LANGUAGE plpgsql;
```

### Hybrid Storage Strategy
- **Online**: All operations use Supabase with real-time sync
- **Offline**: LocalStorage provides full functionality cache
- **Sync**: Automatic bidirectional sync when connection restored
- **Performance**: Local cache for frequently accessed embeddings

## Important Notes

- **Supabase + Local Fallback**: Primary database with offline support
- **Real-time Multi-client**: Live alerts across all connected devices
- **Browser AI Processing**: MobileFaceNet runs client-side for privacy
- **Vector Database**: pgvector extension for efficient similarity search
- **Modern React**: Uses React 19 features and latest patterns
- **Accessibility**: Built on Radix UI primitives for accessibility

## Common Development Tasks

When adding new features:
1. Define TypeScript interfaces in `src/types/index.ts`
2. Create reusable components in `src/components/ui/` if needed
3. Add pages to `src/pages/` and update routing in `App.tsx`
4. Follow role-based access patterns if feature is auth-protected
5. Use existing design patterns from shadcn/ui components

When modifying authentication:
- Update `DUMMY_USERS` and `DUMMY_PASSWORDS` in `AuthContext.tsx`
- Ensure role-based access control is properly implemented
- Test all user roles and their permissions