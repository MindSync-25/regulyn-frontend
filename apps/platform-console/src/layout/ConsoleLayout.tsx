import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { SupportModeBanner } from '@/features/support-mode/components/SupportModeBanner';

export function ConsoleLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <SupportModeBanner />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="w-full px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
