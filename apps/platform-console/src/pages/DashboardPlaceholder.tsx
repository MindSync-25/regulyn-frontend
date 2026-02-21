export function DashboardPlaceholder() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-r from-[#003B8E] via-[#0047AB] to-[#1A66D9] p-4 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Executive Overview</h1>
        <p className="text-slate-200 mt-1 text-sm">High-level insights for tenant operations and platform health</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {['Total Tenants', 'Active Services', 'System Health'].map((label) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">—</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center py-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/70 text-3xl">
            📊
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600 mb-6">
            Platform metrics, tenant statistics, and system health at a glance.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
