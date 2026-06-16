import React from "react"
import type { ReactNode } from "react"

type BadgeVariant = "default" | "success" | "warning" | "danger"

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
}) => {
  const variants: Record<BadgeVariant, string> = {
    default:
      "bg-[color:var(--student-info-surface)] text-[color:var(--student-text)] border border-[color:var(--student-border-strong)]",
    success:
      "bg-[color:var(--student-success-surface)] text-[color:var(--student-success)] border border-[color:var(--app-success-border)]",
    warning:
      "bg-[color:var(--student-warning-surface)] text-[color:var(--student-warning)] border border-[color:var(--app-warning-border)]",
    danger:
      "bg-[color:var(--student-danger-surface)] text-[color:var(--student-danger)] border border-[color:var(--app-danger-border)]",
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
