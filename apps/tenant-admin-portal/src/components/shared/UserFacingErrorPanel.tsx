import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { getUserFacingError } from '@/lib/api/errorMessages';

type Props = {
  error: unknown;
  className?: string;
};

export function UserFacingErrorPanel({ error, className }: Props) {
  const navigate = useNavigate();

  const uiError = useMemo(() => getUserFacingError(error), [error]);

  const runAction = (action: { kind: 'refresh' | 'login' }) => {
    if (action.kind === 'refresh') {
      window.location.reload();
      return;
    }
    navigate('/login');
  };

  return (
    <div className={className ?? 'rounded-lg border border-red-200 bg-red-50 p-6'}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{uiError.title}</h3>
          <p className="mt-1 text-sm text-red-700">{uiError.message}</p>
          {(uiError.primaryAction || uiError.secondaryAction) && (
            <div className="mt-3 flex gap-2">
              {uiError.primaryAction && (
                <button
                  type="button"
                  onClick={() => runAction(uiError.primaryAction!)}
                  className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                >
                  {uiError.primaryAction.label}
                </button>
              )}
              {uiError.secondaryAction && (
                <button
                  type="button"
                  onClick={() => runAction(uiError.secondaryAction!)}
                  className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
                >
                  {uiError.secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
