const ANALYTICS_CONSENT_KEY = "gforce_analytics_consent"

type StoredAnalyticsConsent = {
  accepted: boolean
  version: string
  decidedAt: string
  purpose: "lead_analytics"
}

export const PRIVACY_CONSENT_VERSION = "2026-06-07"

export function getAnalyticsConsent(): boolean | null {
  const raw = localStorage.getItem(ANALYTICS_CONSENT_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredAnalyticsConsent
    if (
      parsed.version !== PRIVACY_CONSENT_VERSION ||
      parsed.purpose !== "lead_analytics"
    ) {
      return null
    }
    return parsed.accepted
  } catch {
    localStorage.removeItem(ANALYTICS_CONSENT_KEY)
    return null
  }
}

export function setAnalyticsConsent(accepted: boolean) {
  const payload: StoredAnalyticsConsent = {
    accepted,
    version: PRIVACY_CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    purpose: "lead_analytics",
  }

  localStorage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify(payload))
}
