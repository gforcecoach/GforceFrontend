import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  ListChecks,
  X,
} from "lucide-react"
import { useOnboarding } from "./useOnboarding"

export const OnboardingChecklist: React.FC = () => {
  const { checklist, checklistCompleted, isActive, isLoading } = useOnboarding()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const mobileFabRef = useRef<HTMLButtonElement | null>(null)
  const mobileCloseButtonRef = useRef<HTMLButtonElement | null>(null)

  const pendingCount = useMemo(
    () => checklist.filter((item) => !item.completed).length,
    [checklist],
  )

  const closeMobileChecklist = useCallback(() => {
    setIsMobileExpanded(false)
    window.setTimeout(() => mobileFabRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!isMobileExpanded) {
      return
    }

    window.setTimeout(() => mobileCloseButtonRef.current?.focus(), 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileChecklist()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeMobileChecklist, isMobileExpanded])

  if (isLoading || isActive || checklistCompleted || checklist.length === 0) {
    return null
  }

  return (
    <>
      <div className="md:hidden">
        {isMobileExpanded && (
          <aside
            id="onboarding-mobile-checklist"
            className="fixed inset-x-4 bottom-24 z-40 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] p-3 text-[color:var(--student-text)] shadow-[var(--student-shadow)] transition-opacity duration-150"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[color:var(--student-accent)]" />
                <p className="text-sm font-semibold">Primeiros passos</p>
              </div>
              <button
                type="button"
                ref={mobileCloseButtonRef}
                onClick={closeMobileChecklist}
                className="rounded-lg p-2 text-[color:var(--student-text-soft)] hover:bg-[color:var(--student-surface-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)]"
                aria-label="Fechar primeiros passos"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 space-y-3 overflow-y-auto">
              {checklist.map((item) => (
                <div key={item.key} className="flex items-start gap-3">
                  <CheckCircle2
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                      item.completed
                        ? "text-[color:var(--student-success)]"
                        : "text-[color:var(--student-text-muted)]"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs leading-5 text-[color:var(--student-text-soft)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <button
          type="button"
          ref={mobileFabRef}
          onClick={() => setIsMobileExpanded((value) => !value)}
          aria-label={
            isMobileExpanded
              ? "Fechar primeiros passos"
              : "Abrir primeiros passos"
          }
          aria-expanded={isMobileExpanded}
          aria-controls="onboarding-mobile-checklist"
          className="fixed bottom-5 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--student-accent)] bg-[image:var(--student-accent-gradient)] text-[color:var(--student-accent-contrast)] shadow-[var(--student-shadow)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)]"
        >
          {isMobileExpanded ? (
            <X className="h-6 w-6" />
          ) : (
            <HelpCircle className="h-6 w-6" />
          )}
          {!isMobileExpanded && pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-[color:var(--student-surface-strong)] bg-[color:var(--student-surface-strong)] px-1 text-[10px] font-bold leading-none text-[color:var(--student-accent)] shadow-sm">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <aside className="fixed bottom-4 right-4 z-50 hidden w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] text-[color:var(--student-text)] shadow-2xl md:block">
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left"
          aria-expanded={isExpanded}
        >
          <span className="flex items-center gap-3">
            <span className="rounded-xl bg-[color:var(--student-accent-surface)] p-2">
              <ListChecks className="h-5 w-5 text-[color:var(--student-accent)]" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Primeiros passos</span>
              <span className="block text-xs text-[color:var(--student-text-soft)]">
                {pendingCount} pendência(s) para completar a configuração
              </span>
            </span>
          </span>
          <ChevronDown
            className={`h-5 w-5 text-[color:var(--student-text-soft)] transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {isExpanded && (
          <div className="border-t border-[color:var(--student-border)] p-4 pt-3">
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.key} className="flex items-start gap-3">
                  <CheckCircle2
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                      item.completed
                        ? "text-[color:var(--student-success)]"
                        : "text-[color:var(--student-text-muted)]"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs leading-5 text-[color:var(--student-text-soft)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
