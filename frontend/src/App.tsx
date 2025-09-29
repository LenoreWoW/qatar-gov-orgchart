import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { PageLoader, RouteLoader } from './components/ui/PageLoader';
import { ErrorBoundary, SectionErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy load page components for code splitting
const LoginForm = React.lazy(() =>
  import('./components/auth/LoginForm').then(module => ({ default: module.LoginForm }))
);
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then(module => ({ default: module.Dashboard }))
);
const OrganizationChartPage = React.lazy(() =>
  import('./App-MVP').then(module => ({ default: module.App }))
);
const PositionManagement = React.lazy(() =>
  import('./pages/PositionManagement').then(module => ({ default: module.PositionManagement }))
);
const AttributeManagement = React.lazy(() =>
  import('./pages/AttributeManagement').then(module => ({ default: module.AttributeManagement }))
);
const UserManagement = React.lazy(() =>
  import('./pages/UserManagement').then(module => ({ default: module.UserManagement }))
);
const ComplianceDashboard = React.lazy(() =>
  import('./pages/ComplianceDashboard').then(module => ({ default: module.ComplianceDashboard }))
);
const DataRetentionManagement = React.lazy(() =>
  import('./pages/DataRetentionManagement').then(module => ({
    default: module.DataRetentionManagement,
  }))
);
const ExportManagement = React.lazy(() =>
  import('./pages/ExportManagement').then(module => ({ default: module.ExportManagement }))
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader message="Loading authentication..." />}>
              <LoginForm />
            </Suspense>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <SectionErrorBoundary section="Dashboard">
                <Suspense fallback={<RouteLoader message="Loading dashboard..." />}>
                  <Dashboard />
                </Suspense>
              </SectionErrorBoundary>
            }
          />
          <Route
            path="organization-chart"
            element={
              <SectionErrorBoundary section="Organization Chart">
                <Suspense fallback={<RouteLoader message="Loading organization chart..." />}>
                  <OrganizationChartPage />
                </Suspense>
              </SectionErrorBoundary>
            }
          />
          <Route
            path="positions"
            element={
              <Suspense fallback={<RouteLoader message="Loading position management..." />}>
                <PositionManagement />
              </Suspense>
            }
          />
          <Route
            path="attributes"
            element={
              <Suspense fallback={<RouteLoader message="Loading attribute management..." />}>
                <AttributeManagement />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <SectionErrorBoundary section="User Management">
                <Suspense fallback={<RouteLoader message="Loading user management..." />}>
                  <UserManagement />
                </Suspense>
              </SectionErrorBoundary>
            }
          />
          <Route
            path="compliance"
            element={
              <Suspense fallback={<RouteLoader message="Loading compliance dashboard..." />}>
                <ComplianceDashboard />
              </Suspense>
            }
          />
          <Route
            path="data-retention"
            element={
              <Suspense fallback={<RouteLoader message="Loading data retention..." />}>
                <DataRetentionManagement />
              </Suspense>
            }
          />
          <Route
            path="exports"
            element={
              <Suspense fallback={<RouteLoader message="Loading export management..." />}>
                <ExportManagement />
              </Suspense>
            }
          />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
        // In production, send to monitoring service
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="App">
            <AppRoutes />
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
