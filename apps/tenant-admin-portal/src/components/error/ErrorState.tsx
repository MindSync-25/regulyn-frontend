import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Generic error state component
 * Displays error message with optional retry button
 */
export function ErrorState({
  title = 'Error',
  message = 'Something went wrong. Please try again.',
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 text-sm text-muted-foreground max-w-md">{message}</p>
        
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
