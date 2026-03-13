import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import { consentApi, type ConsentPurpose } from '@/lib/api/consent';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function ConsentRow({ purpose }: { purpose: ConsentPurpose }) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (granted: boolean) =>
      consentApi.updateConsent(purpose.purposeId, { consentGiven: granted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consents', 'list'] });
      toast.success('Consent preference updated.');
    },
  });

  const granted = purpose.consentGiven;

  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{purpose.purposeName}</p>
          <Badge variant="outline" className="text-xs font-normal">{purpose.lawfulBasis}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{purpose.description}</p>
        {purpose.consentGivenAt && (
          <p className="text-xs text-muted-foreground">
            Granted {formatDate(purpose.consentGivenAt)}
            {purpose.expiresAt && ` · Expires ${formatDate(purpose.expiresAt)}`}
          </p>
        )}
        {purpose.consentWithdrawnAt && (
          <p className="text-xs text-muted-foreground">
            Withdrawn {formatDate(purpose.consentWithdrawnAt)}
          </p>
        )}
      </div>
      <button
        disabled={isPending}
        onClick={() => mutate(!granted)}
        className="shrink-0 disabled:opacity-50 transition-opacity"
        aria-label={granted ? 'Withdraw consent' : 'Give consent'}
      >
        {granted ? (
          <ToggleRight className="h-8 w-8 text-primary" />
        ) : (
          <ToggleLeft className="h-8 w-8 text-gray-400" />
        )}
      </button>
    </div>
  );
}

export default function ConsentPage() {
  const { data: consents, isLoading } = useQuery({
    queryKey: ['consents', 'list'],
    queryFn: () => consentApi.listMyConsents(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Consents</h1>
        <p className="text-muted-foreground mt-1">
          Control what personal data you share and for what purpose.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>Withdrawing consent may affect some services. Changes take effect immediately.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consent purposes</CardTitle>
          <CardDescription>Toggle to grant or withdraw your consent for each purpose</CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0 px-6">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : !consents?.length ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No consent purposes found for your account.
            </div>
          ) : (
            consents.map((c) => <ConsentRow key={c.purposeId} purpose={c} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
