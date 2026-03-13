import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { nomineeApi, type AddNomineeRequest } from '@/lib/api/nominees';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: 'FAMILY', label: 'Family member' },
  { value: 'LEGAL_REP', label: 'Legal representative' },
  { value: 'GUARDIAN', label: 'Guardian' },
  { value: 'OTHER', label: 'Other' },
];

function AddNomineeForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddNomineeRequest>({
    nomineeName: '',
    nomineeEmail: '',
    nomineePhone: '',
    relationship: '',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: nomineeApi.addNominee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominees', 'list'] });
      toast.success('Nominee added successfully.');
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nomineeName || !form.nomineeEmail || !form.relationship) {
      toast.error('Please fill in all required fields.');
      return;
    }
    mutate({ ...form, nomineePhone: form.nomineePhone || undefined });
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Add a nominee</CardTitle>
        <CardDescription>This person will be able to submit requests on your behalf after verification.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomineeName">Full name *</Label>
              <Input
                id="nomineeName"
                placeholder="Jane Doe"
                value={form.nomineeName}
                onChange={(e) => setForm((f) => ({ ...f, nomineeName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomineeEmail">Email *</Label>
              <Input
                id="nomineeEmail"
                type="email"
                placeholder="jane@example.com"
                value={form.nomineeEmail}
                onChange={(e) => setForm((f) => ({ ...f, nomineeEmail: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomineePhone">Phone (optional)</Label>
              <Input
                id="nomineePhone"
                type="tel"
                placeholder="+91 9876543210"
                value={form.nomineePhone}
                onChange={(e) => setForm((f) => ({ ...f, nomineePhone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship *</Label>
              <select
                id="relationship"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.relationship}
                onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                required
              >
                <option value="">Select…</option>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Adding…' : 'Add nominee'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function NomineesPage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: nominees, isLoading } = useQuery({
    queryKey: ['nominees', 'list'],
    queryFn: nomineeApi.listMyNominees,
  });

  const { mutate: remove } = useMutation({
    mutationFn: nomineeApi.removeNominee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominees', 'list'] });
      toast.success('Nominee removed.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Nominees</h1>
          <p className="text-muted-foreground mt-1">
            People authorised to submit privacy requests on your behalf.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add nominee
          </Button>
        )}
      </div>

      {showForm && <AddNomineeForm onClose={() => setShowForm(false)} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nominees</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Nominees must be verified before they can act on your behalf
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : !nominees?.length ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No nominees yet.</p>
              <Button size="sm" onClick={() => setShowForm(true)}>Add your first nominee</Button>
            </div>
          ) : (
            <ul className="divide-y">
              {nominees.map((nominee) => (
                <li key={nominee.nomineeId} className="flex items-center justify-between px-6 py-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{nominee.nomineeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {nominee.nomineeEmail}
                      {nominee.nomineePhone && ` · ${nominee.nomineePhone}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{nominee.relationship.replace(/_/g, ' ')}</Badge>
                      <Badge variant={nominee.status === 'VERIFIED' ? 'default' : 'secondary'} className="text-xs">
                        {nominee.status}
                      </Badge>
                      {nominee.createdAt && (
                        <span className="text-xs text-muted-foreground">Added {formatDate(nominee.createdAt)}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Remove ${nominee.nomineeName} as a nominee?`)) {
                        remove(nominee.nomineeId);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
