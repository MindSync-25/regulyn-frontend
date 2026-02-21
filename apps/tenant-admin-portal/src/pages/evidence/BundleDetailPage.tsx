/**
 * BundleDetailPage - Detailed view of a single evidence bundle
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Package,
  Download,
  Shield,
  AlertCircle,
  FileText,
  Clock,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getBundle, exportBundle, verifyBundle } from '@/lib/api/evidence';
import { AuditTimeline } from '@/components/evidence/AuditTimeline';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { getAuditTimeline } from '@/lib/api/evidence';
import { toast } from 'sonner';

export function BundleDetailPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const navigate = useNavigate();
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const auditPageSize = 10;

  // Fetch bundle details
  const { data: bundle, isLoading, error } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => {
      if (!bundleId) throw new Error('No bundle ID');
      return getBundle(bundleId);
    },
    enabled: !!bundleId,
  });

  // Fetch audit timeline
  const auditQuery = useQuery({
    queryKey: ['audit-timeline', auditPage, auditPageSize],
    queryFn: () => {
      return getAuditTimeline({ page: auditPage, size: auditPageSize });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: () => {
      if (!bundleId) throw new Error('No bundle ID');
      return exportBundle(bundleId);
    },
    onSuccess: data => {
      toast.success('Export initiated');
      if (data.downloadPath) {
        toast.info(`Download path: ${data.downloadPath}`);
      }
    },
    onError: (err: Error) => {
      toast.error(`Export failed: ${err.message}`);
    },
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: () => {
      if (!bundleId) throw new Error('No bundle ID');
      return verifyBundle(bundleId);
    },
    onSuccess: data => {
      if (data.valid) {
        toast.success('Integrity check passed. All bundle items match recorded hashes.');
      } else {
        toast.error('Integrity check found mismatches. Review affected items before relying on this bundle.');
        if (data.problems.length > 0) {
          toast.info(`Issues: ${data.problems.join(', ')}`);
        }
        // Dev environment warning
        if (import.meta.env.MODE === 'development') {
          toast.info('Note: This environment may contain seeded test hashes that can produce expected mismatches.');
        }
      }
    },
    onError: (err: Error) => {
      toast.error(`Verification failed: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/evidence/bundles')}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg bg-gray-100" />
          <div className="h-64 rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/evidence/bundles')}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Bundle Not Found</h1>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Failed to load bundle</h3>
              <p className="mt-1 text-sm text-red-700">{error?.message || 'Bundle not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/evidence/bundles')}
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
              aria-label="Back to bundles list"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{bundle.title || bundle.bundleType}</h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    bundle.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : bundle.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {bundle.status}
                </span>
              </div>
              {bundle.description && (
                <p className="mt-1 text-sm text-gray-600">{bundle.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Recomputes hashes/signatures and compares them with stored values. Use this before audits, legal submissions, or incident closure."
            >
              <Shield className="h-4 w-4" />
              {verifyMutation.isPending ? 'Verifying...' : 'Verify Integrity'}
            </button>
            <button
              type="button"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Generates a ZIP containing manifest and evidence artifacts for external sharing, archival, or regulator submission."
            >
              <Download className="h-4 w-4" />
              {exportMutation.isPending ? 'Exporting...' : 'Export Bundle'}
            </button>
            <button
              type="button"
              onClick={() => setShowEvidenceDrawer(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Opens a side panel with evidence bundles and timeline events linked to this item, so you can investigate without leaving this page."
            >
              <ExternalLink className="h-4 w-4" />
              Context View
            </button>
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Package className="h-5 w-5" />
              Bundle Information
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Bundle ID</dt>
                <dd className="font-mono text-gray-900">{bundle.bundleId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Type</dt>
                <dd className="text-gray-900">{bundle.bundleType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Reference</dt>
                <dd className="text-gray-900">
                  {bundle.referenceType}: {bundle.referenceId}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {formatDistanceToNow(new Date(bundle.createdAt), { addSuffix: true })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Created By</dt>
                <dd className="font-mono text-gray-900">{bundle.createdBy}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Hash className="h-5 w-5" />
              Integrity & Hash
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Bundle Hash</dt>
                <dd className="mt-1 break-all font-mono text-xs text-gray-900">{bundle.bundleHash}</dd>
              </div>
              {bundle.metadata && Object.keys(bundle.metadata).length > 0 && (
                <div>
                  <dt className="font-medium text-gray-500">Metadata</dt>
                  <dd className="mt-1">
                    <pre className="rounded bg-gray-50 p-2 text-xs text-gray-700">
                      {JSON.stringify(bundle.metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Bundle Manifest */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileText className="h-5 w-5" />
            Bundle Manifest ({bundle.items.length} items)
          </h2>

          {bundle.items.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No items in this bundle</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Evidence ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Artifact ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Hash
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {bundle.items.map(item => (
                    <tr key={item.itemId}>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                            item.itemType === 'EVIDENCE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.itemType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-900">
                        {item.evidenceId || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-900">
                        {item.artifactId || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {item.itemHash.slice(0, 16)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Timeline */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Clock className="h-5 w-5" />
            Audit Timeline
          </h2>
          <div className="mt-4">
            {auditQuery.data && (
              <AuditTimeline
                events={auditQuery.data.content}
                isLoading={auditQuery.isLoading}
                error={auditQuery.error as Error}
                currentPage={auditPage}
                totalPages={auditQuery.data.totalPages}
                pageSize={auditPageSize}
                totalElements={auditQuery.data.totalElements}
                onPageChange={setAuditPage}
              />
            )}
            {!auditQuery.data && auditQuery.isLoading && (
              <div className="text-sm text-gray-500">Loading audit timeline...</div>
            )}
          </div>
        </div>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={showEvidenceDrawer}
        onClose={() => setShowEvidenceDrawer(false)}
        bundleId={bundleId}
        title={`Evidence Context: ${bundle.title || bundle.bundleType}`}
      />
    </>
  );
}
