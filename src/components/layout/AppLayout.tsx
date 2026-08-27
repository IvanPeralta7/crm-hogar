import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { DemoBanner } from './DemoBanner';
import { isDemoMode } from '../../lib/demoMode';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen grid-bg flex">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {isDemoMode && <DemoBanner />}
        {children}
      </main>
    </div>
  );
}
