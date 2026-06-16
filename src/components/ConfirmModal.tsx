import React from "react"
import { AlertCircle, X } from "lucide-react"
import { Button } from "./ui"

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null

  const variantColors = {
    danger: {
      icon: "text-[color:var(--student-danger)]",
      bg: "bg-[color:var(--student-danger-surface)]",
      border: "border-[color:var(--app-danger-border)]",
      button: "danger" as const,
    },
    warning: {
      icon: "text-[color:var(--student-warning)]",
      bg: "bg-[color:var(--student-warning-surface)]",
      border: "border-[color:var(--app-warning-border)]",
      button: "primary" as const,
    },
    info: {
      icon: "text-[color:var(--student-info)]",
      bg: "bg-[color:var(--student-info-surface)]",
      border: "border-[color:var(--student-border-strong)]",
      button: "primary" as const,
    },
  }

  const colors = variantColors[variant]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] shadow-[var(--student-shadow)] transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[color:var(--student-border)] p-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${colors.bg} ${colors.border} border-2`}
            >
              <AlertCircle className={`h-6 w-6 ${colors.icon}`} />
            </div>
            <h2 className="text-xl font-bold text-[color:var(--student-text)]">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-2 text-[color:var(--student-text-muted)] transition-colors hover:bg-[color:var(--student-surface)] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="whitespace-pre-line text-[color:var(--student-text-soft)]">
            {message}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-6 sm:flex-row">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={colors.button}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
