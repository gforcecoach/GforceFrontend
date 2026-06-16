import React from "react"
import { HelpCircle, ListChecks, PlayCircle } from "lucide-react"
import { Button, Card } from "../components/ui"
import { useAuth } from "../hooks/useAuth"
import { useOnboarding } from "../features/onboarding/useOnboarding"
import { onboardingFlows } from "../features/onboarding/onboardingFlows"

export const OnboardingHelpPage: React.FC = () => {
  const { user } = useAuth()
  const { checklist, checklistCompleted, restart } = useOnboarding()
  const flow = user ? onboardingFlows[user.role] || [] : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-[color:var(--student-text)]">
            <HelpCircle className="h-7 w-7 text-[color:var(--student-accent)]" />
            Ajuda e guia rápido
          </h1>
          <p className="mt-2 max-w-2xl text-[color:var(--student-text-soft)]">
            Refaça o onboarding quando quiser e use o checklist para completar
            os marcos iniciais de uso da plataforma.
          </p>
        </div>
        <Button icon={PlayCircle} onClick={restart} className="justify-center">
          Refazer onboarding
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-[color:var(--student-accent)]" />
          <h2 className="text-xl font-semibold">Guia rápido</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {flow.map((step, index) => (
            <div
              key={step.key}
              className="rounded-xl border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--student-text-muted)]">
                Passo {index + 1}
              </p>
              <h3 className="mt-2 font-semibold text-[color:var(--student-text)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--student-text-soft)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {!checklistCompleted && checklist.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-[color:var(--student-accent)]" />
            <h2 className="text-xl font-semibold">Checklist inicial</h2>
          </div>
          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.key}
                className="flex items-start gap-3 rounded-xl border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="mt-1 h-4 w-4 accent-[color:var(--student-accent)]"
                  aria-label={item.label}
                />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-[color:var(--student-text-soft)]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
