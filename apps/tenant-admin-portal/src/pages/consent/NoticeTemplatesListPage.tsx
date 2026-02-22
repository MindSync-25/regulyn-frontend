/**
 * Part 7A - Notice templates and versions (consent-service)
 * Real notice listing is available via GET /api/v2/consent/notices.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, RefreshCw, Plus, Languages, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { UserFacingErrorPanel } from '@/components/shared/UserFacingErrorPanel';
import { useHasAnyRole, ROLES } from '@/lib/auth/roles';
import { useTenantId } from '@/lib/auth/tenant';
import {
  addNoticeVersionLanguage,
  createNotice,
  createNoticeVersion,
  getActiveNotice,
  getActiveNoticeDual,
  listNotices,
  publishNoticeVersion,
  type ActiveDualNoticeResponse,
  type ActiveNoticeResponse,
  type NoticeListItem,
  type PublishVersionRequest,
} from '@/lib/api/consent';

type RecentNoticeRecord = {
  noticeId: string;
  purpose: string;
  title?: string;
  category?: string;
  defaultLanguage?: string;
  lastVersionId?: string;
  updatedAt: string; // ISO
};

function getRecentStorageKey(tenantId: string) {
  return `regulyn_consent_recent_notices:${tenantId}`;
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function copyToClipboard(label: string, value: string): void {
  void navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error(`Failed to copy ${label}`));
}

export function NoticeTemplatesListPage() {
  const canWrite = useHasAnyRole([ROLES.TENANT_ADMIN, ROLES.DPO]);
  const tenantId = useTenantId();
  const queryClient = useQueryClient();

  // ── Real notice list from backend ─────────────────────────────────────────
  const noticeListQuery = useQuery({
    queryKey: ['consent-notices', tenantId],
    queryFn: listNotices,
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  const [recentNotices, setRecentNotices] = useState<RecentNoticeRecord[]>([]);

  useEffect(() => {
    if (!tenantId) {
      setRecentNotices([]);
      return;
    }

    const parsed = safeParseJson<RecentNoticeRecord[]>(
      localStorage.getItem(getRecentStorageKey(tenantId))
    );
    setRecentNotices(Array.isArray(parsed) ? parsed : []);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    localStorage.setItem(getRecentStorageKey(tenantId), JSON.stringify(recentNotices.slice(0, 20)));
  }, [tenantId, recentNotices]);

  // Primary source = backend list; localStorage fills in any gaps (API down, old notices)
  const allNotices = useMemo<NoticeListItem[]>(() => {
    const fromBackend: NoticeListItem[] = noticeListQuery.data ?? [];
    const backendIds = new Set(fromBackend.map((n) => n.noticeId));
    const fallback = recentNotices
      .filter((r) => !backendIds.has(r.noticeId))
      .map((r): NoticeListItem => ({
        noticeId: r.noticeId,
        purpose: r.purpose,
        title: r.title ?? '',
        category: r.category ?? '',
        defaultLanguage: r.defaultLanguage ?? 'en',
        createdAt: r.updatedAt,
        latestVersionStatus: null,
        latestVersionId: r.lastVersionId ?? null,
        latestVersionNumber: null,
      }));
    return [...fromBackend, ...fallback];
  }, [noticeListQuery.data, recentNotices]);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('Evidence & Audit');
  const [evidenceObjectType, setEvidenceObjectType] = useState<string | undefined>(undefined);
  const [evidenceObjectId, setEvidenceObjectId] = useState<string | undefined>(undefined);

  // Active notice lookup
  const [purpose, setPurpose] = useState('');
  const [language, setLanguage] = useState('en');
  const activeNoticeMutation = useMutation({
    mutationFn: () => getActiveNotice({ purpose: purpose.trim(), language: language.trim() || 'en' }),
    onSuccess: (res) => {
      // Save for quick re-use (backend doesn't expose list endpoints yet)
      setRecentNotices((prev) => {
        const now = new Date().toISOString();
        const record: RecentNoticeRecord = {
          noticeId: res.noticeId,
          purpose: res.purpose,
          defaultLanguage: res.language,
          lastVersionId: res.versionId,
          updatedAt: now,
        };
        const withoutDup = prev.filter((n) => n.noticeId !== record.noticeId);
        return [record, ...withoutDup].slice(0, 20);
      });
    },
  });

  // Active dual notice lookup
  const [dualPurpose, setDualPurpose] = useState('');
  const [region, setRegion] = useState('');
  const activeDualMutation = useMutation({
    mutationFn: () => getActiveNoticeDual({ purpose: dualPurpose.trim(), region: region.trim() }),
    onSuccess: (res) => {
      // Save for quick re-use (best-effort)
      setRecentNotices((prev) => {
        const now = new Date().toISOString();
        const record: RecentNoticeRecord = {
          noticeId: res.noticeId,
          purpose: res.purpose,
          lastVersionId: res.versionId,
          updatedAt: now,
        };
        const withoutDup = prev.filter((n) => n.noticeId !== record.noticeId);
        return [record, ...withoutDup].slice(0, 20);
      });
    },
  });

  // Create notice
  const [createPurpose, setCreatePurpose] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createDefaultLanguage, setCreateDefaultLanguage] = useState('en');

  const createNoticeMutation = useMutation({
    mutationFn: () =>
      createNotice({
        purpose: createPurpose.trim(),
        title: createTitle.trim(),
        category: createCategory.trim(),
        defaultLanguage: createDefaultLanguage.trim() || 'en',
      }),
    onSuccess: (res) => {
      toast.success('Notice created');
      void queryClient.invalidateQueries({ queryKey: ['consent-notices', tenantId] });

      // Make next steps painless: auto-fill IDs for version/publish actions
      setNoticeId(res.noticeId);
      if (!purpose.trim()) setPurpose(createPurpose.trim());

      // Save locally (backend has no list endpoint)
      setRecentNotices((prev) => {
        const now = new Date().toISOString();
        const record: RecentNoticeRecord = {
          noticeId: res.noticeId,
          purpose: createPurpose.trim(),
          title: createTitle.trim(),
          category: createCategory.trim(),
          defaultLanguage: (createDefaultLanguage.trim() || 'en').trim(),
          updatedAt: now,
        };

        const withoutDup = prev.filter((n) => n.noticeId !== record.noticeId);
        return [record, ...withoutDup].slice(0, 20);
      });

      setCreatePurpose('');
      setCreateTitle('');
      setCreateCategory('');
      setCreateDefaultLanguage('en');
      setEvidenceTitle('Notice created');
      setEvidenceObjectType('CONSENT_NOTICE');
      setEvidenceObjectId(res.noticeId);
      setEvidenceOpen(true);
    },
    onError: () => toast.error('Failed to create notice'),
  });

  // Version create/publish/language (IDs must be provided; backend does not provide list/detail retrieval)
  const [noticeId, setNoticeId] = useState('');
  const [changeSummary, setChangeSummary] = useState('v1');

  const createVersionMutation = useMutation({
    mutationFn: () =>
      createNoticeVersion({
        noticeId: noticeId.trim(),
        request: { changeSummary: changeSummary.trim() },
      }),
    onSuccess: (res) => {
      toast.success('Draft version created');

      // Auto-fill versionId for language/publish
      setVersionId(res.versionId);

      // Best-effort update of recent list
      setRecentNotices((prev) => {
        const now = new Date().toISOString();
        const id = noticeId.trim();
        const existing = prev.find((n) => n.noticeId === id);
        const updated: RecentNoticeRecord = existing
          ? { ...existing, lastVersionId: res.versionId, updatedAt: now }
          : { noticeId: id, purpose: '', lastVersionId: res.versionId, updatedAt: now };
        const withoutDup = prev.filter((n) => n.noticeId !== id);
        return [updated, ...withoutDup].slice(0, 20);
      });

      setEvidenceTitle('Notice version created');
      setEvidenceObjectType('CONSENT_NOTICE_VERSION');
      setEvidenceObjectId(`${noticeId.trim()}:${res.versionId}`);
      setEvidenceOpen(true);
    },
    onError: () => toast.error('Failed to create version'),
  });

  const [versionId, setVersionId] = useState('');
  const [languageCode, setLanguageCode] = useState('en');
  const [languageContent, setLanguageContent] = useState('');

  const addLanguageMutation = useMutation({
    mutationFn: () =>
      addNoticeVersionLanguage({
        noticeId: noticeId.trim(),
        versionId: versionId.trim(),
        request: { language: languageCode.trim(), content: languageContent },
      }),
    onSuccess: (res) => {
      toast.success('Language content added');
      setEvidenceTitle('Notice language added');
      setEvidenceObjectType('CONSENT_NOTICE_LANGUAGE');
      setEvidenceObjectId(`${noticeId.trim()}:${versionId.trim()}:${res.languageId}`);
      setEvidenceOpen(true);
    },
    onError: () => toast.error('Failed to add language'),
  });

  // ── Publish scope form (replaces raw JSON) ──────────────────────────────
  const [scopeLegalBasis, setScopeLegalBasis] = useState('CONSENT');
  const [scopeRetentionDays, setScopeRetentionDays] = useState('365');
  const [scopeDataCategories, setScopeDataCategories] = useState('');
  const [scopeRecipients, setScopeRecipients] = useState('');
  const [scopeProcessingActivities, setScopeProcessingActivities] = useState('');

  const publishMutation = useMutation({
    mutationFn: () => {
      const splitTrim = (s: string) =>
        s.split(',').map((x) => x.trim()).filter(Boolean);

      const request: PublishVersionRequest = {
        purposeScope: {
          legalBasis: scopeLegalBasis || null,
          retentionDays: scopeRetentionDays ? parseInt(scopeRetentionDays, 10) : null,
          dataCategories: splitTrim(scopeDataCategories),
          dataFields: null,
          recipients: splitTrim(scopeRecipients),
          processingActivities: splitTrim(scopeProcessingActivities),
          extensions: null,
        },
      };

      return publishNoticeVersion({
        noticeId: noticeId.trim(),
        versionId: versionId.trim(),
        request,
      });
    },
    onSuccess: () => {
      toast.success('Version published successfully!');
      setEvidenceTitle('Notice version publish');
      setEvidenceObjectType('CONSENT_NOTICE_PUBLISH');
      setEvidenceObjectId(`${noticeId.trim()}:${versionId.trim()}`);
      setEvidenceOpen(true);
    },
    onError: () => toast.error('Failed to publish version'),
  });

  const activeNoticeResult = activeNoticeMutation.data as ActiveNoticeResponse | undefined;
  const dualNoticeResult = activeDualMutation.data as ActiveDualNoticeResponse | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consent Notices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Notice templates, versions, and language variants (as supported by backend)
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Notice list is live</p>
        <p className="mt-1 text-xs text-blue-800">
          Pick any existing notice from the <strong>Select a Notice</strong> dropdown — no UUIDs to remember.
          Workflow: <strong>Create notice → Create draft version → Add language → Publish.</strong>
        </p>
      </div>

      {/* Active notice lookup */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Active Notice Lookup</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Fetches the <strong>currently published/active</strong> notice version for a given purpose and language.
          This is exactly what the consent widget calls to show users the live privacy notice.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Purpose</Label>
            {allNotices.length > 0 ? (
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option value="">— pick a purpose —</option>
                {allNotices.map((n) => {
                  const statusLabel = n.latestVersionStatus === 'PUBLISHED'
                    ? '(Live)'
                    : n.latestVersionStatus === 'DRAFT'
                    ? '(Draft)'
                    : '(No version yet)';
                  return (
                    <option key={n.noticeId} value={n.purpose}>
                      {n.purpose} — {n.title} {statusLabel}
                    </option>
                  );
                })}
              </select>
            ) : (
              <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. marketing" />
            )}
            {purpose && (() => {
              const sel = allNotices.find((n) => n.purpose === purpose);
              if (!sel) return null;
              if (sel.latestVersionStatus !== 'PUBLISHED') {
                return (
                  <div className="mt-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-800">
                    ⚠️ This notice has no published version yet — publish one first via the wizard below.
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div>
            <Label>Language</Label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English (en)</option>
              <optgroup label="22 Scheduled Indian Languages">
                <option value="as">Assamese (as)</option>
                <option value="bn">Bengali (bn)</option>
                <option value="brx">Bodo (brx)</option>
                <option value="doi">Dogri (doi)</option>
                <option value="gu">Gujarati (gu)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="kn">Kannada (kn)</option>
                <option value="ks">Kashmiri (ks)</option>
                <option value="kok">Konkani (kok)</option>
                <option value="mai">Maithili (mai)</option>
                <option value="ml">Malayalam (ml)</option>
                <option value="mni">Manipuri (mni)</option>
                <option value="mr">Marathi (mr)</option>
                <option value="ne">Nepali (ne)</option>
                <option value="or">Odia (or)</option>
                <option value="pa">Punjabi (pa)</option>
                <option value="sa">Sanskrit (sa)</option>
                <option value="sat">Santali (sat)</option>
                <option value="sd">Sindhi (sd)</option>
                <option value="ta">Tamil (ta)</option>
                <option value="te">Telugu (te)</option>
                <option value="ur">Urdu (ur)</option>
              </optgroup>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={() => activeNoticeMutation.mutate()}
              disabled={!purpose.trim() || activeNoticeMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {activeNoticeMutation.isPending ? 'Fetching…' : 'Fetch Active Notice'}
            </Button>
          </div>
        </div>

        {activeNoticeMutation.error && (
          <div className="mt-4">
            <UserFacingErrorPanel error={activeNoticeMutation.error} />
          </div>
        )}

        {activeNoticeResult && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">PUBLISHED</span>
                <span className="text-sm font-semibold text-gray-900">{activeNoticeResult.purpose}</span>
                <span className="text-xs text-gray-500">Version {activeNoticeResult.versionNumber} · {activeNoticeResult.language.toUpperCase()}</span>
                <span className="text-xs text-gray-400">Published {new Date(activeNoticeResult.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNoticeId(activeNoticeResult.noticeId);
                    setVersionId(activeNoticeResult.versionId);
                    toast.success('Filled into wizard below');
                  }}
                >
                  Use in Wizard
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notice Content</div>
              <pre className="max-h-72 overflow-auto rounded border border-green-200 bg-white p-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {activeNoticeResult.content}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Dual notice lookup */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Active Dual Notice Lookup</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Returns <strong>two versions side-by-side</strong>: the English notice and the regional-language notice for a given state/region.
          Required under <strong>DPDP Act</strong> — notices must be available in English <em>and</em> the user's regional language.
        </p>
        <div className="mt-1 rounded bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
          💡 Example: Select purpose <strong>marketing</strong> + region <strong>Tamil Nadu (TN)</strong> → backend returns the English notice and the Tamil notice together.
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Purpose</Label>
            {allNotices.length > 0 ? (
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={dualPurpose}
                onChange={(e) => setDualPurpose(e.target.value)}
              >
                <option value="">— pick a purpose —</option>
                {allNotices.map((n) => {
                  const statusLabel = n.latestVersionStatus === 'PUBLISHED'
                    ? '(Live)'
                    : n.latestVersionStatus === 'DRAFT'
                    ? '(Draft)'
                    : '(No version yet)';
                  return (
                    <option key={n.noticeId} value={n.purpose}>
                      {n.purpose} — {n.title} {statusLabel}
                    </option>
                  );
                })}
              </select>
            ) : (
              <Input value={dualPurpose} onChange={(e) => setDualPurpose(e.target.value)} placeholder="e.g. marketing" />
            )}
            {dualPurpose && (() => {
              const sel = allNotices.find((n) => n.purpose === dualPurpose);
              if (!sel) return null;
              if (sel.latestVersionStatus !== 'PUBLISHED') {
                return (
                  <div className="mt-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-800">
                    ⚠️ This notice has no published version — publish one first via the wizard below.
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div>
            <Label>State / Region</Label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">— pick a state —</option>
              <option value="AP">Andhra Pradesh (AP)</option>
              <option value="AR">Arunachal Pradesh (AR)</option>
              <option value="AS">Assam (AS)</option>
              <option value="BR">Bihar (BR)</option>
              <option value="CG">Chhattisgarh (CG)</option>
              <option value="GA">Goa (GA)</option>
              <option value="GJ">Gujarat (GJ)</option>
              <option value="HR">Haryana (HR)</option>
              <option value="HP">Himachal Pradesh (HP)</option>
              <option value="JH">Jharkhand (JH)</option>
              <option value="KA">Karnataka (KA)</option>
              <option value="KL">Kerala (KL)</option>
              <option value="MP">Madhya Pradesh (MP)</option>
              <option value="MH">Maharashtra (MH)</option>
              <option value="MN">Manipur (MN)</option>
              <option value="ML">Meghalaya (ML)</option>
              <option value="MZ">Mizoram (MZ)</option>
              <option value="NL">Nagaland (NL)</option>
              <option value="OD">Odisha (OD)</option>
              <option value="PB">Punjab (PB)</option>
              <option value="RJ">Rajasthan (RJ)</option>
              <option value="SK">Sikkim (SK)</option>
              <option value="TN">Tamil Nadu (TN)</option>
              <option value="TS">Telangana (TS)</option>
              <option value="TR">Tripura (TR)</option>
              <option value="UP">Uttar Pradesh (UP)</option>
              <option value="UK">Uttarakhand (UK)</option>
              <option value="WB">West Bengal (WB)</option>
              <option value="DL">Delhi (DL)</option>
              <option value="JK">Jammu &amp; Kashmir (JK)</option>
              <option value="LA">Ladakh (LA)</option>
              <option value="PY">Puducherry (PY)</option>
              <option value="IN">All India (IN)</option>
            </select>
            <p className="mt-1 text-[11px] text-gray-500">Backend uses this to pick the matching regional language.</p>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={() => activeDualMutation.mutate()}
              disabled={!dualPurpose.trim() || !region.trim() || activeDualMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {activeDualMutation.isPending ? 'Fetching…' : 'Fetch Both Notices'}
            </Button>
          </div>
        </div>

        {activeDualMutation.error && (
          <div className="mt-4">
            <UserFacingErrorPanel error={activeDualMutation.error} />
          </div>
        )}

        {dualNoticeResult && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">PUBLISHED</span>
              <span className="text-sm font-semibold text-gray-900">{dualNoticeResult.purpose}</span>
              <span className="text-xs text-gray-500">Version {dualNoticeResult.versionNumber} · Region {dualNoticeResult.region}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  English ({dualNoticeResult.english.language.toUpperCase()})
                </div>
                <pre className="max-h-64 overflow-auto rounded border border-gray-100 bg-gray-50 p-2 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {dualNoticeResult.english.content}
                </pre>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2">
                  Regional ({dualNoticeResult.regional.language.toUpperCase()})
                </div>
                <pre className="max-h-64 overflow-auto rounded border border-blue-100 bg-blue-50 p-2 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {dualNoticeResult.regional.content}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin operations */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Notice Operations</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Create notices, add language versions, and publish them.
        </p>

        {!canWrite && (
          <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            Write operations are restricted to {ROLES.TENANT_ADMIN} / {ROLES.DPO}.
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-gray-500" />
              <div className="font-medium text-gray-900">Create Notice</div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Purpose</Label>
                <Input value={createPurpose} onChange={(e) => setCreatePurpose(e.target.value)} />
              </div>
              <div>
                <Label>Default Language</Label>
                <Input value={createDefaultLanguage} onChange={(e) => setCreateDefaultLanguage(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Title</Label>
                <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Category</Label>
                <Input value={createCategory} onChange={(e) => setCreateCategory(e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <Button
                onClick={() => createNoticeMutation.mutate()}
                disabled={!canWrite || createNoticeMutation.isPending}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </div>
            {createNoticeMutation.error && (
              <div className="mt-3">
                <UserFacingErrorPanel error={createNoticeMutation.error} />
              </div>
            )}
          </div>

          <div className="rounded border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-gray-500" />
              <div className="font-medium text-gray-900">Create Version / Add Language / Publish</div>
            </div>
            <div className="mt-3 rounded border border-blue-100 bg-blue-50 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-blue-900">Select a Notice</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void queryClient.invalidateQueries({ queryKey: ['consent-notices', tenantId] })}
                  disabled={noticeListQuery.isFetching}
                  className="gap-1 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 ${noticeListQuery.isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {noticeListQuery.isLoading && (
                <div className="mt-2 text-xs text-blue-700">Loading notices from backend...</div>
              )}
              {noticeListQuery.isError && (
                <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  Could not reach backend  showing locally saved IDs as fallback.
                </div>
              )}

              {allNotices.length === 0 && !noticeListQuery.isLoading && (
                <div className="mt-2 text-xs text-blue-700">
                  No notices yet  create one in the panel on the left and it will appear here automatically.
                </div>
              )}

              {allNotices.length > 0 && (
                <select
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value=""
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const n = allNotices.find((x) => x.noticeId === selectedId);
                    if (!n) return;
                    setNoticeId(n.noticeId);
                    if (n.latestVersionId) setVersionId(n.latestVersionId);
                    toast.success(
                      n.latestVersionId
                        ? `"${n.purpose}" selected  IDs filled`
                        : `"${n.purpose}" selected  no version yet, click Create Draft Version below`
                    );
                  }}
                >
                  <option value="">Choose a notice...</option>
                  {allNotices.map((n) => (
                    <option key={n.noticeId} value={n.noticeId}>
                      {n.purpose}
                      {n.title ? `  ${n.title}` : ''}
                      {n.latestVersionStatus
                        ? ` [v${n.latestVersionNumber ?? '?'} ${n.latestVersionStatus}]`
                        : ' [no version yet]'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ── Step indicator ─────────────────────────────────────── */}
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${noticeId.trim() ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
              <span className={noticeId.trim() ? 'text-green-700' : 'text-gray-500'}>Notice selected</span>
              <span className="text-gray-300">→</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${versionId.trim() ? 'bg-green-500 text-white' : noticeId.trim() ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
              <span className={versionId.trim() ? 'text-green-700' : noticeId.trim() ? 'text-blue-700' : 'text-gray-400'}>Draft version</span>
              <span className="text-gray-300">→</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${versionId.trim() ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
              <span className={versionId.trim() ? 'text-blue-700' : 'text-gray-400'}>Add language &amp; publish</span>
            </div>

            {/* ── Step 2: Create draft version ────────────────────────── */}
            <div className={`mt-3 rounded border p-3 ${noticeId.trim() ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Step 2 — Create a draft version</div>
                {versionId.trim() && (
                  <Badge variant="secondary" className="text-xs">
                    Version ready ✓
                  </Badge>
                )}
              </div>

              {/* Show selected notice context */}
              {noticeId.trim() && (
                <div className="mt-2 rounded bg-white px-3 py-1.5 text-xs text-gray-700 border border-gray-200">
                  Notice: <span className="font-mono">{noticeId}</span>
                </div>
              )}
              {!noticeId.trim() && (
                <div className="mt-2 text-xs text-gray-500">← Select a notice above first.</div>
              )}

              {/* Version already exists: show it read-only */}
              {versionId.trim() && (
                <div className="mt-2 flex items-center gap-2 rounded bg-green-50 border border-green-200 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-green-700 font-medium">Draft version created</div>
                    <div className="mt-0.5 font-mono text-xs text-green-900 break-all">{versionId}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button type="button" variant="outline" size="sm" className="text-xs"
                      onClick={() => copyToClipboard('versionId', versionId)}>
                      Copy
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="text-xs text-red-600"
                      onClick={() => { setVersionId(''); }}>
                      Reset
                    </Button>
                  </div>
                </div>
              )}

              {/* No version yet: show create form */}
              {!versionId.trim() && (
                <div className="mt-2 space-y-2">
                  <div>
                    <Label className="text-xs">Change summary <span className="text-gray-400">(optional label)</span></Label>
                    <Input
                      value={changeSummary}
                      onChange={(e) => setChangeSummary(e.target.value)}
                      placeholder="e.g. Initial version"
                      disabled={!noticeId.trim()}
                    />
                  </div>
                  <Button
                    onClick={() => createVersionMutation.mutate()}
                    disabled={!canWrite || !noticeId.trim() || createVersionMutation.isPending}
                    className="gap-2"
                  >
                    {createVersionMutation.isPending ? 'Creating…' : 'Create Draft Version'}
                  </Button>
                </div>
              )}

              {createVersionMutation.error && (
                <div className="mt-2"><UserFacingErrorPanel error={createVersionMutation.error} /></div>
              )}
            </div>

            {/* ── Step 3a: Add language ────────────────────────────────── */}
            <div className={`mt-3 rounded border p-3 ${versionId.trim() ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-gray-500" />
                <div className="text-sm font-semibold text-gray-900">Step 3a — Add language content</div>
              </div>
              {!versionId.trim() && (
                <div className="mt-2 text-xs text-gray-500">← Complete step 2 first.</div>
              )}
              {versionId.trim() && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label className="text-xs">Language</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={languageCode}
                      onChange={(e) => setLanguageCode(e.target.value)}
                    >
                      <option value="en">English (en)</option>
                      <optgroup label="22 Scheduled Indian Languages">
                        <option value="as">Assamese — অসমীয়া</option>
                        <option value="bn">Bengali — বাংলা</option>
                        <option value="brx">Bodo — बड़ो</option>
                        <option value="doi">Dogri — डोगरी</option>
                        <option value="gu">Gujarati — ગુજરાતી</option>
                        <option value="hi">Hindi — हिन्दी</option>
                        <option value="kn">Kannada — ಕನ್ನಡ</option>
                        <option value="ks">Kashmiri — کٲشُر</option>
                        <option value="kok">Konkani — कोंकणी</option>
                        <option value="mai">Maithili — मैथिली</option>
                        <option value="ml">Malayalam — മലയാളം</option>
                        <option value="mni">Manipuri — মৈতৈলোন্</option>
                        <option value="mr">Marathi — मराठी</option>
                        <option value="ne">Nepali — नेपाली</option>
                        <option value="or">Odia — ଓଡ଼ିଆ</option>
                        <option value="pa">Punjabi — ਪੰਜਾਬੀ</option>
                        <option value="sa">Sanskrit — संस्कृतम्</option>
                        <option value="sat">Santali — ᱥᱟᱱᱛᱟᱲᱤ</option>
                        <option value="sd">Sindhi — سنڌي</option>
                        <option value="ta">Tamil — தமிழ்</option>
                        <option value="te">Telugu — తెలుగు</option>
                        <option value="ur">Urdu — اردو</option>
                      </optgroup>
                    </select>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Select the language this notice content is written in.
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Notice content</Label>
                    <Textarea
                      value={languageContent}
                      onChange={(e) => setLanguageContent(e.target.value)}
                      rows={5}
                      placeholder="Paste or type the full notice text in the selected language…"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => addLanguageMutation.mutate()}
                    disabled={
                      !canWrite || !languageCode.trim() || !languageContent.trim() || addLanguageMutation.isPending
                    }
                  >
                    {addLanguageMutation.isPending ? 'Saving…' : `Add ${languageCode.toUpperCase()} Content`}
                  </Button>
                  {addLanguageMutation.isSuccess && (
                    <div className="rounded bg-green-50 border border-green-200 px-3 py-1.5 text-xs text-green-800">
                      ✓ Language content saved. You can add another language or proceed to publish.
                    </div>
                  )}
                  {addLanguageMutation.error && (
                    <UserFacingErrorPanel error={addLanguageMutation.error} />
                  )}
                </div>
              )}
            </div>

            {/* ── Step 3b: Publish ─────────────────────────────────────── */}
            <div className={`mt-3 rounded border p-3 ${versionId.trim() ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="text-sm font-semibold text-gray-900">Step 3b — Publish version</div>
              {!versionId.trim() && (
                <div className="mt-2 text-xs text-gray-500">← Complete step 2 first.</div>
              )}
              {versionId.trim() && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs">Legal Basis <span className="text-red-500">*</span></Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={scopeLegalBasis}
                        onChange={(e) => setScopeLegalBasis(e.target.value)}
                      >
                        <option value="CONSENT">Consent — user actively agreed</option>
                        <option value="LEGITIMATE_INTEREST">Legitimate Interest</option>
                        <option value="LEGAL_OBLIGATION">Legal Obligation</option>
                        <option value="VITAL_INTERESTS">Vital Interests</option>
                        <option value="PUBLIC_TASK">Public Task</option>
                        <option value="CONTRACT">Contract performance</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Retention Period (days) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        min={1}
                        value={scopeRetentionDays}
                        onChange={(e) => setScopeRetentionDays(e.target.value)}
                        placeholder="e.g. 365"
                      />
                      <p className="mt-1 text-[11px] text-gray-500">How long will this data be kept?</p>
                    </div>
                    <div>
                      <Label className="text-xs">Data Categories <span className="text-gray-400">(comma separated)</span></Label>
                      <Input
                        value={scopeDataCategories}
                        onChange={(e) => setScopeDataCategories(e.target.value)}
                        placeholder="e.g. name, email, phone"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Recipients <span className="text-gray-400">(comma separated)</span></Label>
                      <Input
                        value={scopeRecipients}
                        onChange={(e) => setScopeRecipients(e.target.value)}
                        placeholder="e.g. marketing-team, analytics-provider"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Processing Activities <span className="text-gray-400">(comma separated)</span></Label>
                      <Input
                        value={scopeProcessingActivities}
                        onChange={(e) => setScopeProcessingActivities(e.target.value)}
                        placeholder="e.g. email-marketing, analytics, profiling"
                      />
                    </div>
                  </div>
                  {publishMutation.isSuccess ? (
                    <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-300 px-4 py-3">
                      <span className="text-lg">✅</span>
                      <div>
                        <div className="text-sm font-semibold text-green-800">Version is Published</div>
                        <div className="text-xs text-green-700">This version is now live. To publish a new version, start from Step 2 again.</div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => publishMutation.mutate()}
                      disabled={!canWrite || !scopeLegalBasis || !scopeRetentionDays || publishMutation.isPending}
                      className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {publishMutation.isPending ? 'Publishing…' : 'Publish Version'}
                    </Button>
                  )}
                  {publishMutation.error && (
                    <UserFacingErrorPanel error={publishMutation.error} />
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
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
