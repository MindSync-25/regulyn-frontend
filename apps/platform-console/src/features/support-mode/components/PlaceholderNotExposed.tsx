interface PlaceholderNotExposedProps {
  title: string;
  description: string;
  todo?: string;
}

export function PlaceholderNotExposed({ title, description, todo }: PlaceholderNotExposedProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="text-4xl">🔒</div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {todo && (
        <div className="mt-4 inline-flex items-center rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          TODO: {todo}
        </div>
      )}
    </div>
  );
}
