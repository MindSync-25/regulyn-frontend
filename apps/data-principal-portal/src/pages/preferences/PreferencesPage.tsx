import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, MessageSquare, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { notificationApi, type NotificationPreference } from '@/lib/api/notifications';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CHANNEL_META: Record<
  NotificationPreference['channel'],
  { label: string; icon: React.ElementType; description: string }
> = {
  EMAIL: {
    label: 'Email notifications',
    icon: Mail,
    description: 'Receive updates and alerts about your requests via email',
  },
  SMS: {
    label: 'SMS notifications',
    icon: Phone,
    description: 'Get text messages for important alerts on your registered mobile number',
  },
  WHATSAPP: {
    label: 'WhatsApp notifications',
    icon: MessageSquare,
    description: 'Receive notifications via WhatsApp on your registered number',
  },
};

function PreferenceRow({ pref }: { pref: NotificationPreference }) {
  const queryClient = useQueryClient();
  const meta = CHANNEL_META[pref.channel];

  const { mutate, isPending } = useMutation({
    mutationFn: (enabled: boolean) =>
      notificationApi.updatePreference({ channel: pref.channel, enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
      toast.success('Preference updated.');
    },
  });

  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3 flex-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
          <meta.icon className="h-4 w-4 text-gray-600" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{meta.label}</p>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
          {pref.updatedAt && (
            <p className="text-xs text-muted-foreground">Last updated {formatDate(pref.updatedAt)}</p>
          )}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={pref.enabled}
        disabled={isPending}
        onClick={() => mutate(!pref.enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors disabled:opacity-50 ${
          pref.enabled ? 'bg-primary' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            pref.enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function PreferencesPage() {
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: notificationApi.getMyPreferences,
  });

  // Ensure all three channels appear even if backend only returns some
  const allChannels: NotificationPreference['channel'][] = ['EMAIL', 'SMS', 'WHATSAPP'];
  const displayed: NotificationPreference[] = allChannels.map((ch) => {
    const found = preferences?.find((p) => p.channel === ch);
    return found ?? { channel: ch, enabled: false, updatedAt: null };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Choose how you want to be notified about updates to your requests and data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification channels
          </CardTitle>
          <CardDescription>
            You can change these at any time. Some critical alerts may always be sent via email.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0 px-6">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            displayed.map((pref) => <PreferenceRow key={pref.channel} pref={pref} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
