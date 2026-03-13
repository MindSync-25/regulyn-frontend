import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { dsarApi } from '@/lib/api/dsar';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'COMPLETED') return 'default';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'IN_PROGRESS') return 'secondary';
  return 'outline';
}

interface TimelineEvent {
  label: string;
  date: string | null | undefined;
  done: boolean;
}

export default function DsarDetailPage() {
  const { dsarId } = useParams<{ dsarId: string }>();
  const queryClient = useQueryClient();

  const { data: req, isLoading, isError } = useQuery({
    queryKey: ['dsar', dsarId],
    queryFn: () => dsarApi.get(dsarId!),
    enabled: !!dsarId,
  });

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: () => dsarApi.withdraw(dsarId!),
    onSuccess: () => {
      toast.success('Request withdrawn successfully.');
      queryClient.invalidateQueries({ queryKey: ['dsar', dsarId] });
      queryClient.invalidateQueries({ queryKey: ['dsar', 'list'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (isError || !req) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Request not found.</p>
        <Button variant="outline" asChild><Link to="/dsar">Back to My Requests</Link></Button>
      </div>
    );
  }

  const timeline: TimelineEvent[] = [
    { label: 'Request submitted', date: req.createdAt, done: !!req.createdAt },
    { label: 'Under review', date: null, done: req.status === 'IN_PROGRESS' || req.status === 'COMPLETED' || req.status === 'REJECTED' },
    { label: req.status === 'REJECTED' ? 'Request rejected' : 'Request completed', date: req.closedAt, done: !!req.closedAt },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dsar"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {req.requestType.replace(/_/g, ' ')}
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{req.dsarId}</p>
        </div>
        <Badge variant={statusVariant(req.status)} className="ml-auto">{req.status}</Badge>
      </div>

      {/* Withdraw action — only for withdrawable statuses */}
      {(req.status === 'PENDING' || req.status === 'IN_PROGRESS') && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <XCircle className="h-4 w-4 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800 flex-1">
            You can withdraw this request if you no longer need it.
          </p>
          <Button
            variant="destructive"
            size="sm"
            disabled={isWithdrawing}
            onClick={() => {
              if (confirm('Are you sure you want to withdraw this request? This cannot be undone.')) {
                withdraw();
              }
            }}
          >
            {isWithdrawing ? 'Withdrawing…' : 'Withdraw request'}
          </Button>
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground text-xs">Submitted</p>
              <p className="font-medium">{formatDate(req.createdAt ?? '')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Due date</p>
              <p className={`font-medium ${req.slaBreached ? 'text-destructive' : ''}`}>
                {req.dueAt ? formatDate(req.dueAt) : '—'}
                {req.slaBreached && ' (SLA breached)'}
              </p>
            </div>
            {req.assignedTo && (
              <div>
                <p className="text-muted-foreground text-xs">Assigned to</p>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="font-medium">{req.assignedTo}</p>
                </div>
              </div>
            )}
            {req.closedAt && (
              <div>
                <p className="text-muted-foreground text-xs">Closed on</p>
                <p className="font-medium">{formatDateTime(req.closedAt)}</p>
              </div>
            )}
          </div>

          {req.closeNotes && (
            <div className="rounded-lg bg-gray-50 p-3 mt-2">
              <p className="text-xs text-muted-foreground mb-1">Resolution notes</p>
              <p>{req.closeNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
          <CardDescription>Progress of your request</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l border-gray-200 ml-3 space-y-6">
            {timeline.map((event, idx) => (
              <li key={idx} className="ml-6">
                <span
                  className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                    event.done ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <Clock className={`h-3 w-3 ${event.done ? 'text-white' : 'text-gray-400'}`} />
                </span>
                <p className={`text-sm font-medium ${event.done ? 'text-gray-900' : 'text-muted-foreground'}`}>
                  {event.label}
                </p>
                {event.date && (
                  <p className="text-xs text-muted-foreground">{formatDateTime(event.date)}</p>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
