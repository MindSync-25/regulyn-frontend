import { useAuth } from '@/auth/useAuth';
import { useNavigate } from 'react-router-dom';

interface FullPageErrorProps {
  type: '401' | '403' | '500';
  message?: string;
}

export function FullPageError({ type, message }: FullPageErrorProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleAction = () => {
    if (type === '401') {
      navigate('/login');
    } else if (type === '403') {
      logout();
      navigate('/login');
    } else if (type === '500') {
      window.location.reload();
    }
  };

  const config = {
    '401': {
      icon: '🔒',
      title: 'Session Expired',
      description: message || 'Your session has expired. Please login again.',
      actionText: 'Go to Login',
    },
    '403': {
      icon: '⛔',
      title: 'Access Forbidden',
      description: message || 'You do not have permission to access this resource. REGULYN_SUPER_ADMIN role required.',
      actionText: 'Logout',
    },
    '500': {
      icon: '❌',
      title: 'Something Went Wrong',
      description: message || 'An unexpected error occurred. Please try again.',
      actionText: 'Try Again',
    },
  };

  const { icon, title, description, actionText } = config[type];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">{icon}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>
        <button
          onClick={handleAction}
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  return <FullPageError type="403" />;
}

export function UnauthorizedPage() {
  return <FullPageError type="401" />;
}

export function ServerErrorPage() {
  return <FullPageError type="500" />;
}
