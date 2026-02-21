import { Toaster } from 'sonner';

export function GlobalToaster() {
  return (
    <Toaster 
      position="top-right"
      richColors
      closeButton
      expand={false}
    />
  );
}
