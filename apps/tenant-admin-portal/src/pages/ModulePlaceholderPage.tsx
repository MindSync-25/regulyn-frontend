interface ModulePlaceholderPageProps {
  moduleName: string;
  description?: string;
}

export function ModulePlaceholderPage({
  moduleName,
  description,
}: ModulePlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{moduleName}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
        <div className="text-center max-w-md">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Module Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            The {moduleName} module will be implemented in Part 2 and beyond.
            This is a placeholder to demonstrate role-based routing and navigation.
          </p>
        </div>
      </div>
    </div>
  );
}
