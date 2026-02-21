import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-[600px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-10 w-10 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold mb-2">403</h1>
        <h2 className="text-2xl font-semibold mb-4">Access Forbidden</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          You don't have permission to access this resource. Please contact your
          administrator if you believe you should have access.
        </p>
        
        <Button onClick={() => navigate('/')} variant="default">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
