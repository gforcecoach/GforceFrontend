import React from "react"
import { CheckCircle2, Circle, Sparkles, type LucideIcon } from "lucide-react"
import { Badge } from "../ui"

interface ActivityProgressSummaryProps {
  completed: number
  total: number
  label: string
  completedLabel: string
  remainingLabel: string
  percentLabel?: string
}

interface CompletionToggleProps {
  checked: boolean
  pendingChange?: boolean
  title: string
  description: string
  checkedLabel: string
  uncheckedLabel: string
  onChange: (checked: boolean) => void
  icon?: LucideIcon
}

export const ActivityProgressSummary: React.FC<ActivityProgressSummaryProps> = ({
  completed,
  total,
  label,
  completedLabel,
  remainingLabel,
  percentLabel = "concluído",
}) => {
  const safeTotal = Math.max(total, 0)
  const safeCompleted = Math.min(Math.max(completed, 0), safeTotal)
  const remaining = Math.max(safeTotal - safeCompleted, 0)
  const progress = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0
  const isComplete = safeTotal > 0 && safeCompleted === safeTotal

  return (
    <div
      className={`mb-4 rounded-lg border p-4 transition-colors ${
        isComplete
          ? "border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)]"
          : "border-[color:var(--student-border)] bg-[color:var(--student-surface)]"
      }`}
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
              isComplete
                ? "border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)] text-[color:var(--student-success)]"
                : "border-[color:var(--student-border)] bg-[color:var(--student-surface-soft)] text-[color:var(--student-text-soft)]"
            }`}
            aria-hidden="true"
          >
            {isComplete ? <Sparkles className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--student-text)]">
              {label}
            </p>
            <p className="mt-1 text-sm text-[color:var(--student-text-soft)]">
              {safeCompleted} de {safeTotal} {completedLabel}
              {remaining > 0 ? ` • ${remaining} ${remainingLabel}` : " • tudo concluído"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[color:var(--student-text)]">
            {progress}%
          </span>
          <span className="text-xs text-[color:var(--student-text-soft)]">
            {percentLabel}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-2.5 overflow-hidden rounded-full bg-[color:var(--student-surface-soft)]"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-[color:var(--student-success)] transition-all duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export const CompletionToggle: React.FC<CompletionToggleProps> = ({
  checked,
  pendingChange = false,
  title,
  description,
  checkedLabel,
  uncheckedLabel,
  onChange,
  icon: Icon,
}) => {
  const StatusIcon = checked ? CheckCircle2 : Icon || Circle

  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={`${title}: ${checked ? checkedLabel : uncheckedLabel}`}
      onClick={() => onChange(!checked)}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)] motion-reduce:transition-none sm:w-auto sm:min-w-56 ${
        checked
          ? "border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)] text-[color:var(--student-text)]"
          : "border-[color:var(--student-border)] bg-[color:var(--student-surface)] text-[color:var(--student-text-soft)] hover:border-[color:var(--student-border-strong)] hover:bg-[color:var(--student-surface-soft)]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "border-[color:var(--app-success-border)] bg-[color:var(--app-success-surface)] text-[color:var(--student-success)]"
              : "border-[color:var(--student-border)] bg-[color:var(--student-surface-soft)] text-[color:var(--student-text-muted)]"
          }`}
          aria-hidden="true"
        >
          <StatusIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[color:var(--student-text)]">
            {checked ? checkedLabel : uncheckedLabel}
          </span>
          <span className="mt-0.5 block text-xs text-[color:var(--student-text-soft)]">
            {description}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={checked ? "success" : "warning"}>
          {checked ? "Concluído" : "Pendente"}
        </Badge>
        {pendingChange && (
          <span className="text-[11px] font-medium text-[color:var(--student-warning)]">
            alteração pendente
          </span>
        )}
      </span>
    </button>
  )
}
