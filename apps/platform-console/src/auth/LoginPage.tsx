import { useState } from 'react';
import { useAuth } from './useAuth';
import { Navigate, useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { login, isAuthenticated, isForbidden } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    const result = await login(email, password);

    setIsLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else if (result.forbidden) {
      navigate('/forbidden', { replace: true });
    } else if (result.fieldErrors) {
      setFieldErrors(result.fieldErrors);
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isForbidden) {
    return <Navigate to="/forbidden" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Regulyn Console</h1>
            <p className="text-gray-600 mt-2">Super Admin Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="admin@regulyn.io"
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                  fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Required Role: REGULYN_SUPER_ADMIN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
