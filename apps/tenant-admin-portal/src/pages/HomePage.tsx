import { useAuthStore } from '@/store/authStore';
import { getRoleDisplayName } from '@/lib/auth/roles';

export function HomePage() {
  const { email, tenantId, roles } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your tenant admin portal
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">User Information</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tenant ID</dt>
              <dd className="font-mono text-xs">{tenantId}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Assigned Roles</h3>
          <div className="space-y-1">
            {roles.map((role) => (
              <div
                key={role}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mr-2 mb-2"
              >
                {getRoleDisplayName(role as any)}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Quick Stats</h3>
          <p className="text-sm text-muted-foreground">
            Dashboard metrics will be available in future releases.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="space-y-3 text-sm">
          <p>
            This is your tenant admin portal for managing privacy compliance activities.
            Use the navigation menu to access different modules:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
            <li>ROPA - Records of Processing Activities</li>
            <li>Consent Management - Track user consent</li>
            <li>DSAR - Data Subject Access Requests</li>
            <li>Incident Management - Security breach tracking</li>
            <li>Vendor Management - Third-party data sharing</li>
            <li>Data Retention - Automated deletion policies</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
