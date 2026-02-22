/**
 * RopaDetailPage — Single Processing Activity Detail
 * Backend: ropa-inventory-service (port 8085)
 * Route: /app/governance/ropa/:activityId
 * RBAC: TENANT_ADMIN, DPO, REVIEWER
 *
 * Features:
 *  - Activity metadata (from GET /activities/:id which returns Map<String,Object>)
 *  - Cross-border transfers (filtered by activityId)
 *  - EvidenceDrawer for audit trail
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  FileText,
  Globe,
  Package,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { getActivity, listCrossBorderTransfers } from '@/lib/api/ropa';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleString();
}

function Field({ label, value }: { label: string; value?: unknown }) {
  const display = value == null || value === '' ? '—' : String(value);
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm">{display}</dd>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RopaDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const activityQuery = useQuery({
    queryKey: ['ropa-activity', activityId],
    queryFn: () => getActivity(activityId!),
    enabled: !!activityId,
  });

  const crossBorderQuery = useQuery({
    queryKey: ['ropa-cross-border', activityId],
    queryFn: () => listCrossBorderTransfers({ activityId: activityId! }),
    enabled: !!activityId,
  });

  const activity = activityQuery.data;

  if (activityQuery.isError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/governance/ropa')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to ROPA
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load activity</p>
          <p className="text-red-700 mt-1">
            {activityQuery.error instanceof Error
              ? activityQuery.error.message
              : 'An unexpected error occurred.'}
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => activityQuery.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (activityQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-6 w-40 bg-gray-200 rounded" />
        <div className="animate-pulse rounded-lg border h-64 bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/governance/ropa')} className="mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to ROPA
        </Button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              {String(activity?.activityName ?? activityId)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Activity ID: <code className="font-mono text-xs">{activityId}</code>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => activityQuery.refetch()}
              disabled={activityQuery.isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${activityQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEvidenceOpen(true)}
            >
              <Package className="h-4 w-4 mr-1" />
              Evidence & Audit
            </Button>
          </div>
        </div>
      </div>

      {/* Metadata Card */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          Activity Metadata
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
          <Field label="Status" value={String(activity?.status ?? '—')} />
          <Field label="Version" value={String(activity?.versionNumber ?? '—')} />
          <Field label="Lawful Basis" value={String(activity?.lawfulBasis ?? '—')} />
          <Field label="Risk Level" value={String(activity?.riskLevel ?? '—')} />
          <Field label="Data Principal Type" value={String(activity?.dataPrincipalType ?? '—')} />
          <Field label="Retention Policy" value={String(activity?.retentionPolicy ?? '—')} />
          <Field label="Retention Days" value={activity?.retentionDays != null ? String(activity.retentionDays) : '—'} />
          <Field label="Purpose" value={String(activity?.purpose ?? '—')} />
          <Field label="Published At" value={fmtDate(activity?.publishedAt as string | null)} />
          <Field label="Created At" value={fmtDate(activity?.createdAt as string | null)} />
          <Field label="Enabled" value={activity?.enabled != null ? (activity.enabled ? 'Yes' : 'No') : '—'} />
        </dl>
        {activity?.description != null && (
          <div className="mt-4 pt-4 border-t">
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</dt>
            <dd className="text-sm">{String(activity.description)}</dd>
          </div>
        )}
      </div>

      {/* Cross-Border Transfers Card */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-indigo-500" />
          Cross-Border Transfers
        </h2>
        {crossBorderQuery.isLoading && (
          <div className="animate-pulse space-y-2">
            {[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        )}
        {crossBorderQuery.isError && (
          <p className="text-sm text-red-700 bg-red-50 rounded p-3">
            Failed to load cross-border transfers.
          </p>
        )}
        {!crossBorderQuery.isLoading && !crossBorderQuery.isError && (
          <>
            {(crossBorderQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No cross-border transfers registered for this activity.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Source Region</th>
                      <th className="text-left px-3 py-2 font-medium">Destination Region</th>
                      <th className="text-left px-3 py-2 font-medium">Mechanism</th>
                      <th className="text-left px-3 py-2 font-medium">Frequency</th>
                      <th className="text-left px-3 py-2 font-medium">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {crossBorderQuery.data!.map((t, idx) => (
                      <tr key={t.transferId ?? idx} className="hover:bg-muted/20">
                        <td className="px-3 py-2">{t.sourceRegion ?? '—'}</td>
                        <td className="px-3 py-2">{t.destinationRegion ?? '—'}</td>
                        <td className="px-3 py-2">{t.transferMechanism ?? '—'}</td>
                        <td className="px-3 py-2">{t.transferFrequency ?? '—'}</td>
                        <td className="px-3 py-2">
                          {t.active ? (
                            <Badge className="bg-green-100 text-green-900">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="ropa_activity"
        objectId={activityId}
        title="Activity Evidence & Audit"
      />
    </div>
  );
}
