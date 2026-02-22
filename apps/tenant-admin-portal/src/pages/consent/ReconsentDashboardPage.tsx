import { useQuery } from '@tanstack/react-query';
import { listReconsentRequirements, type ReconsentRequirementItem } from '@/lib/api/consent';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';

export function ReconsentDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reconsent-requirements'],
    queryFn: listReconsentRequirements,
  });

  const required = data?.filter((r) => r.status === 'REQUIRED') ?? [];
  const satisfied = data?.filter((r) => r.status === 'SATISFIED') ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Re-consent Required</h1>
        <p className="mt-1 text-sm text-gray-600">
          When a purpose scope is widened (more data collected than previously consented),
          existing consents are automatically invalidated and users must re-consent before
          their data can be processed under the updated purpose.
        </p>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Loading…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load: {(error as Error)?.message ?? 'Unknown error'}
        </div>
      )}

      {/* Summary */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="text-xs font-medium text-amber-700">Pending Re-consent</div>
            <div className="mt-1 text-3xl font-bold text-amber-900">{required.length}</div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4">
            <div className="text-xs font-medium text-green-700">Satisfied</div>
            <div className="mt-1 text-3xl font-bold text-green-900">{satisfied.length}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
            <div className="text-xs font-medium text-gray-500">Total</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">{data?.length ?? 0}</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <RefreshCw className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No re-consent requirements</h3>
          <p className="mt-2 text-sm text-gray-500">
            Re-consent is triggered automatically when a purpose scope is widened and
            users have existing consents under the old scope.
          </p>
        </div>
      )}

      {/* Pending section */}
      {required.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Clock className="h-4 w-4" />
            Pending ({required.length})
          </h2>
          <div className="space-y-2">
            {required.map((r) => (
              <ReconsentRow key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}

      {/* Satisfied section */}
      {satisfied.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-800">
            <CheckCircle className="h-4 w-4" />
            Satisfied ({satisfied.length})
          </h2>
          <div className="space-y-2">
            {satisfied.map((r) => (
              <ReconsentRow key={r.id} item={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReconsentRow({ item }: { item: ReconsentRequirementItem }) {
  const isPending = item.status === 'REQUIRED';
  const createdDate = new Date(item.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const satisfiedDate = item.satisfiedAt
    ? new Date(item.satisfiedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        isPending
          ? 'border-amber-200 bg-amber-50'
          : 'border-green-100 bg-green-50'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isPending
              ? 'bg-amber-100 text-amber-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {isPending ? 'Pending' : 'Satisfied'}
        </span>
        <span className="text-sm font-medium text-gray-900 capitalize">{item.purposeKey}</span>
        <span className="text-xs text-gray-500">· user {item.dataPrincipalId.slice(0, 8)}…</span>
        <span className="ml-auto text-xs text-gray-400">Created {createdDate}</span>
      </div>
      {satisfiedDate && (
        <p className="mt-1 text-xs text-green-700">Satisfied on {satisfiedDate}</p>
      )}
    </div>
  );
}

