import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
  confirmationText?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default',
  requiresConfirmation = false,
  confirmationText,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (requiresConfirmation && inputValue !== confirmationText) {
      return;
    }
    onConfirm();
    onOpenChange(false);
    setInputValue('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setInputValue('');
  };

  const isConfirmDisabled = requiresConfirmation && inputValue !== confirmationText;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleCancel} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          {variant === 'destructive' && (
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">{description}</p>

            {requiresConfirmation && confirmationText && (
              <div className="mb-4">
                <label htmlFor="confirm-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Type <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">{confirmationText}</code> to confirm:
                </label>
                <input
                  id="confirm-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  variant === 'destructive'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
