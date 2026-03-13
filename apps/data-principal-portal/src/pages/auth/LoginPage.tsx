import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, type TenantOption } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // multi-tenant disambiguation state
  const [tenantChoices, setTenantChoices] = useState<TenantOption[] | null>(null);

  async function handleSubmit(e: FormEvent, selectedTenantId?: string) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      const res = await authApi.dpLogin({
        email: email.trim(),
        password,
        tenantId: selectedTenantId,
      });

      if (res.requiresTenantSelection) {
        // Multiple tenants — show picker
        setTenantChoices(res.tenants);
        setLoading(false);
        return;
      }

      setAuth({
        token: res.token,
        tenantId: res.tenantId,
        tenantName: res.tenantName ?? '',
        userId: res.userId,
        email: res.email,
        roles: res.roles ?? [],
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 403) {
        toast.error('This account cannot access the Data Principal Portal.');
      } else {
        toast.error('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // --- Tenant selection screen ---
  if (tenantChoices) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Select Organisation</h1>
            <p className="text-sm text-muted-foreground text-center">
              Your email is registered with multiple organisations. Choose which one to sign in to.
            </p>
          </div>

          <Card>
            <CardContent className="pt-5 space-y-3">
              {tenantChoices.map((t) => (
                <button
                  key={t.tenantId}
                  disabled={loading}
                  onClick={(e) => handleSubmit(e as unknown as FormEvent, t.tenantId)}
                  className="w-full flex items-center gap-3 rounded-lg border p-4 text-left hover:bg-gray-50 hover:border-primary transition-colors disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.tenantName}</p>
                    <p className="text-xs text-muted-foreground">{t.tenantId}</p>
                  </div>
                </button>
              ))}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setTenantChoices(null)}
              >
                ← Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Main login screen ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">My Privacy Rights</h1>
          <p className="text-sm text-muted-foreground text-center">
            Access and manage your personal data rights
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your email and password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Protected by Regulyn · Your data is encrypted in transit
        </p>
      </div>
    </div>
  );
}