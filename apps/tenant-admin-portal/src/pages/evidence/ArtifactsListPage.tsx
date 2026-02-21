/**
 * ArtifactsListPage - Placeholder for artifacts list
 * 
 * NOTE: Backend does not currently expose a GET /artifacts endpoint.
 * Artifacts are accessible only through bundle items.
 * This page informs users and directs them to bundles.
 */

import { Package, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ArtifactsListPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Evidence Artifacts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Individual evidence files and documents captured by the system
        </p>
      </div>

      {/* Info card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <Info className="h-6 w-6 shrink-0 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              Artifacts are currently accessed through Bundle details. Open a bundle to view its evidence items, integrity metadata, and export options.
            </p>
            <button
              type="button"
              onClick={() => navigate('/evidence/bundles')}
              className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Package className="h-4 w-4" />
              Go to Bundles
            </button>
          </div>
        </div>
      </div>

      {/* Technical note */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-sm font-medium text-gray-900">Technical Details</h3>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">Available Endpoints:</span>
          </p>
          <ul className="ml-6 list-disc space-y-1 text-xs">
            <li>
              <code className="rounded bg-gray-100 px-1 py-0.5">
                GET /admin/tenants/{'{tenantId}'}/evidence/bundles
              </code>{' '}
              - List bundles
            </li>
            <li>
              <code className="rounded bg-gray-100 px-1 py-0.5">
                GET /bundles/{'{bundleId}'}
              </code>{' '}
              - Get bundle manifest with artifact references
            </li>
            <li>
              <code className="rounded bg-gray-100 px-1 py-0.5">
                POST /bundles/{'{bundleId}'}/export
              </code>{' '}
              - Export bundle with artifacts
            </li>
            <li>
              <code className="rounded bg-gray-100 px-1 py-0.5">
                POST /bundles/{'{bundleId}'}/verify
              </code>{' '}
              - Verify bundle integrity
            </li>
          </ul>
          <p className="mt-4 text-xs text-gray-600">
            <span className="font-medium">Note:</span> A dedicated artifacts list endpoint may be
            added in a future backend release. This page will be updated when that capability
            becomes available.
          </p>
        </div>
      </div>

      {/* Example bundle structure */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium text-gray-900">Bundle Manifest Example</h3>
        <p className="mt-1 text-xs text-gray-600">
          Each bundle contains artifact references with integrity hashes:
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-gray-50 p-3 text-xs text-gray-700">
{`{
  "bundleId": "550e8400-e29b-41d4-a716-446655440000",
  "bundleType": "DSAR_EXPORT",
  "items": [
    {
      "itemId": "...",
      "itemType": "ARTIFACT",
      "artifactId": "660e8400-e29b-41d4-a716-446655440001",
      "itemHash": "sha256:abc123...",
      "itemMeta": { "fileName": "user_data.json", "size": 2048 }
    }
  ]
}`}
        </pre>
      </div>
    </div>
  );
}
