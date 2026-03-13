import { useQuery } from '@tanstack/react-query';
import { listPurposeVersions, type PurposeVersionListItem } from '@/lib/api/consent';
import { BookOpen, Clock, Database, Cpu, Users } from 'lucide-react';

function groupByPurpose(items: PurposeVersionListItem[]): Map<string, PurposeVersionListItem[]> {
  const map = new Map<string, PurposeVersionListItem[]>();
  for (const item of items) {
    const list = map.get(item.purposeKey) ?? [];
    list.push(item);
    map.set(item.purposeKey, list);
  }
  return map;
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    green: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  );
}

function ScopeRow({ icon: Icon, label, items }: { icon: React.ElementType; label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
      <div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {items.map((item) => (
            <Pill key={item} color="blue">{item}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PurposesHistoryPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['purpose-versions'],
    queryFn: listPurposeVersions,
  });

  const grouped = data ? groupByPurpose(data) : new Map();
  const totalPurposes = grouped.size;
  const totalVersions = data?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purposes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Every time a notice is published with a scope, a purpose version is recorded here.
          If the scope widens (more data collected), old consents are automatically invalidated and re-consent is requested.
        </p>
      </div>

      {/* Summary cards */}
      {!isLoading && !isError && totalPurposes > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="text-xs font-medium text-gray-500">Purposes</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">{totalPurposes}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="text-xs font-medium text-gray-500">Total Versions</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">{totalVersions}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
            <div className="text-xs font-medium text-gray-500">With Scope Changes</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">
              {[...grouped.values()].filter((vs) => vs.length > 1).length}
            </div>
          </div>
        </div>
      )}

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

      {!isLoading && !isError && grouped.size === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No purpose versions yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Publish a notice with a scope to create the first purpose version.
          </p>
        </div>
      )}

      {/* One card per purpose */}
      {[...grouped.entries()].map(([purposeKey, versions]) => {
        const current = versions[0];
        const hasHistory = versions.length > 1;
        return (
          <div key={purposeKey} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Purpose title bar */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                <BookOpen className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 capitalize">{purposeKey}</div>
                <div className="text-xs text-gray-500">
                  {versions.length} scope version{versions.length !== 1 ? 's' : ''}
                  {hasHistory ? ' · scope has changed' : ' · scope stable'}
                </div>
              </div>
              {/* Current version badges */}
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {current.legalBasis && (
                  <Pill color="purple">⚖ {current.legalBasis}</Pill>
                )}
                {current.retentionDays != null && (
                  <Pill color="orange">⏱ {current.retentionDays}d retention</Pill>
                )}
                <Pill color="green">v{current.versionNum} current</Pill>
              </div>
            </div>

            {/* Current scope */}
            <div className="px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Current Scope</div>
              <div className="space-y-2">
                <ScopeRow icon={Database} label="Data categories" items={current.dataCategories} />
                <ScopeRow icon={Cpu} label="Processing activities" items={current.processingActivities} />
                <ScopeRow icon={Users} label="Data fields" items={current.dataFields} />
              </div>
              {(current.dataCategories?.length ?? 0) === 0 &&
               (current.dataFields?.length ?? 0) === 0 &&
               (current.processingActivities?.length ?? 0) === 0 && (
                <p className="text-sm text-gray-400 italic">No scope fields were defined when this version was published.</p>
              )}
            </div>

            {/* Version history timeline */}
            {hasHistory && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Version History</div>
                <ol className="relative border-l border-gray-200 space-y-4 ml-2">
                  {versions.map((pv: any, idx: number) => (
                    <li key={pv.purposeVersionId} className="ml-4">
                      <div className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white ${
                        idx === 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-semibold ${
                          idx === 0 ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          v{pv.versionNum} {idx === 0 ? '· Current' : '· Superseded'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {new Date(pv.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <code className="mt-1 block text-[11px] text-gray-400">
                        hash: {pv.scopeHash.slice(0, 20)}…
                      </code>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

