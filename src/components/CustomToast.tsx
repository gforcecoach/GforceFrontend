import React from "react"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

interface CustomToastProps {
  type: "success" | "error" | "warning" | "info"
  message: string
  title?: string
}

export const CustomToast: React.FC<CustomToastProps> = ({
  type,
  message,
  title,
}) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[color:var(--student-success)]" />,
    error: <XCircle className="h-5 w-5 text-[color:var(--student-danger)]" />,
    warning: <AlertCircle className="h-5 w-5 text-[color:var(--student-warning)]" />,
    info: <Info className="h-5 w-5 text-[color:var(--student-info)]" />,
  }

  const colors = {
    success:
      "bg-[color:var(--student-success-surface)] border-[color:var(--app-success-border)]",
    error: "bg-[color:var(--student-danger-surface)] border-[color:var(--app-danger-border)]",
    warning:
      "bg-[color:var(--student-warning-surface)] border-[color:var(--app-warning-border)]",
    info: "bg-[color:var(--student-info-surface)] border-[color:var(--student-border-strong)]",
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-2 ${colors[type]} min-w-[300px]`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        {title && (
          <p className="mb-1 font-semibold text-[color:var(--student-text)]">{title}</p>
        )}
        <p className="text-sm text-[color:var(--student-text-soft)]">{message}</p>
      </div>
    </div>
  )
}
