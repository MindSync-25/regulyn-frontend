export function GlobalAuditPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Global Audit Log</h1>
        <p className="text-gray-600 mt-2">Platform-wide audit trail and compliance logs</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📜</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Global Audit Trail</h2>
          <p className="text-gray-600 mb-4">
            Comprehensive audit logs across all tenants and platform operations
          </p>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
            Will be implemented in Part 4
          </div>
        </div>

        <div className="mt-8">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search audit logs..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
              disabled
            />
            <select className="px-4 py-2 border border-gray-300 rounded-md" disabled>
              <option>All Events</option>
              <option>Admin Actions</option>
              <option>Support Mode</option>
              <option>Tenant Changes</option>
            </select>
          </div>

          <div className="border border-gray-200 rounded-lg divide-y">
            <div className="p-4 bg-gray-50 font-medium text-sm text-gray-700">
              <div className="grid grid-cols-5 gap-4">
                <span>Timestamp</span>
                <span>Actor</span>
                <span>Action</span>
                <span>Resource</span>
                <span>Status</span>
              </div>
            </div>
            <div className="p-8 text-center text-gray-500">
              No audit logs to display (placeholder)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
