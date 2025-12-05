import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleDashboard } from '@/components/RoleDashboard';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { MapViewPage } from '@/pages/MapViewPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { LandingPage } from '@/pages/LandingPage';
import { CasesPage } from '@/pages/CasesPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { DetectionPage } from '@/pages/DetectionPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { HelpSupportPage } from '@/pages/HelpSupportPage';
import { MissingPersonsPublicPage } from '@/pages/MissingPersonsPublicPage';
import ArcFaceTestPage from '@/pages/ArcFaceTestPage';
import './App.css';

function MissingPersonsRoute() {
  const { user } = useAuth();

  // Only citizens and investigators can access missing persons database
  // Admin and case managers use Case Management instead
  if (user?.role === 'citizen' || user?.role === 'investigator') {
    return <MissingPersonsPublicPage />;
  }

  // Redirect others to their dashboard
  return <RoleDashboard />;
}

function CasesRoute() {
  const { user } = useAuth();

  // Only admin and case_manager can access case management
  if (user?.role === 'admin' || user?.role === 'case_manager') {
    return <CasesPage />;
  }

  // Redirect others to their dashboard
  return <RoleDashboard />;
}

function MapViewRoute() {
  const { user } = useAuth();

  // Only admin, case_manager, and investigator can access map view
  if (user?.role === 'admin' || user?.role === 'case_manager' || user?.role === 'investigator') {
    return <MapViewPage />;
  }

  // Redirect citizens to their dashboard
  return <RoleDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/public/missing-persons" element={<MissingPersonsPublicPage />} />
          <Route path="/test/arcface" element={<ArcFaceTestPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <RoleDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/cases" element={
            <ProtectedRoute>
              <CasesRoute />
            </ProtectedRoute>
          } />
          
          <Route path="/alerts" element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/detection" element={
            <ProtectedRoute>
              <DetectionPage />
            </ProtectedRoute>
          } />
          
          <Route path="/missing-persons" element={
            <ProtectedRoute>
              <MissingPersonsRoute />
            </ProtectedRoute>
          } />
          
          <Route path="/map" element={
            <ProtectedRoute>
              <MapViewRoute />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <PlaceholderPage 
                title="User Management"
                description="Manage system users and permissions"
                breadcrumbs={[
                  { title: 'Dashboard', href: '/dashboard' },
                  { title: 'Admin', href: '/admin' },
                  { title: 'User Management' }
                ]}
              />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <PlaceholderPage 
                title="System Settings"
                description="Configure system parameters and preferences"
                breadcrumbs={[
                  { title: 'Dashboard', href: '/dashboard' },
                  { title: 'Admin', href: '/admin' },
                  { title: 'Settings' }
                ]}
              />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/cameras" element={
            <ProtectedRoute>
              <PlaceholderPage 
                title="Camera Sources"
                description="Manage camera feeds and monitoring locations"
                breadcrumbs={[
                  { title: 'Dashboard', href: '/dashboard' },
                  { title: 'Admin', href: '/admin' },
                  { title: 'Camera Sources' }
                ]}
              />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/ai-config" element={
            <ProtectedRoute>
              <PlaceholderPage 
                title="AI Model Configuration"
                description="Configure AI detection models and parameters"
                breadcrumbs={[
                  { title: 'Dashboard', href: '/dashboard' },
                  { title: 'Admin', href: '/admin' },
                  { title: 'AI Configuration' }
                ]}
              />
            </ProtectedRoute>
          } />
          
          <Route path="/help" element={
            <ProtectedRoute>
              <HelpSupportPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
