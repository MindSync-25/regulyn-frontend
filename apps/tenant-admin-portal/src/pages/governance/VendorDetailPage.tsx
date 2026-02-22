/**
 * VendorDetailPage — Vendor Detail with Agreements
 * Backend: vendor-sharing-service (port 8090)
 * Route: /app/governance/vendors/:vendorId
 * RBAC: TENANT_ADMIN, DPO
 *
 * Features:
 *  - Vendor metadata card
 *  - Agreements list (DPAs, NDAs, etc.)
 *  - EvidenceDrawer for audit trail
 *  - No write operations (read-only per spec; backend has create but no dedicated UI trigger needed here)
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building,
  FileText,
  Package,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import {
  listVendors,
  listVendorAgreements,
  type AgreementItem,
  type VendorItem,
} from '@/lib/api/vendors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(val?: string | null) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString();
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm">{value || '—'}</dd>
    </div>
  );
}

function AgreementStatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') return <Badge className="bg-green-100 text-green-900">ACTIVE</Badge>;
  if (status === 'EXPIRED') return <Badge className="bg-red-100 text-red-900">EXPIRED</Badge>;
  if (status === 'PENDING') return <Badge className="bg-amber-100 text-amber-900">PENDING</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  // We fetch all vendors and find the one (no GET /vendors/:id endpoint available)
  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: () => listVendors(),
    enabled: !!vendorId,
  });

  const vendor: VendorItem | undefined = vendorsQuery.data?.find(
    (v: VendorItem) => v.vendorId === vendorId
  );

  const agreementsQuery = useQuery({
    queryKey: ['vendor-agreements', vendorId],
    queryFn: () => listVendorAgreements(vendorId!),
    enabled: !!vendorId,
  });

  const isLoading = vendorsQuery.isLoading;
  const isError = vendorsQuery.isError;

  if (isError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/governance/vendors')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Vendors
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Failed to load vendor</p>
          <p className="text-red-700 mt-1">
            {vendorsQuery.error instanceof Error ? vendorsQuery.error.message : 'Unexpected error.'}
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => vendorsQuery.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-6 w-40 bg-gray-200 rounded" />
        <div className="animate-pulse rounded-lg border h-52 bg-gray-50" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/governance/vendors')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Vendors
        </Button>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Vendor with ID <code className="font-mono">{vendorId}</code> not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/governance/vendors')} className="mb-3">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Vendors
        </Button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building className="h-6 w-6 text-indigo-600" />
              {vendor.vendorName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Vendor ID: <code className="font-mono text-xs">{vendorId}</code>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => vendorsQuery.refetch()}
              disabled={vendorsQuery.isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${vendorsQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEvidenceOpen(true)}>
              <Package className="h-4 w-4 mr-1" />
              Evidence & Audit
            </Button>
          </div>
        </div>
      </div>

      {/* Vendor Metadata */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold mb-4">Vendor Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
          <Field label="Type" value={vendor.vendorType} />
          <Field label="Country" value={vendor.country} />
          <Field label="Hosting Region" value={vendor.hostingRegion} />
          <Field label="Risk Level" value={vendor.riskLevel} />
          <Field label="Contact Email" value={vendor.contactEmail} />
          <Field label="Status" value={vendor.enabled ? 'Active' : 'Disabled'} />
          <Field label="Created At" value={fmtDate(vendor.createdAt)} />
          <Field label="Updated At" value={fmtDate(vendor.updatedAt)} />
        </dl>
      </div>

      {/* Agreements */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-500" />
          Agreements & DPAs
        </h2>

        {agreementsQuery.isLoading && (
          <div className="animate-pulse space-y-2">
            {[1, 2].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        )}

        {agreementsQuery.isError && (
          <p className="text-sm text-red-700 bg-red-50 rounded p-3">
            Failed to load agreements.
          </p>
        )}

        {!agreementsQuery.isLoading && !agreementsQuery.isError && (
          (agreementsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No agreements on file for this vendor.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Type</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium">Signed</th>
                    <th className="text-left px-3 py-2 font-medium">Expires</th>
                    <th className="text-left px-3 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agreementsQuery.data!.map((a: AgreementItem) => (
                    <tr key={a.agreementId} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{a.agreementType}</td>
                      <td className="px-3 py-2">
                        <AgreementStatusBadge status={a.status} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtDate(a.signedAt)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtDate(a.expiresAt)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType="vendor"
        objectId={vendorId}
        title="Vendor Evidence & Audit"
      />
    </div>
  );
}
