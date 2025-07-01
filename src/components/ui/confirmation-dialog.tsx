"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string; // Keep for backward compatibility
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "destructive";
  disabled?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  variant = "default",
  disabled = false
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    if (!disabled) {
      onConfirm();
    }
  };

  const displayMessage = description || message || "";
  const isDestructive = variant === "danger" || variant === "destructive";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                isDestructive ? "bg-red-100" : "bg-orange-100"
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  isDestructive ? "text-red-600" : "text-orange-600"
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {displayMessage}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={disabled}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={disabled}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDestructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    message?: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "danger" | "destructive";
    disabled?: boolean;
  }>({
    isOpen: false,
    title: "",
    onConfirm: () => {},
  });

  const showDialog = ({
    title,
    description,
    message,
    onConfirm,
    confirmText,
    cancelText,
    variant = "default",
    disabled = false
  }: Omit<ConfirmationDialogProps, "isOpen" | "onClose">) => {
    setDialogState({
      isOpen: true,
      title,
      description,
      message,
      onConfirm,
      confirmText,
      cancelText,
      variant,
      disabled
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      {...dialogState}
      onClose={closeDialog}
    />
  );

  return {
    showDialog,
    closeDialog,
    ConfirmationDialog: ConfirmationDialogComponent
  };
}
