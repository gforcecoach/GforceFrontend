import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
} from "../utils/privacyConsent"

export const AnalyticsConsent = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(getAnalyticsConsent() === null)
  }, [])

  const choose = (accepted: boolean) => {
    setAnalyticsConsent(accepted)
    setVisible(false)
    window.dispatchEvent(new Event("privacy:analytics-consent-changed"))
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-3xl rounded-2xl border border-[color:var(--public-border-strong)] bg-[color:var(--public-surface-strong)] p-4 text-[color:var(--public-text)] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Preferência de analytics</p>
          <p className="text-sm leading-6 text-[color:var(--public-text-soft)]">
            Usamos analytics próprio de leads com fingerprint pseudonimizado
            apenas se você aceitar. Recusar não impede cadastro ou uso da
            plataforma. Veja a{" "}
            <Link to="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="rounded-full border border-[color:var(--public-border)] px-4 py-2 text-sm font-medium text-[color:var(--public-text-soft)]"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="rounded-full bg-[color:var(--public-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--public-accent-contrast)]"
          >
            Aceitar analytics
          </button>
        </div>
      </div>
    </div>
  )
}
