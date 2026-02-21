import { QueryProvider } from './providers/QueryProvider';
import { GlobalToaster } from '@/components/GlobalToaster';
import { AppRoutes } from './routes';

export function App() {
  return (
    <QueryProvider>
      <AppRoutes />
      <GlobalToaster />
    </QueryProvider>
  );
}
