import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import './index.css';

// Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import SignUpPage from '@/features/auth/pages/SignupPage';
import DashboardPage from '@/pages/(dashboard)/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import DocumentPage from './pages/documents/DocumentPage';
import { Toaster } from 'sonner';
import { AuthGuard } from './components/auth/AuthGuard';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { DocumentErrorBoundary } from '@/components/documents/DocumentErrorBoundary';
import { GuestGuard } from './components/auth/GuestGuard';

function App() {
  return (
    <>
      <Toaster duration={1800} />

      <BrowserRouter>
        <AuthProvider>
          <AppErrorBoundary>
            <Routes>

              <Route
                path="/login"
                element={
                  <GuestGuard>
                    <DashboardLayout>
                      <LoginPage />
                    </DashboardLayout>
                  </GuestGuard>
                }
              />

              <Route
                path="/signup"
                element={
                  <GuestGuard>
                    <DashboardLayout>
                      <SignUpPage />
                    </DashboardLayout>
                  </GuestGuard>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <AuthGuard requireAuth={true}>
                    <DashboardLayout>
                      <DashboardPage />
                    </DashboardLayout>
                  </AuthGuard>
                }
              />

              <Route
                path="/document/:documentId"
                element={
                  <AuthGuard requireAuth={true}>
                    <DocumentErrorBoundary>
                      <DocumentPage />
                    </DocumentErrorBoundary>
                  </AuthGuard>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Routes>
          </AppErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}


export default App;
