import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { dsarApi, type CreateDsarRequest } from '@/lib/api/dsar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const REQUEST_TYPES: { value: CreateDsarRequest['requestType']; label: string; description: string }[] = [
  { value: 'ACCESS', label: 'Access my data', description: 'Get a copy of all personal data held about you' },
  { value: 'CORRECTION', label: 'Correct my data', description: 'Fix inaccurate or incomplete personal data' },
  { value: 'DELETION', label: 'Delete my data', description: 'Request erasure of your personal data' },
  { value: 'PORTABILITY', label: 'Data portability', description: 'Receive your data in a machine-readable format' },
  { value: 'NOMINATION', label: 'Nominate someone', description: 'Authorise someone to act on your behalf' },
];

export default function DsarCreatePage() {
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState<CreateDsarRequest['requestType'] | ''>('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!requestType) { toast.error('Please select a request type.'); return; }

    setLoading(true);
    try {
      const payload: CreateDsarRequest = {
        requestType,
        details: details.trim() ? { notes: details.trim() } : undefined,
      };
      const created = await dsarApi.create(payload);
      toast.success('Request submitted successfully!');
      navigate(`/dsar/${created.dsarId}`);
    } catch {
      // error already toasted by http client
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dsar"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Request</h1>
          <p className="text-muted-foreground mt-0.5">
            Submit a data subject request to exercise your privacy rights.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request type</CardTitle>
            <CardDescription>What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {REQUEST_TYPES.map((rt) => (
              <label
                key={rt.value}
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  requestType === rt.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="requestType"
                  value={rt.value}
                  checked={requestType === rt.value}
                  onChange={() => setRequestType(rt.value)}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <p className="text-sm font-medium">{rt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rt.description}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional details <span className="font-normal text-muted-foreground">(optional)</span></CardTitle>
            <CardDescription>Provide any context that may help process your request faster.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="details">Notes</Label>
              <Textarea
                id="details"
                placeholder="e.g. I would like to receive data related to my account created in January 2023…"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" type="button" asChild>
            <Link to="/dsar">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !requestType}>
            {loading ? 'Submitting…' : 'Submit request'}
          </Button>
        </div>
      </form>
    </div>
  );
}
