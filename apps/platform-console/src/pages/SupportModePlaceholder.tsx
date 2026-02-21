export function SupportModePlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Mode</h1>
        <p className="text-gray-600 mt-2">Cross-tenant troubleshooting and support operations</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Support Mode Access</h2>
          <p className="text-gray-600 mb-4">
            Securely access tenant data for troubleshooting with full audit trail
          </p>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
            Will be implemented in Part 4
          </div>
        </div>

        <div className="mt-8 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Session</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tenant
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md" disabled>
                <option>Select a tenant...</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Access
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Describe the support issue..."
                disabled
              />
            </div>

            <button
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
              disabled
            >
              Start Support Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
