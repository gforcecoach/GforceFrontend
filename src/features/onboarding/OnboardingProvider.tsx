import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { onboardingApi } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"
import { OnboardingContext } from "./OnboardingContext"
import { onboardingFlows } from "./onboardingFlows"
import { OnboardingSpotlight } from "./OnboardingSpotlight"
import { OnboardingChecklist } from "./OnboardingChecklist"

interface OnboardingProviderProps {
  children: ReactNode
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [isActive, setIsActive] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const autoStartedRef = useRef(false)
  const lastProgressStepRef = useRef<string | null>(null)

  const query = useQuery(["onboarding"], onboardingApi.get, {
    enabled:
      !!user &&
      (user.role === "PROFESSOR" || user.role === "ALUNO") &&
      !user.requiresLegalAcceptance,
    staleTime: 30_000,
    retry: 1,
  })

  const flow = useMemo(() => (user ? onboardingFlows[user.role] || [] : []), [
    user,
  ])
  const currentStep = isActive ? flow[currentIndex] || null : null

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries(["onboarding"])
  }, [queryClient])

  const progressMutation = useMutation(onboardingApi.progress, {
    onSuccess: invalidate,
  })
  const completeMutation = useMutation(onboardingApi.complete, {
    onSuccess: invalidate,
  })
  const dismissMutation = useMutation(onboardingApi.dismiss, {
    onSuccess: invalidate,
  })
  const restartMutation = useMutation(onboardingApi.restart, {
    onSuccess: invalidate,
  })
  const checklistMutation = useMutation(onboardingApi.completeChecklistItem, {
    onSuccess: invalidate,
  })

  useEffect(() => {
    if (!query.data || !flow.length || autoStartedRef.current) return
    if (!query.data.shouldStart) return

    const stepKey = query.data.state.currentStepKey || "welcome"
    const index = Math.max(
      0,
      flow.findIndex((step) => step.key === stepKey),
    )
    setCurrentIndex(index)
    setIsActive(true)
    autoStartedRef.current = true
  }, [flow, query.data])

  useEffect(() => {
    if (!currentStep || !query.data) return
    const targetRoute = currentStep.route(query.data.context)
    if (targetRoute && location.pathname !== targetRoute) {
      navigate(targetRoute)
    }
    if (lastProgressStepRef.current !== currentStep.key) {
      lastProgressStepRef.current = currentStep.key
      progressMutation.mutate(currentStep.key)
    }
    // progressMutation is intentionally omitted to avoid re-firing after mutation state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.key, location.pathname, navigate, query.data])

  const complete = useCallback(() => {
    setIsActive(false)
    completeMutation.mutate()
  }, [completeMutation])

  const dismiss = useCallback(() => {
    setIsActive(false)
    dismissMutation.mutate()
  }, [dismissMutation])

  const next = useCallback(() => {
    if (currentIndex >= flow.length - 1) {
      complete()
      return
    }
    setCurrentIndex((value) => value + 1)
  }, [complete, currentIndex, flow.length])

  const previous = useCallback(() => {
    setCurrentIndex((value) => Math.max(0, value - 1))
  }, [])

  const restart = useCallback(() => {
    restartMutation.mutate(undefined, {
      onSuccess: () => {
        invalidate()
        setCurrentIndex(0)
        setIsActive(true)
        autoStartedRef.current = true
      },
    })
  }, [invalidate, restartMutation])

  const markChecklistItem = useCallback(
    (key: string) => {
      checklistMutation.mutate(key)
    },
    [checklistMutation],
  )

  const value = useMemo(
    () => ({
      isActive,
      currentStep,
      currentIndex,
      totalSteps: flow.length,
      checklist: query.data?.checklist || [],
      checklistCompleted: query.data?.checklistCompleted ?? true,
      isLoading: query.isLoading,
      next,
      previous,
      dismiss,
      complete,
      restart,
      markChecklistItem,
    }),
    [
      complete,
      currentIndex,
      currentStep,
      dismiss,
      flow.length,
      isActive,
      markChecklistItem,
      next,
      previous,
      query.data?.checklist,
      query.data?.checklistCompleted,
      query.isLoading,
      restart,
    ],
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingChecklist />
      <OnboardingSpotlight />
    </OnboardingContext.Provider>
  )
}
