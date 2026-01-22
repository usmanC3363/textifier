import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import './index.css';

// Pages
import LoginPage from '@/features/auth/pages/LoginPage';
import SignUpPage from '@/features/auth/pages/SignupPage';
import DashboardPage from '@/pages/(dashboard)/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import DocumentPage from './pages/DocumentPage';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<DashboardLayout><LoginPage /></DashboardLayout>} />
          <Route path="/signup" element={<DashboardLayout><SignUpPage /></DashboardLayout>} />
          

          <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />

          <Route path="/document/:id" element={<DashboardLayout><DocumentPage /></DashboardLayout>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
