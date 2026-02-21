import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api/endpoints/auth';
import { isApiError, getErrorMessage } from '@/lib/api/http';
import { env } from '@/config/env';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Call login API
      const response = await authApi.login({ email, password });
      
      // Store auth data
      setAuth({
        token: response.token,
        tenantId: response.tenantId,
        tenantName: response.tenantName,
        userId: response.userId,
        email: response.email,
        roles: response.roles,
      });
      
      // Redirect to home
      navigate('/', { replace: true });
    } catch (err) {
      // Handle specific error codes
      if (isApiError(err)) {
        switch (err.status) {
          case 401:
            setError('Invalid email or password. Please try again.');
            break;
          case 403:
            setError('Your account has been disabled. Please contact support.');
            break;
          case 422:
            setError('Please enter a valid email and password.');
            break;
          default:
            setError(getErrorMessage(err));
        }
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{env.appName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isLoading}
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
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link
            to="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Secure tenant authentication powered by Regulyn
        </p>
      </div>
    </div>
  );
}
