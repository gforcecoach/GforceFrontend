import { createContext } from "react"
import type { OnboardingChecklistItem } from "../../types"
import type { OnboardingStep } from "./onboardingFlows"

interface OnboardingContextValue {
  isActive: boolean
  currentStep: OnboardingStep | null
  currentIndex: number
  totalSteps: number
  checklist: OnboardingChecklistItem[]
  checklistCompleted: boolean
  isLoading: boolean
  next: () => void
  previous: () => void
  dismiss: () => void
  complete: () => void
  restart: () => void
  markChecklistItem: (key: string) => void
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null,
)
