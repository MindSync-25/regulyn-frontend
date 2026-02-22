/**
 * SharingLogsPage — Vendor Data Sharing Records + Access Telemetry
 * Backend: vendor-sharing-service (port 8090)
 * Route: /app/governance/sharing
 * RBAC: TENANT_ADMIN, DPO
 *
 * Features:
 *  - Sharing Records list with server-side pagination + filters
 *  - Access Telemetry tab (requires vendorId + date range — read-only)
 *  - EvidenceDrawer per sharing record
 *
 * Limitations:
 *  - Access Telemetry requires vendorId OR subjectRef + from/to (backend enforces).
 *    Max range 90 days.
 *  - No write operations for sharing records exposed here (create via API).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Share2,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import {
  listSharingRecords,
  listVendors,
  queryAccessEvents,
  type SharingRecordItem,
  type VendorItem,
  type VendorAccessEvent,
} from '@/lib/api/vendors';

type Tab = 'sharing' | 'telemetry';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString();
}

function fmtDateTime(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleString();
}

function StatusBadge({ enabled }: { enabled?: boolean | null }) {
  if (enabled == null) return <Badge variant="outline">—</Badge>;
  return enabled ? (
    <Badge className="bg-green-100 text-green-900">Active</Badge>
  ) : (
    <Badge variant="secondary">Disabled</Badge>
  );
}

function CrossBorderBadge({ flag }: { flag?: boolean | null }) {
  if (flag == null) return <span className="text-muted-foreground text-sm">—</span>;
  return flag ? (
    <Badge className="bg-purple-100 text-purple-900">Cross-border</Badge>
  ) : (
    <Badge variant="outline">Domestic</Badge>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SharingLogsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sharing');

  // Sharing Records state
  const [sharingVendorId, setSharingVendorId] = useState('');
  const [transferCrossBorder, setTransferCrossBorder] = useState<'all' | 'true' | 'false'>('all');
  const [sharingEnabled, setSharingEnabled] = useState<'all' | 'true' | 'false'>('all');
  const [sharingPage, setSharingPage] = useState(0);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [selectedSharingId, setSelectedSharingId] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(true);

  // Access Telemetry state
  const [telemVendorId, setTelemVendorId] = useState('');
  const [telemFrom, setTelemFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [telemTo, setTelemTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [telemPage, setTelemPage] = useState(0);
  const [telemApplied, setTelemApplied] = useState(false);

  // Fetch vendors for dropdown
  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: () => listVendors(),
  });
  const vendors: VendorItem[] = vendorsQuery.data ?? [];

  // Sharing Records query
  const sharingQuery = useQuery({
    queryKey: [
      'sharing-records',
      { sharingVendorId, transferCrossBorder, sharingEnabled, sharingPage },
    ],
    queryFn: () =>
      listSharingRecords({
        vendorId: sharingVendorId || undefined,
        transferCrossBorder: transferCrossBorder === 'all' ? undefined : transferCrossBorder === 'true',
        enabled: sharingEnabled === 'all' ? undefined : sharingEnabled === 'true',
        page: sharingPage,
        size: 20,
      }),
    enabled: activeTab === 'sharing',
  });

  const sharingData = sharingQuery.data;
  const sharingRecords: SharingRecordItem[] = sharingData?.content ?? [];
  const sharingTotalPages = sharingData?.totalPages ?? 0;
  const sharingTotal = sharingData?.totalElements ?? 0;

  // Access Telemetry query (only when explicitly applied)
  const telemQuery = useQuery({
    queryKey: ['vendor-access-events', { telemVendorId, telemFrom, telemTo, telemPage }],
    queryFn: () =>
      queryAccessEvents({
        vendorId: telemVendorId || undefined,
        from: new Date(telemFrom).toISOString(),
        to: new Date(telemTo + 'T23:59:59').toISOString(),
        page: telemPage,
        size: 50,
      }),
    enabled: activeTab === 'telemetry' && telemApplied && !!telemVendorId,
  });

  const telemEvents: VendorAccessEvent[] = telemQuery.data?.content ?? [];
  const telemTotal = telemQuery.data?.totalElements ?? 0;
  const telemTotalPages = telemQuery.data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="h-6 w-6 text-purple-600" />
            Data Sharing Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sharing records and vendor access telemetry
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)}>
            <Filter className="h-4 w-4 mr-1" /> Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => activeTab === 'sharing' ? sharingQuery.refetch() : telemQuery.refetch()}
            disabled={sharingQuery.isFetching || telemQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['sharing', 'telemetry'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'sharing' ? 'Sharing Records' : 'Access Telemetry'}
          </button>
        ))}
      </div>

      {/* ── SHARING RECORDS TAB ── */}
      {activeTab === 'sharing' && (
        <>
          {/* Filters */}
          {showFilters && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs mb-1 block">Vendor</Label>
                  <select
                    className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                    value={sharingVendorId}
                    onChange={e => { setSharingVendorId(e.target.value); setSharingPage(0); }}
                  >
                    <option value="">All Vendors</option>
                    {vendors.map(v => (
                      <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Cross-Border</Label>
                  <select
                    className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                    value={transferCrossBorder}
                    onChange={e => { setTransferCrossBorder(e.target.value as 'all' | 'true' | 'false'); setSharingPage(0); }}
                  >
                    <option value="all">All</option>
                    <option value="true">Cross-border only</option>
                    <option value="false">Domestic only</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Status</Label>
                  <select
                    className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                    value={sharingEnabled}
                    onChange={e => { setSharingEnabled(e.target.value as 'all' | 'true' | 'false'); setSharingPage(0); }}
                  >
                    <option value="all">All</option>
                    <option value="true">Active only</option>
                    <option value="false">Disabled only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {!sharingQuery.isLoading && !sharingQuery.isError && (
            <p className="text-sm text-muted-foreground">
              {sharingTotal} sharing record{sharingTotal !== 1 ? 's' : ''}
            </p>
          )}

          {/* Error */}
          {sharingQuery.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Failed to load sharing records</p>
              <p className="text-red-700 mt-1">
                {sharingQuery.error instanceof Error ? sharingQuery.error.message : 'Unexpected error.'}
              </p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => sharingQuery.refetch()}>Retry</Button>
            </div>
          )}

          {/* Loading */}
          {sharingQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-14 rounded-lg border bg-gray-50" />)}
            </div>
          )}

          {/* Empty */}
          {!sharingQuery.isLoading && !sharingQuery.isError && sharingRecords.length === 0 && (
            <div className="flex min-h-[250px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
              <div className="text-center p-6">
                <Share2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="font-semibold">No sharing records found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting filters or add records via the backend.</p>
              </div>
            </div>
          )}

          {/* Table */}
          {!sharingQuery.isLoading && sharingRecords.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Purpose</th>
                    <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Lawful Basis</th>
                    <th className="text-left px-4 py-2 font-medium">Transfer</th>
                    <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Start</th>
                    <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">End</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sharingRecords.map((r: SharingRecordItem) => (
                    <tr key={r.sharingId} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.sharingPurpose}</div>
                        <div className="text-xs text-muted-foreground">{r.frequency ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.lawfulBasis}</td>
                      <td className="px-4 py-3"><CrossBorderBadge flag={r.transferCrossBorder} /></td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{fmtDate(r.startAt)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{fmtDate(r.endAt)}</td>
                      <td className="px-4 py-3"><StatusBadge enabled={r.enabled} /></td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedSharingId(r.sharingId); setEvidenceOpen(true); }}
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {sharingTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {sharingPage + 1} of {sharingTotalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setSharingPage(p => Math.max(0, p - 1))} disabled={sharingPage === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSharingPage(p => Math.min(sharingTotalPages - 1, p + 1))} disabled={sharingPage >= sharingTotalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ACCESS TELEMETRY TAB ── */}
      {activeTab === 'telemetry' && (
        <>
          <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm text-blue-800">
            <strong>Access Telemetry</strong> requires selecting a vendor and date range (max 90 days).
            Events ingested via the scanner/connector telemetry pipeline appear here.
          </div>

          {/* Telemetry Filters */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs mb-1 block">Vendor (required)</Label>
                <select
                  className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                  value={telemVendorId}
                  onChange={e => setTelemVendorId(e.target.value)}
                >
                  <option value="">Select vendor…</option>
                  {vendors.map(v => (
                    <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">From</Label>
                <Input
                  type="date"
                  value={telemFrom}
                  onChange={e => setTelemFrom(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">To</Label>
                <Input
                  type="date"
                  value={telemTo}
                  onChange={e => setTelemTo(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => { setTelemPage(0); setTelemApplied(true); telemQuery.refetch(); }}
                disabled={!telemVendorId}
              >
                <Activity className="h-4 w-4 mr-1" /> Load Telemetry
              </Button>
            </div>
          </div>

          {/* Telemetry Error */}
          {telemQuery.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Failed to load telemetry</p>
              <p className="text-red-700 mt-1">
                {telemQuery.error instanceof Error ? telemQuery.error.message : 'Unexpected error.'}
              </p>
            </div>
          )}

          {/* Telemetry Loading */}
          {telemQuery.isFetching && (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="animate-pulse h-10 rounded-lg border bg-gray-50" />)}</div>
          )}

          {/* Telemetry Empty */}
          {telemApplied && !telemQuery.isFetching && !telemQuery.isError && telemEvents.length === 0 && (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
              <div className="text-center p-4">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No telemetry events found in this range.</p>
              </div>
            </div>
          )}

          {/* Telemetry Table */}
          {telemApplied && !telemQuery.isFetching && telemEvents.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">{telemTotal} events</p>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Accessed At</th>
                      <th className="text-left px-3 py-2 font-medium">System</th>
                      <th className="text-left px-3 py-2 font-medium">Access Type</th>
                      <th className="text-left px-3 py-2 font-medium">Result</th>
                      <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Subject</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {telemEvents.map((e: VendorAccessEvent, idx) => (
                      <tr key={e.eventId ?? idx} className="hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{fmtDateTime(e.accessedAt)}</td>
                        <td className="px-3 py-2">{e.systemName ?? '—'}</td>
                        <td className="px-3 py-2">{e.accessType ?? '—'}</td>
                        <td className="px-3 py-2">
                          {e.result === 'SUCCESS' ? (
                            <Badge className="bg-green-100 text-green-900">SUCCESS</Badge>
                          ) : e.result === 'DENIED' ? (
                            <Badge className="bg-red-100 text-red-900">DENIED</Badge>
                          ) : (
                            <Badge variant="outline">{e.result ?? '—'}</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{e.subjectRef ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Telemetry Pagination */}
              {telemTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Page {telemPage + 1} of {telemTotalPages}</p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setTelemPage(p => Math.max(0, p - 1))} disabled={telemPage === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTelemPage(p => Math.min(telemTotalPages - 1, p + 1))} disabled={telemPage >= telemTotalPages - 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => { setEvidenceOpen(false); setSelectedSharingId(undefined); }}
        objectType="sharing_record"
        objectId={selectedSharingId}
        title="Sharing Record Evidence & Audit"
      />
    </div>
  );
}
