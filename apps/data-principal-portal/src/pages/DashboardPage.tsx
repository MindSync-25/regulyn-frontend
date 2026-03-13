import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ToggleLeft, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { dsarApi } from '@/lib/api/dsar';
import { consentApi } from '@/lib/api/consent';
import { nomineeApi } from '@/lib/api/nominees';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const email = useAuthStore((s) => s.email);
  const firstName = email?.split('@')[0] ?? 'there';

  const { data: dsarData } = useQuery({
    queryKey: ['dsar', 'list'],
    queryFn: () => dsarApi.list({ page: 0, size: 5 }),
  });

  const { data: consents } = useQuery({
    queryKey: ['consents', 'list'],
    queryFn: () => consentApi.listMyConsents(),
  });

  const { data: nominees } = useQuery({
    queryKey: ['nominees', 'list'],
    queryFn: () => nomineeApi.listMyNominees(),
  });

  const pendingCount = dsarData?.content?.filter(
    (d) => d.status === 'PENDING' || d.status === 'IN_PROGRESS'
  ).length ?? 0;

  const activeConsents = consents?.filter((c) => c.consentGiven)?.length ?? 0;
  const nomineeCount = nominees?.length ?? 0;

  const recentRequests = dsarData?.content?.slice(0, 3) ?? [];

  const stats = [
    {
      label: 'Pending Requests',
      value: pendingCount,
      icon: ClipboardList,
      href: '/dsar',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Active Consents',
      value: activeConsents,
      icon: ToggleLeft,
      href: '/consents',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'My Nominees',
      value: nomineeCount,
      icon: Users,
      href: '/nominees',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal data rights in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 pt-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Recent Requests</CardTitle>
            <CardDescription>Your latest data subject requests</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dsar">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No requests yet.</p>
              <Button size="sm" asChild>
                <Link to="/dsar/new">Submit your first request</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {recentRequests.map((req) => (
                <li key={req.dsarId} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{req.requestType?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant={req.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {req.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/dsar/new">+ New Request</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/consents">Manage Consents</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/evidence">Download My Data</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
