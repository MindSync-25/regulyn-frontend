import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CopyCellProps {
  value?: string;
  label?: string;
}

export function CopyCell({ value, label }: CopyCellProps) {
  if (!value) {
    return <span className="text-xs text-slate-400">-</span>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success(label ? `${label} copied` : 'Copied to clipboard');
  };

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-md bg-slate-100/70 px-2 py-1 text-xs font-mono text-slate-900">
        {value}
      </code>
      <button
        onClick={handleCopy}
        className="text-slate-400 hover:text-slate-600"
        title="Copy"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}
