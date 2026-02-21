import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ShieldCheck, Plus, Ban, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { StandardDataTable, type Column } from '@/components/shared/StandardDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { getErrorMessage } from '@/lib/api/http';
import {
  createRetentionRule,
  disableRetentionRule,
  listRetentionRules,
  type CreateRetentionRuleRequest,
  type RetentionRuleResponse,
} from '@/lib/api/retentionDeletion';

function safeJsonParse(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    throw new Error('Metadata must be a JSON object');
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Invalid JSON');
  }
}

export function RetentionRulesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RetentionRuleResponse | null>(null);

  // Form state (fields strictly from CreateRetentionRuleRequest)
  const [ruleName, setRuleName] = useState('');
  const [subjectType, setSubjectType] = useState('');
  const [entityType, setEntityType] = useState('');
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [action, setAction] = useState('DELETE');
  const [enabled, setEnabled] = useState(true);
  const [metadataJson, setMetadataJson] = useState('');

  const rulesQuery = useQuery({
    queryKey: ['retention-rules'],
    queryFn: () => listRetentionRules(),
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateRetentionRuleRequest) => createRetentionRule(request),
    onSuccess: (res) => {
      toast.success(`Rule created: ${res.ruleId}`);
      setCreateOpen(false);
      setRuleName('');
      setSubjectType('');
      setEntityType('');
      setRetentionDays(30);
      setAction('DELETE');
      setEnabled(true);
      setMetadataJson('');
      rulesQuery.refetch();
    },
  });

  const disableMutation = useMutation({
    mutationFn: (ruleId: string) => disableRetentionRule(ruleId),
    onSuccess: () => {
      toast.success('Rule disabled');
      rulesQuery.refetch();
    },
  });

  const columns: Column<RetentionRuleResponse>[] = useMemo(
    () => [
      {
        key: 'ruleId',
        header: 'Rule ID',
        render: (row) => <span className="font-mono text-xs">{row.ruleId}</span>,
      },
      {
        key: 'enabled',
        header: 'Status',
        render: (row) => (row.enabled ? <Badge className="bg-green-100 text-green-900">Enabled</Badge> : <Badge variant="secondary">Disabled</Badge>),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRule(row);
                setEvidenceOpen(true);
              }}
            >
              Evidence
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!row.enabled || disableMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                disableMutation.mutate(row.ruleId);
              }}
            >
              <Ban className="mr-2 h-3 w-3" />
              Disable
            </Button>
          </div>
        ),
      },
    ],
    [disableMutation.isPending]
  );

  function handleCreate() {
    let metadata: Record<string, unknown> | null = null;
    try {
      metadata = safeJsonParse(metadataJson);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid metadata JSON');
      return;
    }

    const request: CreateRetentionRuleRequest = {
      ruleName,
      subjectType,
      entityType,
      retentionDays,
      action,
      enabled,
      metadata,
    };

    createMutation.mutate(request);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-gray-900" />
            <h1 className="text-2xl font-bold text-gray-900">Retention Rules</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">Tenant-scoped retention rules (fields as provided by backend DTOs)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
      </div>

      {rulesQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">Failed to load rules: {getErrorMessage(rulesQuery.error)}</div>
        </div>
      )}

      <StandardDataTable
        data={rulesQuery.data ?? []}
        columns={columns}
        isLoading={rulesQuery.isLoading}
        emptyMessage="No retention rules found for this tenant. Create one using your backend creation endpoint(s) or seed data."
      />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
        <div className="font-medium text-gray-900 mb-1">Backend endpoints</div>
        <div className="font-mono">GET /retention/rules</div>
        <div className="font-mono">POST /retention/rules</div>
        <div className="font-mono">POST /retention/rules/{'{'}ruleId{'}'}/disable</div>
        <div className="mt-2 text-gray-600">
          Note: The backend list DTO currently returns only <span className="font-mono">ruleId</span> and <span className="font-mono">enabled</span>, so the UI cannot display other rule attributes after creation.
        </div>
      </div>

      {/* Create rule dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Retention Rule</DialogTitle>
            <DialogDescription>Fields are strictly from the backend CreateRetentionRuleRequest DTO.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name *</Label>
              <Input id="ruleName" value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="e.g., Customer data retention" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subjectType">Subject Type *</Label>
                <Input id="subjectType" value={subjectType} onChange={(e) => setSubjectType(e.target.value)} placeholder="CUSTOMER" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entityType">Entity Type *</Label>
                <Input id="entityType" value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="orders" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="retentionDays">Retention Days *</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  min={1}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action *</Label>
                <Input id="action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="DELETE" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enabled">Enabled</Label>
              <div className="flex items-center gap-2">
                <input
                  id="enabled"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Rule is active</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Metadata (JSON object)</Label>
              <Textarea
                id="metadata"
                value={metadataJson}
                onChange={(e) => setMetadataJson(e.target.value)}
                placeholder='{"key":"value"}'
              />
              <p className="text-xs text-gray-500">Optional; must be a JSON object if provided.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !ruleName || !subjectType || !entityType || !action || !Number.isFinite(retentionDays) || retentionDays < 1}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EvidenceDrawer
        isOpen={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        objectType={selectedRule ? 'RETENTION_RULE' : undefined}
        objectId={selectedRule?.ruleId}
        title={selectedRule ? `Evidence Context — Retention Rule ${selectedRule.ruleId}` : 'Evidence Context'}
      />
    </div>
  );
}

export default RetentionRulesPage;
