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

function App() {
  return (
  <>
   <Toaster
        // position="top-right"
        // richColors
        // closeButton
        duration={1800}
      />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        <Route
              path="/login"
              element={
                <AuthGuard requireAuth={false}>
                  <DashboardLayout>
                    <LoginPage />
                  </DashboardLayout>
                </AuthGuard>
              }
            />
            
            <Route
              path="/signup"
              element={
                <AuthGuard requireAuth={false}>
                  <DashboardLayout>
                    <SignUpPage />
                  </DashboardLayout>
                </AuthGuard>
              }
            />

            {/* Protected routes - require authentication */}
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
                <DocumentPage />
              </AuthGuard>
            }
          />
          

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </>
  );
}

export default App;
