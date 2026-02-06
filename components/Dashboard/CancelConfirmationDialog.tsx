import React from 'react';

export interface CancelConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
}: CancelConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-export-title"
    >
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-full max-w-md mx-4 shadow-xl">
        <div className="p-6">
          <h2
            id="cancel-export-title"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2"
          >
            Cancel Export
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Are you sure you want to cancel the export? This will stop all ongoing
            operations and you will lose any progress made.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            >
              No, Continue Export
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 rounded-lg transition-colors cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              Yes, Cancel Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
