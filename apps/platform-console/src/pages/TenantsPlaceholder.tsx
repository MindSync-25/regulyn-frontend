export function TenantsPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600 mt-2">Manage all platform tenants</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 font-medium">
          Create Tenant
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tenant Management</h2>
          <p className="text-gray-600 mb-4">
            View, create, and manage all tenants across the platform
          </p>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
            Will be implemented in Part 2
          </div>
        </div>

        <div className="mt-8">
          <div className="border border-gray-200 rounded-lg divide-y">
            <div className="p-4 bg-gray-50 font-medium text-sm text-gray-700">
              <div className="grid grid-cols-4 gap-4">
                <span>Tenant Name</span>
                <span>Status</span>
                <span>Created</span>
                <span>Actions</span>
              </div>
            </div>
            <div className="p-8 text-center text-gray-500">
              No tenants to display (placeholder)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
