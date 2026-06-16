import { useContext } from "react"
import { OnboardingContext } from "./OnboardingContext"

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error("useOnboarding deve ser usado dentro de OnboardingProvider")
  }
  return context
}
