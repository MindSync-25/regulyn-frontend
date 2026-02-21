import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-[600px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => navigate('/')} variant="default">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
