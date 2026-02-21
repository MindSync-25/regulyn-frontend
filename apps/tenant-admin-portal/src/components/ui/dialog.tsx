import * as React from "react"

const Dialog = ({ open, onOpenChange, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-lg">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-lg" {...props}>
      {children}
    </div>
  );
};

const DialogHeader = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="mb-4" {...props}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h2 className="text-lg font-semibold" {...props}>
      {children}
    </h2>
  );
};

const DialogDescription = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className="text-sm text-gray-600" {...props}>
      {children}
    </p>
  );
};

const DialogFooter = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="mt-6 flex justify-end gap-2" {...props}>
      {children}
    </div>
  );
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
