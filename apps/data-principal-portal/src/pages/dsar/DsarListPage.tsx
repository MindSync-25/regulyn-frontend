import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { dsarApi, type DsarSummary } from '@/lib/api/dsar';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const STATUS_OPTIONS = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'WITHDRAWN'];

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'COMPLETED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'IN_PROGRESS') return 'secondary';
  return 'outline';
}

export default function DsarListPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['dsar', 'list', statusFilter, page],
    queryFn: () => dsarApi.list({ status: statusFilter || undefined, page, size: 10 }),
  });

  const requests: DsarSummary[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-muted-foreground mt-1">
            All your data subject requests in one place.
          </p>
        </div>
        <Button asChild>
          <Link to="/dsar/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <Button
            key={s || 'all'}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(0); }}
          >
            {s || 'All'}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data ? `${data.totalElements} request${data.totalElements !== 1 ? 's' : ''}` : 'Requests'}
          </CardTitle>
          <CardDescription>Click a row to view details</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12 text-sm text-muted-foreground">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No requests found.</p>
              <Button size="sm" asChild>
                <Link to="/dsar/new">Submit your first request</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {requests.map((req) => (
                <li key={req.dsarId}>
                  <Link
                    to={`/dsar/${req.dsarId}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {req.requestType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDate(req.createdAt ?? '')}
                        {req.dueAt && ` · Due ${formatDate(req.dueAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.slaBreached && (
                        <Badge variant="destructive" className="text-xs">SLA Breached</Badge>
                      )}
                      <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
