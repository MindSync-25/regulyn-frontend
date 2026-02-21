import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * AppShell layout component
 * Provides the main application layout with unified header and sidebar
 */
export function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Topbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
