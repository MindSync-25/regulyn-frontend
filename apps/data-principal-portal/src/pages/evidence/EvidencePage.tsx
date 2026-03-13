import { useQuery, useMutation } from '@tanstack/react-query';
import { FolderOpen, Download, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { evidenceApi } from '@/lib/api/evidence';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'READY') return 'default';
  if (status === 'FAILED') return 'destructive';
  if (status === 'PROCESSING') return 'secondary';
  return 'outline';
}

export default function EvidencePage() {
  const { data: bundles, isLoading, refetch } = useQuery({
    queryKey: ['evidence', 'bundles'],
    queryFn: evidenceApi.listMyBundles,
  });

  const { mutate: requestExport, isPending } = useMutation({
    mutationFn: evidenceApi.requestExport,
    onSuccess: () => {
      toast.success('Export requested! Your data package will be ready shortly.');
      refetch();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Data</h1>
        <p className="text-muted-foreground mt-1">
          Download packages of your personal data held by this organisation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data packages</CardTitle>
          <CardDescription>
            Packages are prepared in response to your data access requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : !bundles?.length ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No data packages available yet.</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Submit a Data Access request and your package will appear here once it's ready.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {bundles.map((bundle) => (
                <li key={bundle.bundleId} className="flex items-center justify-between px-6 py-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{bundle.bundleName}</p>
                    {bundle.description && (
                      <p className="text-xs text-muted-foreground">{bundle.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusVariant(bundle.status)} className="text-xs">{bundle.status}</Badge>
                      {bundle.createdAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(bundle.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {bundle.status === 'READY' && bundle.downloadUrl ? (
                      <Button size="sm" asChild>
                        <a href={bundle.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1.5" />
                          Download
                        </a>
                      </Button>
                    ) : bundle.status === 'AVAILABLE' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => requestExport(bundle.bundleId)}
                      >
                        <Download className="h-4 w-4 mr-1.5" />
                        Request export
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
