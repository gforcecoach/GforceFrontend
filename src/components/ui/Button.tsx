import { type LucideIcon } from "lucide-react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "danger"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  icon?: LucideIcon
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  icon: Icon,
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[color:var(--student-accent)] bg-[image:var(--student-accent-gradient)] text-[color:var(--student-accent-contrast)] border border-[color:var(--app-border)] hover:brightness-105",
    secondary:
      "bg-[color:var(--student-surface)] hover:bg-[color:var(--student-surface-soft)] text-[color:var(--student-text)] border border-[color:var(--student-border)] hover:border-[color:var(--student-border-strong)]",
    danger:
      "bg-[color:var(--student-danger-surface)] hover:bg-[color:var(--app-danger-surface-hover)] text-[color:var(--student-danger)] border border-[color:var(--app-danger-border)]",
  }

  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  )
}
