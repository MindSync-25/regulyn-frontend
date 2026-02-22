/**
 * VendorListPage — Vendor Registry
 * Backend: vendor-sharing-service (port 8090)
 * Route: /app/governance/vendors
 * RBAC: TENANT_ADMIN, DPO
 *
 * Features:
 *  - List all vendors (client-side search because backend returns List not Page)
 *  - Filters: enabled, riskLevel, free-text name search
 *  - Row click → /app/governance/vendors/:vendorId
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building, Filter, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listVendors, type VendorItem, type VendorRiskLevel } from '@/lib/api/vendors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: VendorRiskLevel }) {
  if (risk === 'HIGH') return <Badge className="bg-red-100 text-red-900">HIGH</Badge>;
  if (risk === 'MED') return <Badge className="bg-amber-100 text-amber-900">MED</Badge>;
  return <Badge className="bg-blue-100 text-blue-900">LOW</Badge>;
}

function EnabledBadge({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Badge className="bg-green-100 text-green-900">Active</Badge>
  ) : (
    <Badge variant="secondary">Disabled</Badge>
  );
}

function fmtDate(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VendorListPage() {
  const navigate = useNavigate();
  const [riskLevel, setRiskLevel] = useState<VendorRiskLevel | ''>('');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: () => listVendors(),
  });

  const vendors = vendorsQuery.data ?? [];

  // Client-side filtering (backend List has no pagination)
  const filtered = useMemo(() => {
    return vendors.filter((v: VendorItem) => {
      if (riskLevel && v.riskLevel !== riskLevel) return false;
      if (enabledFilter === 'enabled' && !v.enabled) return false;
      if (enabledFilter === 'disabled' && v.enabled) return false;
      if (q && !v.vendorName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [vendors, riskLevel, enabledFilter, q]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-6 w-6 text-indigo-600" />
            Vendor Registry
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} of {vendors.length} vendors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(f => !f)}
          >
            <Filter className="h-4 w-4 mr-1" /> Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => vendorsQuery.refetch()}
            disabled={vendorsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${vendorsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <select
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                value={enabledFilter}
                onChange={e => setEnabledFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
              >
                <option value="all">All</option>
                <option value="enabled">Active only</option>
                <option value="disabled">Disabled only</option>
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Risk Level</Label>
              <select
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value as VendorRiskLevel | '')}
              >
                <option value="">All</option>
                <option value="LOW">Low</option>
                <option value="MED">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Search Name</Label>
              <Input
                placeholder="Vendor name…"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="mt-3">
            <Button size="sm" variant="ghost" onClick={() => { setRiskLevel(''); setEnabledFilter('all'); setQ(''); }}>
              Clear filters
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {vendorsQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load vendors</p>
          <p className="text-red-700 mt-1">
            {vendorsQuery.error instanceof Error ? vendorsQuery.error.message : 'Unexpected error.'}
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => vendorsQuery.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {vendorsQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse rounded-lg border bg-gray-50 h-14" />)}
        </div>
      )}

      {/* Empty */}
      {!vendorsQuery.isLoading && !vendorsQuery.isError && filtered.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <div className="text-center max-w-md p-6">
            <Building className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-lg mb-1">No Vendors Found</h3>
            <p className="text-sm text-muted-foreground">
              {vendors.length > 0
                ? 'No vendors match your current filters.'
                : 'No vendors have been registered yet.'}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {!vendorsQuery.isLoading && filtered.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Vendor</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Country</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Hosting</th>
                <th className="text-left px-4 py-2 font-medium">Risk</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((v: VendorItem) => (
                <tr
                  key={v.vendorId}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/governance/vendors/${v.vendorId}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.vendorName}</div>
                    {v.contactEmail && (
                      <div className="text-xs text-muted-foreground">{v.contactEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.vendorType}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{v.country}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{v.hostingRegion}</td>
                  <td className="px-4 py-3"><RiskBadge risk={v.riskLevel} /></td>
                  <td className="px-4 py-3"><EnabledBadge enabled={v.enabled} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{fmtDate(v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
