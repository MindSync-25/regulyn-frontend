/**
 * Part 7A - Notice template detail (consent-service)
 * IMPORTANT: Backend does not expose notice template/versions detail endpoints.
 * This page provides supported operations scoped to a noticeId from the route.
 */

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { UserFacingErrorPanel } from '@/components/shared/UserFacingErrorPanel';
import { useHasAnyRole, ROLES } from '@/lib/auth/roles';
import {
  addNoticeVersionLanguage,
  createNoticeVersion,
  getActivePurposeVersion,
  publishNoticeVersion,
  type PublishVersionRequest,
} from '@/lib/api/consent';
import { toast } from 'sonner';

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-2 max-h-80 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function NoticeTemplateDetailPage() {
  const { templateId } = useParams();
  const noticeId = templateId ?? '';

  const canWrite = useHasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO]);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('Evidence & Audit');
  const [evidenceObjectType, setEvidenceObjectType] = useState<string | undefined>(undefined);
  const [evidenceObjectId, setEvidenceObjectId] = useState<string | undefined>(undefined);

  const [versionId, setVersionId] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  const createVersionMutation = useMutation({
    mutationFn: () =>
      createNoticeVersion({
        noticeId,
        request: { changeSummary: changeSummary.trim() },
      }),
    onSuccess: (res) => {
      toast.success('Draft version created');
      setEvidenceTitle('Notice version created');
      setEvidenceObjectType('CONSENT_NOTICE_VERSION');
      setEvidenceObjectId(`${noticeId}:${res.versionId}`);
      setEvidenceOpen(true);
    },
  });

  const [languageCode, setLanguageCode] = useState('en');
  const [languageContent, setLanguageContent] = useState('');

  const addLanguageMutation = useMutation({
    mutationFn: () =>
      addNoticeVersionLanguage({
        noticeId,
        versionId: versionId.trim(),
        request: { language: languageCode.trim(), content: languageContent },
      }),
    onSuccess: (res) => {
      toast.success('Language content added');
      setEvidenceTitle('Notice language added');
      setEvidenceObjectType('CONSENT_NOTICE_LANGUAGE');
      setEvidenceObjectId(`${noticeId}:${versionId.trim()}:${res.languageId}`);
      setEvidenceOpen(true);
    },
  });

  const [publishJson, setPublishJson] = useState('');

  const publishMutation = useMutation({
    mutationFn: () => {
      const raw = publishJson.trim();
      const request: PublishVersionRequest | undefined = raw
        ? (JSON.parse(raw) as PublishVersionRequest)
        : undefined;

      return publishNoticeVersion({ noticeId, versionId: versionId.trim(), request });
    },
    onSuccess: () => {
      toast.success('Publish attempted');
      setEvidenceTitle('Notice version publish');
      setEvidenceObjectType('CONSENT_NOTICE_PUBLISH');
      setEvidenceObjectId(`${noticeId}:${versionId.trim()}`);
      setEvidenceOpen(true);
    },
    onError: (err: any) => {
      if (String(err?.message ?? '').includes('Unexpected token')) {
        toast.error('Publish JSON is invalid');
      }
    },
  });

  const [purposeKey, setPurposeKey] = useState('');
  const [showRawPurposeVersion, setShowRawPurposeVersion] = useState(false);

  const activePurposeVersionMutation = useMutation({
    mutationFn: () => getActivePurposeVersion({ noticeId, purposeKey: purposeKey.trim() }),
  });

  const detailNotAvailableNote = useMemo(
    () =>
      'Notice template metadata and version lists are not available in the current backend (no GET notice detail/list endpoints). This page exposes supported operations only.',
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notice Detail</h1>
        <p className="mt-1 text-sm text-gray-600">Operations for noticeId from the URL</p>
        <div className="mt-2">
          <Badge variant="secondary">noticeId: {noticeId || '(missing)'}</Badge>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Limited backend capability</p>
        <p className="mt-1">{detailNotAvailableNote}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Active Purpose Version Lookup</h2>
        <p className="mt-1 text-sm text-gray-600">
          Uses GET /api/v2/consent/notices/{'{noticeId}'}/purposes/{'{purposeKey}'}/active-version
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Label>Purpose Key</Label>
            <Input value={purposeKey} onChange={(e) => setPurposeKey(e.target.value)} placeholder="e.g. marketing" />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => activePurposeVersionMutation.mutate()}
              disabled={!noticeId || !purposeKey.trim() || activePurposeVersionMutation.isPending}
            >
              Fetch
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRawPurposeVersion((v) => !v)}
              disabled={!activePurposeVersionMutation.data}
            >
              {showRawPurposeVersion ? 'Hide JSON' : 'Raw JSON'}
            </Button>
          </div>
        </div>

        {activePurposeVersionMutation.error && (
          <div className="mt-4">
            <UserFacingErrorPanel error={activePurposeVersionMutation.error} />
          </div>
        )}

        {activePurposeVersionMutation.data && (
          <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-900">
              purposeVersionId:{' '}
              <span className="font-mono text-xs">{activePurposeVersionMutation.data.purposeVersionId}</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-gray-600">Version</div>
                <div className="text-sm text-gray-800">{activePurposeVersionMutation.data.versionNum}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Scope Hash</div>
                <div className="text-sm font-mono text-gray-800 break-all">{activePurposeVersionMutation.data.scopeHash}</div>
              </div>
            </div>
            {showRawPurposeVersion && <JsonBlock value={activePurposeVersionMutation.data} />}
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEvidenceTitle('Active purpose version evidence & audit');
                  setEvidenceObjectType('CONSENT_PURPOSE_VERSION');
                  setEvidenceObjectId(`${noticeId}:${purposeKey.trim()}:${activePurposeVersionMutation.data!.purposeVersionId}`);
                  setEvidenceOpen(true);
                }}
              >
                Evidence & Audit
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Version Operations</h2>
        {!canWrite && (
          <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            Write operations are restricted to {ROLES.TENANT_ADMIN} / {ROLES.DPO}.
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>Change Summary (new version)</Label>
            <Input value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} />
          </div>
          <div>
            <Label>Version ID (for add-language/publish)</Label>
            <Input value={versionId} onChange={(e) => setVersionId(e.target.value)} placeholder="UUID" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => createVersionMutation.mutate()}
            disabled={!canWrite || !noticeId || createVersionMutation.isPending}
          >
            Create Draft Version
          </Button>
          <Button
            variant="outline"
            onClick={() => publishMutation.mutate()}
            disabled={!canWrite || !noticeId || !versionId.trim() || publishMutation.isPending}
          >
            Publish Version
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEvidenceTitle('Notice evidence & audit');
              setEvidenceObjectType('CONSENT_NOTICE');
              setEvidenceObjectId(noticeId);
              setEvidenceOpen(true);
            }}
          >
            Evidence & Audit
          </Button>
        </div>

        <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-medium text-gray-900">Add Language Variant</div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div>
              <Label>Language</Label>
              <Input value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={languageContent} onChange={(e) => setLanguageContent(e.target.value)} rows={6} />
            </div>
            <Button
              variant="outline"
              onClick={() => addLanguageMutation.mutate()}
              disabled={!canWrite || !noticeId || !versionId.trim() || !languageCode.trim() || !languageContent.trim()}
            >
              Add Language
            </Button>
          </div>

          <div className="mt-4">
            <Label>Publish Request (optional JSON)</Label>
            <Textarea
              value={publishJson}
              onChange={(e) => setPublishJson(e.target.value)}
              rows={6}
              placeholder='{"purposeScope": {"dataCategories": [], "dataFields": [], "recipients": [], "legalBasis": null, "retentionDays": null, "processingActivities": [], "extensions": {}}}'
            />
          </div>
        </div>

        {(createVersionMutation.error || addLanguageMutation.error || publishMutation.error) && (
          <div className="mt-4 space-y-3">
            {createVersionMutation.error && <UserFacingErrorPanel error={createVersionMutation.error} />}
            {addLanguageMutation.error && <UserFacingErrorPanel error={addLanguageMutation.error} />}
            {publishMutation.error && <UserFacingErrorPanel error={publishMutation.error} />}
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
