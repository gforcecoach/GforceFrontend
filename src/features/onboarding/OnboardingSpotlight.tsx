import React, { useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react"
import { Button } from "../../components/ui"
import { useOnboarding } from "./useOnboarding"
import { useOnboardingPosition } from "./useOnboardingPosition"

export const OnboardingSpotlight: React.FC = () => {
  const {
    isActive,
    currentStep,
    currentIndex,
    totalSteps,
    next,
    previous,
    dismiss,
  } = useOnboarding()
  const [tooltipElement, setTooltipElement] = useState<HTMLElement | null>(null)
  const { targetRect, tooltipPosition } = useOnboardingPosition({
    isActive,
    target: currentStep?.target ?? null,
    tooltipElement,
  })

  if (!isActive || !currentStep) {
    return null
  }

  const isLast = currentIndex >= totalSteps - 1

  return (
    <div
      className="fixed inset-0 z-[1000] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />

      {targetRect && (
        <div
          className="fixed rounded-2xl border-2 border-[color:var(--student-accent)] shadow-[0_0_0_9999px_rgba(0,0,0,0.68),0_0_36px_rgba(234,179,8,0.35)] transition-all duration-200"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      <section
        ref={setTooltipElement}
        className="pointer-events-auto fixed max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[360px] overflow-auto rounded-2xl border border-[color:var(--student-border-strong)] bg-[color:var(--student-surface-strong)] p-5 text-[color:var(--student-text)] shadow-2xl sm:max-w-[380px]"
        style={tooltipPosition}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--student-text-soft)]">
              Passo {currentIndex + 1} de {totalSteps}
            </p>
            <h2 id="onboarding-title" className="mt-2 text-xl font-semibold">
              {currentStep.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-2 text-[color:var(--student-text-soft)] hover:bg-[color:var(--student-surface-soft)] hover:text-[color:var(--student-text)]"
            aria-label="Fechar onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-6 text-[color:var(--student-text-soft)]">
          {currentStep.body}
        </p>

        {!targetRect && (
          <p className="mt-3 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-3 text-xs text-[color:var(--student-text-muted)]">
            Este ponto ainda não está disponível. Você pode continuar e voltar
            depois pelo menu Ajuda.
          </p>
        )}

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[color:var(--student-surface-soft)]">
          <div
            className="h-full rounded-full bg-[color:var(--student-accent)] transition-all"
            style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            icon={ArrowLeft}
            onClick={previous}
            disabled={currentIndex === 0}
            className="justify-center"
          >
            Anterior
          </Button>
          <Button
            type="button"
            icon={isLast ? CheckCircle2 : ArrowRight}
            onClick={next}
            className="justify-center"
          >
            {isLast ? "Concluir" : "Próximo"}
          </Button>
        </div>
      </section>
    </div>
  )
}
