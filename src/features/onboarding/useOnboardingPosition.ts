import { useCallback, useEffect, useLayoutEffect, useState } from "react"

interface ViewportRect {
  top: number
  left: number
  width: number
  height: number
}

interface TooltipPosition {
  top: number
  left: number
}

interface OnboardingPosition {
  targetRect: ViewportRect | null
  tooltipPosition: TooltipPosition
  updatePosition: () => void
}

interface UseOnboardingPositionParams {
  isActive: boolean
  target: string | null
  tooltipElement: HTMLElement | null
}

const TARGET_PADDING = 10
const VIEWPORT_MARGIN = 16
const TARGET_GAP = 14
const DEFAULT_TOOLTIP_WIDTH = 360
const DEFAULT_TOOLTIP_HEIGHT = 240
const MAX_LAYOUT_RETRIES = 12
const RETRY_INTERVAL_MS = 80

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max))

const getViewportSize = () => ({
  width: window.visualViewport?.width ?? window.innerWidth,
  height: window.visualViewport?.height ?? window.innerHeight,
})

const findTargetElement = (target: string | null) => {
  if (!target) return null
  return document.querySelector<HTMLElement>(
    `[data-onboarding-target="${target}"]`,
  )
}

const getTargetRect = (element: HTMLElement): ViewportRect => {
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top - TARGET_PADDING,
    left: rect.left - TARGET_PADDING,
    width: rect.width + TARGET_PADDING * 2,
    height: rect.height + TARGET_PADDING * 2,
  }
}

const getTooltipSize = (tooltipElement: HTMLElement | null) => {
  if (!tooltipElement) {
    return {
      width: DEFAULT_TOOLTIP_WIDTH,
      height: DEFAULT_TOOLTIP_HEIGHT,
    }
  }

  const rect = tooltipElement.getBoundingClientRect()
  return {
    width: rect.width || DEFAULT_TOOLTIP_WIDTH,
    height: rect.height || DEFAULT_TOOLTIP_HEIGHT,
  }
}

const calculateTooltipPosition = (
  targetRect: ViewportRect | null,
  tooltipElement: HTMLElement | null,
): TooltipPosition => {
  const viewport = getViewportSize()
  const tooltip = getTooltipSize(tooltipElement)
  const maxLeft = viewport.width - tooltip.width - VIEWPORT_MARGIN
  const maxTop = viewport.height - tooltip.height - VIEWPORT_MARGIN

  if (!targetRect) {
    return {
      top: clamp(viewport.height - tooltip.height - VIEWPORT_MARGIN, VIEWPORT_MARGIN, maxTop),
      left: clamp((viewport.width - tooltip.width) / 2, VIEWPORT_MARGIN, maxLeft),
    }
  }

  const left = clamp(targetRect.left, VIEWPORT_MARGIN, maxLeft)
  const belowTop = targetRect.top + targetRect.height + TARGET_GAP
  const aboveTop = targetRect.top - tooltip.height - TARGET_GAP
  const fitsBelow = belowTop + tooltip.height <= viewport.height - VIEWPORT_MARGIN
  const fitsAbove = aboveTop >= VIEWPORT_MARGIN

  if (fitsBelow) {
    return { top: belowTop, left }
  }

  if (fitsAbove) {
    return { top: aboveTop, left }
  }

  const targetCenter = targetRect.top + targetRect.height / 2
  const centeredTop = targetCenter < viewport.height / 2
    ? targetRect.top + targetRect.height + TARGET_GAP
    : targetRect.top - tooltip.height - TARGET_GAP

  return {
    top: clamp(centeredTop, VIEWPORT_MARGIN, maxTop),
    left,
  }
}

const scheduleAnimationFrame = (callback: () => void) => {
  let firstFrame = 0
  let secondFrame = 0

  firstFrame = window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(callback)
  })

  return () => {
    window.cancelAnimationFrame(firstFrame)
    window.cancelAnimationFrame(secondFrame)
  }
}

export const useOnboardingPosition = ({
  isActive,
  target,
  tooltipElement,
}: UseOnboardingPositionParams): OnboardingPosition => {
  const [targetRect, setTargetRect] = useState<ViewportRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: VIEWPORT_MARGIN,
    left: VIEWPORT_MARGIN,
  })

  const updatePosition = useCallback(() => {
    if (!isActive) return

    const element = findTargetElement(target)
    const nextTargetRect = element ? getTargetRect(element) : null
    setTargetRect(nextTargetRect)
    setTooltipPosition(calculateTooltipPosition(nextTargetRect, tooltipElement))
  }, [isActive, target, tooltipElement])

  useLayoutEffect(() => {
    if (!isActive) {
      setTargetRect(null)
      return
    }

    return scheduleAnimationFrame(updatePosition)
  }, [isActive, updatePosition])

  useEffect(() => {
    if (!isActive || !target) return

    let retryCount = 0
    let retryTimer = 0
    let cancelFrame = () => {}
    let hasScrolledToTarget = false

    const retryUntilStable = () => {
      if (!hasScrolledToTarget) {
        const element = findTargetElement(target)
        if (element) {
          element.scrollIntoView({
            block: "center",
            inline: "nearest",
            behavior: "smooth",
          })
          hasScrolledToTarget = true
        }
      }

      cancelFrame = scheduleAnimationFrame(updatePosition)

      if (retryCount >= MAX_LAYOUT_RETRIES) return
      retryCount += 1
      retryTimer = window.setTimeout(retryUntilStable, RETRY_INTERVAL_MS)
    }

    retryUntilStable()

    return () => {
      cancelFrame()
      window.clearTimeout(retryTimer)
    }
  }, [isActive, target, updatePosition])

  useEffect(() => {
    if (!isActive) return

    let cancelFrame = () => {}
    const scheduleUpdate = () => {
      cancelFrame()
      cancelFrame = scheduleAnimationFrame(updatePosition)
    }

    window.addEventListener("resize", scheduleUpdate)
    window.addEventListener("orientationchange", scheduleUpdate)
    window.addEventListener("scroll", scheduleUpdate, true)
    window.visualViewport?.addEventListener("resize", scheduleUpdate)
    window.visualViewport?.addEventListener("scroll", scheduleUpdate)

    const targetElement = findTargetElement(target)
    const resizeObserver = new ResizeObserver(scheduleUpdate)
    if (targetElement) {
      resizeObserver.observe(targetElement)
    }
    if (tooltipElement) {
      resizeObserver.observe(tooltipElement)
    }

    scheduleUpdate()

    return () => {
      cancelFrame()
      resizeObserver.disconnect()
      window.removeEventListener("resize", scheduleUpdate)
      window.removeEventListener("orientationchange", scheduleUpdate)
      window.removeEventListener("scroll", scheduleUpdate, true)
      window.visualViewport?.removeEventListener("resize", scheduleUpdate)
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate)
    }
  }, [isActive, target, tooltipElement, updatePosition])

  return {
    targetRect,
    tooltipPosition,
    updatePosition,
  }
}
