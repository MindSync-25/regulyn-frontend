import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { http, isApiError, getErrorMessage } from '@/lib/api/http';
import { env } from '@/config/env';

interface SignupFormData {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState<SignupFormData>({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof SignupFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create tenant
      const tenantResponse = await http.post<{ tenantId: string; name: string }>(
        '/tenants',
        {
          name: formData.companyName,
          planCode: 'PROFESSIONAL',
        }
      );

      const tenantId = tenantResponse.tenantId;

      // Step 2: Bootstrap admin user
      await http.post<{
        userId: string;
        email: string;
        roles: string[];
      }>(
        `/tenants/${tenantId}/bootstrap-admin`,
        {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      );

      // Step 3: Auto-login
      const loginResponse = await http.post<{
        token: string;
        tenantId: string;
        tenantName: string;
        userId: string;
        email: string;
        roles: string[];
      }>('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Store auth data
      setAuth({
        token: loginResponse.token,
        tenantId: loginResponse.tenantId,
        tenantName: loginResponse.tenantName,
        userId: loginResponse.userId,
        email: loginResponse.email,
        roles: loginResponse.roles,
      });

      // Redirect to home
      navigate('/', { replace: true });
    } catch (err) {
      if (isApiError(err)) {
        switch (err.status) {
          case 409:
            setError('This email is already registered. Please use a different email or login.');
            break;
          case 422:
            setError('Please check all fields and try again.');
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
            Create your organization account
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
              <Label htmlFor="companyName">Organization Name *</Label>
              <Input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange('companyName')}
                required
                placeholder="Acme Corporation"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  required
                  placeholder="John"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  required
                  placeholder="Doe"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
                autoComplete="email"
                placeholder="admin@acme.com"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This will be your login email as the organization administrator
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
