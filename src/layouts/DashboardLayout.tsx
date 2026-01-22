// layouts/DashboardLayout.tsx
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-screen flex">
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default DashboardLayout;
