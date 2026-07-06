import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Menu, Plus, X, type LucideIcon } from "lucide-react"

export interface TreinoDayNavigationItem {
  id: string
  title: string
  subtitle?: string
  countLabel?: string
}

interface TreinoDayNavigatorAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
}

interface TreinoDayNavigatorProps {
  days: TreinoDayNavigationItem[]
  selectedDayId: string
  onSelectDay: (dayId: string) => void
  label: string
  mobileLabel?: string
  idPrefix?: string
  actions?: TreinoDayNavigatorAction[]
  mobileMode?: "menu" | "inline"
}

export const TreinoDayNavigator: React.FC<TreinoDayNavigatorProps> = ({
  days,
  selectedDayId,
  onSelectDay,
  label,
  mobileLabel = "Dias de treino",
  idPrefix = "treino-day",
  actions = [],
  mobileMode = "menu",
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const desktopTabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const mobileTabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const fabButtonRef = useRef<HTMLButtonElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const selectedIndex = useMemo(
    () => days.findIndex((day) => day.id === selectedDayId),
    [days, selectedDayId],
  )

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
    window.setTimeout(() => fabButtonRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    window.setTimeout(() => closeButtonRef.current?.focus(), 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeMobileMenu, isMobileMenuOpen])

  const handleSelectDay = (dayId: string) => {
    onSelectDay(dayId)
    closeMobileMenu()
  }

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    viewport: "desktop" | "mobile",
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return
    }

    event.preventDefault()
    let nextIndex = index

    if (event.key === "ArrowLeft") {
      nextIndex = index === 0 ? days.length - 1 : index - 1
    }

    if (event.key === "ArrowRight") {
      nextIndex = index === days.length - 1 ? 0 : index + 1
    }

    if (event.key === "Home") {
      nextIndex = 0
    }

    if (event.key === "End") {
      nextIndex = days.length - 1
    }

    const nextDay = days[nextIndex]
    if (nextDay) {
      onSelectDay(nextDay.id)
      const targetRefs =
        viewport === "desktop" ? desktopTabRefs : mobileTabRefs
      window.requestAnimationFrame(() =>
        targetRefs.current[nextDay.id]?.focus(),
      )
    }
  }

  return (
    <>
      <div className="hidden md:block">
        <div
          role="tablist"
          aria-label={label}
          aria-orientation="horizontal"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {days.map((day, index) => {
            const isSelected = day.id === selectedDayId
            return (
              <button
                key={day.id}
                ref={(element) => {
                  desktopTabRefs.current[day.id] = element
                }}
                type="button"
                id={`${idPrefix}-tab-${day.id}`}
                role="tab"
                aria-selected={isSelected}
                aria-controls={`${idPrefix}-panel-${day.id}`}
                tabIndex={isSelected || (selectedIndex === -1 && index === 0) ? 0 : -1}
                onClick={() => onSelectDay(day.id)}
                onKeyDown={(event) =>
                  handleTabKeyDown(event, index, "desktop")
                }
                className={`shrink-0 rounded-lg border px-4 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)] ${
                  isSelected
                    ? "border-[color:var(--student-border-strong)] bg-[color:var(--student-info-surface)] text-[color:var(--student-text)]"
                    : "border-[color:var(--student-border)] bg-[color:var(--student-surface)] text-[color:var(--student-text-soft)] hover:border-[color:var(--student-border-strong)] hover:bg-[color:var(--student-surface-soft)]"
                }`}
              >
                <span className="block max-w-48 truncate text-sm font-semibold">
                  {day.title}
                </span>
                {(day.subtitle || day.countLabel) && (
                  <span className="mt-1 block max-w-48 truncate text-xs opacity-80">
                    {[day.subtitle, day.countLabel].filter(Boolean).join(" • ")}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {mobileMode === "inline" ? (
        <div className="md:hidden">
          <div
            role="tablist"
            aria-label={label}
            aria-orientation="horizontal"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {days.map((day, index) => {
              const isSelected = day.id === selectedDayId
              return (
                <button
                  key={day.id}
                  ref={(element) => {
                    mobileTabRefs.current[day.id] = element
                  }}
                  type="button"
                  id={`${idPrefix}-mobile-tab-${day.id}`}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`${idPrefix}-panel-${day.id}`}
                  tabIndex={
                    isSelected || (selectedIndex === -1 && index === 0) ? 0 : -1
                  }
                  onClick={() => onSelectDay(day.id)}
                  onKeyDown={(event) =>
                    handleTabKeyDown(event, index, "mobile")
                  }
                  className={[
                    "min-w-[11rem] flex-1 rounded-lg border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)]",
                    isSelected
                      ? "border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)] text-[color:var(--student-text)]"
                      : "border-[color:var(--student-border)] bg-[color:var(--student-surface)] text-[color:var(--student-text-soft)]",
                  ].join(" ")}
                >
                  <span className="flex min-w-0 items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[color:var(--student-text)]">
                        {day.title}
                      </span>
                      {(day.subtitle || day.countLabel) && (
                        <span className="mt-1 block truncate text-xs text-[color:var(--student-text-soft)]">
                          {[day.subtitle, day.countLabel].filter(Boolean).join(" • ")}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <span className="shrink-0 rounded-full border border-[color:var(--app-success-border)] bg-[color:var(--app-success-surface)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--student-success)]">
                        Ativo
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="md:hidden">
          {isMobileMenuOpen && (
            <div
              id={idPrefix + "-mobile-menu"}
              className="fixed inset-x-4 bottom-24 z-40 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] p-3 shadow-[var(--student-shadow)] transition-opacity duration-150"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[color:var(--student-text)]">
                  {mobileLabel}
                </p>
                <button
                  type="button"
                  ref={closeButtonRef}
                  onClick={closeMobileMenu}
                  className="rounded-lg p-2 text-[color:var(--student-text-soft)] hover:bg-[color:var(--student-surface-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)]"
                  aria-label="Fechar menu de dias"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {days.map((day) => {
                  const isSelected = day.id === selectedDayId
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleSelectDay(day.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={[
                        "w-full rounded-lg border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)]",
                        isSelected
                          ? "border-[color:var(--student-border-strong)] bg-[color:var(--student-info-surface)]"
                          : "border-[color:var(--student-border)] bg-[color:var(--student-surface)] hover:bg-[color:var(--student-surface-soft)]",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-semibold text-[color:var(--student-text)]">
                        {day.title}
                      </span>
                      {(day.subtitle || day.countLabel) && (
                        <span className="mt-1 block text-xs text-[color:var(--student-text-soft)]">
                          {[day.subtitle, day.countLabel].filter(Boolean).join(" • ")}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {actions.length > 0 && (
                <div className="mt-3 border-t border-[color:var(--student-border)] pt-3">
                  <div className="grid gap-2">
                    {actions.map((action) => {
                      const Icon = action.icon || Plus
                      return (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => {
                            action.onClick()
                            closeMobileMenu()
                          }}
                          className="flex items-center gap-2 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] px-3 py-2 text-sm font-medium text-[color:var(--student-text)] transition-colors hover:bg-[color:var(--student-surface-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)]"
                        >
                          <Icon className="h-4 w-4" />
                          {action.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            ref={fabButtonRef}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Fechar menu de dias" : "Abrir menu de dias"}
            aria-expanded={isMobileMenuOpen}
            aria-controls={idPrefix + "-mobile-menu"}
            className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--student-accent)] bg-[image:var(--student-accent-gradient)] text-[color:var(--student-accent-contrast)] shadow-[var(--student-shadow)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)]"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      )}
    </>
  )
}
