/**
 * Part 7C - Communication consent ledger viewer (read-only)
 * Uses consent-service communication consent status endpoints + notification-service preferences read endpoint.
 */

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { UserFacingErrorPanel } from '@/components/shared/UserFacingErrorPanel';
import {
  batchCommunicationConsentStatus,
  getCommunicationConsentStatus,
  listConsentReceipts,
  type CommunicationChannel,
} from '@/lib/api/consent';
import { getNotificationPreferences } from '@/lib/api/notificationOps';
import { getUsers, type User } from '@/lib/api/identity';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function parseLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseUuidLines(value: string): { valid: string[]; invalid: string[] } {
  const all = parseLines(value);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const item of all) {
    if (isUuid(item)) valid.push(item);
    else invalid.push(item);
  }
  return { valid, invalid };
}

export function CommunicationLedgerPage() {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('Evidence & Audit');
  const [evidenceObjectType, setEvidenceObjectType] = useState<string | undefined>(undefined);
  const [evidenceObjectId, setEvidenceObjectId] = useState<string | undefined>(undefined);

  const [channel, setChannel] = useState<CommunicationChannel>('EMAIL');

  // Helper: search tenant users by email and reuse their UUIDs in consent calls
  const [userEmailFilter, setUserEmailFilter] = useState('');
  const userLookupMutation = useMutation({
    mutationFn: () => getUsers(userEmailFilter.trim() || undefined),
  });
  const userResults = useMemo<User[]>(
    () => (Array.isArray(userLookupMutation.data) ? userLookupMutation.data : []),
    [userLookupMutation.data]
  );

  // Single status
  const [singlePrincipalId, setSinglePrincipalId] = useState('');
  const singlePrincipalIdTrimmed = singlePrincipalId.trim();
  const statusMutation = useMutation({
    mutationFn: () =>
      getCommunicationConsentStatus({
        channel,
        dataPrincipalId: singlePrincipalIdTrimmed,
      }),
  });

  // Batch status
  const [batchText, setBatchText] = useState('');
  const batchParsed = useMemo(() => parseUuidLines(batchText), [batchText]);
  const batchMutation = useMutation({
    mutationFn: () =>
      batchCommunicationConsentStatus({
        channel,
        dataPrincipalIds: batchParsed.valid,
      }),
  });

  // Consent receipts (not paginated in backend)
  const [receiptsPrincipalId, setReceiptsPrincipalId] = useState('');
  const receiptsPrincipalIdTrimmed = receiptsPrincipalId.trim();
  const [receiptsPurpose, setReceiptsPurpose] = useState('');
  const receiptsMutation = useMutation({
    mutationFn: () =>
      listConsentReceipts({
        dataPrincipalId: receiptsPrincipalIdTrimmed,
        purpose: receiptsPurpose.trim() || undefined,
      }),
  });

  // Notification preferences
  const [prefsPrincipalId, setPrefsPrincipalId] = useState('');
  const prefsPrincipalIdTrimmed = prefsPrincipalId.trim();
  const prefsMutation = useMutation({
    mutationFn: () => getNotificationPreferences(prefsPrincipalIdTrimmed),
  });

  const batchRows = useMemo(() => batchMutation.data?.results ?? [], [batchMutation.data]);

  const applyPrincipalIdEverywhere = (value: string) => {
    const trimmed = value.trim();
    setSinglePrincipalId(trimmed);
    setReceiptsPrincipalId(trimmed);
    setPrefsPrincipalId(trimmed);
    setBatchText((prev) => {
      if (!trimmed) return prev;
      const current = prev.trim();
      if (!current) return trimmed;
      if (parseLines(current).includes(trimmed)) return prev;
      return `${current}\n${trimmed}`;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communication Consent Ledger</h1>
        <p className="mt-1 text-sm text-gray-600">
          Read-only viewer for communication consent and notification preferences (as supported by backend)
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Find a Data Principal (helper)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Nobody memorizes UUIDs. Use this to search tenant users by email and auto-fill the consent test inputs.
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Label>Email filter (optional)</Label>
            <Input
              value={userEmailFilter}
              onChange={(e) => setUserEmailFilter(e.target.value)}
              placeholder="e.g. alice@company.com"
            />
          </div>
          <Button onClick={() => userLookupMutation.mutate()} disabled={userLookupMutation.isPending}>
            Search Users
          </Button>
        </div>

        {userLookupMutation.error && (
          <div className="mt-4">
            <UserFacingErrorPanel error={userLookupMutation.error} />
          </div>
        )}

        {userResults.length > 0 && (
          <div className="mt-4 overflow-auto rounded border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">User ID (UUID)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Enabled</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {userResults.slice(0, 25).map((user) => (
                  <tr key={user.userId}>
                    <td className="px-3 py-2 text-gray-800">{user.email}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-800">{user.userId}</td>
                    <td className="px-3 py-2 text-gray-800">{user.enabled ? 'YES' : 'NO'}</td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => applyPrincipalIdEverywhere(user.userId)}
                      >
                        Use this ID
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {userResults.length > 25 && (
              <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Showing first 25 results. Use a tighter email filter to narrow the list.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Communication Channel</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['EMAIL', 'SMS', 'WHATSAPP'] as CommunicationChannel[]).map((c) => (
            <Button
              key={c}
              type="button"
              variant={channel === c ? 'default' : 'outline'}
              onClick={() => setChannel(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Single status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Consent Status (Single)</h2>
        <p className="mt-1 text-sm text-gray-600">
          GET /api/v2/consent/communication/channels/{'{channel}'}/status?dataPrincipalId=...
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Label>Data Principal ID</Label>
            <Input
              value={singlePrincipalId}
              onChange={(e) => setSinglePrincipalId(e.target.value)}
              placeholder="UUID"
            />
            {singlePrincipalIdTrimmed && !isUuid(singlePrincipalIdTrimmed) && (
              <p className="mt-1 text-xs text-red-600">
                Must be a UUID (example: 123e4567-e89b-12d3-a456-426614174000)
              </p>
            )}
          </div>
          <Button
            onClick={() => statusMutation.mutate()}
            disabled={!singlePrincipalIdTrimmed || !isUuid(singlePrincipalIdTrimmed) || statusMutation.isPending}
          >
            Fetch
          </Button>
        </div>

        {statusMutation.error && (
          <div className="mt-4">
            <UserFacingErrorPanel error={statusMutation.error} />
          </div>
        )}

        {statusMutation.data && (
          <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{statusMutation.data.channel}</Badge>
              <Badge variant="outline">state: {statusMutation.data.state}</Badge>
              <Badge variant="secondary">ledgerId: {statusMutation.data.ledgerId}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-gray-600">Tenant</div>
                <div className="text-sm font-mono text-gray-800 break-all">{statusMutation.data.tenantId}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Effective At</div>
                <div className="text-sm text-gray-800">{statusMutation.data.effectiveAt}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-gray-600">Consent Text Hash (sha256)</div>
                <div className="text-sm font-mono text-gray-800 break-all">
                  {statusMutation.data.consentTextHashSha256 ?? '-'}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEvidenceTitle('Communication consent status evidence & audit');
                  setEvidenceObjectType('COMMUNICATION_CONSENT_STATUS');
                  setEvidenceObjectId(`${channel}:${singlePrincipalId.trim()}`);
                  setEvidenceOpen(true);
                }}
              >
                Evidence & Audit
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Batch status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Consent Status (Batch)</h2>
        <p className="mt-1 text-sm text-gray-600">POST /api/v2/consent/communication/batch/status</p>

        <div className="mt-4">
          <Label>Data Principal IDs (one per line)</Label>
          <Textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            rows={6}
            placeholder="UUID\nUUID\nUUID"
          />
        </div>

        <div className="mt-3">
          <Button
            onClick={() => batchMutation.mutate()}
            disabled={batchParsed.valid.length === 0 || batchMutation.isPending}
          >
            Fetch Batch
          </Button>
          {batchParsed.invalid.length > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              Ignoring {batchParsed.invalid.length} invalid line(s) (not UUID format).
            </p>
          )}
        </div>

        {batchMutation.error && (
          <div className="mt-4">
            <UserFacingErrorPanel error={batchMutation.error} />
          </div>
        )}

        {batchMutation.data && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{batchMutation.data.channel}</Badge>
              <Badge variant="secondary">failClosed: {String(batchMutation.data.failClosed)}</Badge>
              <Badge variant="outline">results: {batchRows.length}</Badge>
            </div>

            <div className="mt-3 overflow-auto rounded border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Data Principal</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">State</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Allowed</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Reason</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Ledger</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Effective</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {batchRows.map((row) => (
                    <tr key={row.dataPrincipalId}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-800">{row.dataPrincipalId}</td>
                      <td className="px-3 py-2 text-gray-800">{row.state}</td>
                      <td className="px-3 py-2 text-gray-800">{row.allowed ? 'YES' : 'NO'}</td>
                      <td className="px-3 py-2 text-gray-800">{row.reason ?? '-'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-800">{row.ledgerId ?? '-'}</td>
                      <td className="px-3 py-2 text-gray-800">{row.effectiveAt ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEvidenceTitle('Batch communication consent evidence & audit');
                  setEvidenceObjectType('COMMUNICATION_CONSENT_BATCH');
                  setEvidenceObjectId(`${channel}:${parseLines(batchText).length}`);
                  setEvidenceOpen(true);
                }}
              >
                Evidence & Audit
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Consent receipts */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Consent Receipts</h2>
        <p className="mt-1 text-sm text-gray-600">
          GET /api/v2/consent/consents (not paginated in current backend)
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label>Data Principal ID</Label>
            <Input
              value={receiptsPrincipalId}
              onChange={(e) => setReceiptsPrincipalId(e.target.value)}
              placeholder="UUID"
            />
            {receiptsPrincipalIdTrimmed && !isUuid(receiptsPrincipalIdTrimmed) && (
              <p className="mt-1 text-xs text-red-600">Must be a UUID.</p>
            )}
          </div>
          <div>
            <Label>Purpose (optional)</Label>
            <Input value={receiptsPurpose} onChange={(e) => setReceiptsPurpose(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => receiptsMutation.mutate()}
              disabled={!receiptsPrincipalIdTrimmed || !isUuid(receiptsPrincipalIdTrimmed) || receiptsMutation.isPending}
            >
              Fetch
            </Button>
          </div>
        </div>

        {receiptsMutation.error && (
          <div className="mt-4">
            <UserFacingErrorPanel error={receiptsMutation.error} />
          </div>
        )}

        {receiptsMutation.data && (
          <div className="mt-4 overflow-auto rounded border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Receipt</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Purpose</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Granted</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Withdrawn</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Notice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {receiptsMutation.data.map((r) => (
                  <tr key={r.receiptId}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-800">{r.receiptId}</td>
                    <td className="px-3 py-2 text-gray-800">{r.purpose}</td>
                    <td className="px-3 py-2 text-gray-800">{r.status}</td>
                    <td className="px-3 py-2 text-gray-800">{r.grantedAt}</td>
                    <td className="px-3 py-2 text-gray-800">{r.withdrawnAt ?? '-'}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-800">{r.noticeId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {receiptsMutation.data && receiptsMutation.data.length > 0 && (
          <div className="mt-3">
            <Button
              variant="outline"
              onClick={() => {
                setEvidenceTitle('Consent receipts evidence & audit');
                setEvidenceObjectType('CONSENT_RECEIPTS');
                setEvidenceObjectId(receiptsPrincipalId.trim());
                setEvidenceOpen(true);
              }}
            >
              Evidence & Audit
            </Button>
          </div>
        )}
      </div>

      {/* Notification preferences */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        <p className="mt-1 text-sm text-gray-600">
          GET /api/notifications/preferences/{'{dataPrincipalId}'} (notification-service)
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Label>Data Principal ID</Label>
            <Input
              value={prefsPrincipalId}
              onChange={(e) => setPrefsPrincipalId(e.target.value)}
              placeholder="UUID or external ID (backend accepts String)"
            />
            {prefsPrincipalIdTrimmed && !isUuid(prefsPrincipalIdTrimmed) && (
              <p className="mt-1 text-xs text-red-600">Must be a UUID.</p>
            )}
          </div>
          <Button
            onClick={() => prefsMutation.mutate()}
            disabled={!prefsPrincipalIdTrimmed || !isUuid(prefsPrincipalIdTrimmed) || prefsMutation.isPending}
          >
            Fetch
          </Button>
        </div>

        {prefsMutation.error && (
          <div className="mt-4">
            <UserFacingErrorPanel error={prefsMutation.error} />
          </div>
        )}

        {prefsMutation.data && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">dataPrincipalId: {prefsMutation.data.dataPrincipalId}</Badge>
              <Badge variant="outline">rows: {prefsMutation.data.preferences.length}</Badge>
            </div>

            <div className="mt-3 overflow-auto rounded border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Channel</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Opted Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {prefsMutation.data.preferences.map((p) => (
                    <tr key={`${p.channel}:${p.category}`}>
                      <td className="px-3 py-2 text-gray-800">{p.channel}</td>
                      <td className="px-3 py-2 text-gray-800">{p.category}</td>
                      <td className="px-3 py-2 text-gray-800">{p.optedOut ? 'YES' : 'NO'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEvidenceTitle('Notification preferences evidence & audit');
                  setEvidenceObjectType('NOTIFICATION_PREFERENCES');
                  setEvidenceObjectId(prefsPrincipalId.trim());
                  setEvidenceOpen(true);
                }}
              >
                Evidence & Audit
              </Button>
            </div>
          </div>
        )}
      </div>

      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        title={evidenceTitle}
        objectType={evidenceObjectType}
        objectId={evidenceObjectId}
      />
    </div>
  );
}
