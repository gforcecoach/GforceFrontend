import { useEffect, useState } from "react"
import { Button, Card } from "../components/ui"
import { privacyApi } from "../services/api"
import {
  type DataSubjectRequest,
  type DataSubjectRequestType,
  type PrivacyPreferences,
} from "../types"
import { showToast } from "../utils/toast"

const requestLabels: Record<DataSubjectRequestType, string> = {
  EXPORT: "Exportação",
  DELETE: "Exclusão",
  CORRECTION: "Correção",
  CONSENT_REVOKE: "Revogação",
  OTHER: "Outra",
}

export const PrivacySettingsPage = () => {
  const [preferences, setPreferences] = useState<PrivacyPreferences | null>(null)
  const [requests, setRequests] = useState<DataSubjectRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [prefs, requestList] = await Promise.all([
      privacyApi.getPreferences(),
      privacyApi.listRequests(),
    ])
    setPreferences(prefs)
    setRequests(requestList)
  }

  useEffect(() => {
    load()
      .catch(() => showToast.error("Erro ao carregar dados de privacidade"))
      .finally(() => setLoading(false))
  }, [])

  const updatePreference = async (key: keyof PrivacyPreferences, value: boolean) => {
    const updated = await privacyApi.updatePreferences({ [key]: value })
    setPreferences(updated)
    showToast.success("Preferências atualizadas")
  }

  const createRequest = async (type: DataSubjectRequestType) => {
    const created = await privacyApi.createRequest(type)
    setRequests((current) => [created, ...current])
    showToast.success("Solicitação registrada")
  }

  const exportData = async () => {
    const data = await privacyApi.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gforce-export-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <p className="text-[color:var(--student-text-muted)]">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-bold text-white">Privacidade e LGPD</h1>
        <p className="mt-2 text-sm text-gray-300">
          Gerencie consentimentos opcionais e solicite seus direitos como
          titular de dados.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Preferências</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {preferences &&
            ([
              ["analyticsConsent", "Analytics"],
              ["marketingConsent", "Marketing"],
              ["emailConsent", "E-mail operacional"],
              ["whatsappConsent", "WhatsApp operacional"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 text-gray-200">
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={(event) =>
                    updatePreference(key, event.target.checked).catch(() =>
                      showToast.error("Erro ao atualizar preferência"),
                    )
                  }
                />
                {label}
              </label>
            ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Solicitações</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={exportData}>Baixar exportação</Button>
          <Button variant="secondary" onClick={() => createRequest("EXPORT")}>
            Solicitar exportação
          </Button>
          <Button variant="secondary" onClick={() => createRequest("DELETE")}>
            Solicitar exclusão
          </Button>
          <Button variant="secondary" onClick={() => createRequest("CORRECTION")}>
            Solicitar correção
          </Button>
        </div>
        <div className="mt-5 space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-gray-200"
            >
              <p className="font-medium">
                {requestLabels[request.type]} - {request.status}
              </p>
              <p className="text-gray-400">
                Criada em{" "}
                {new Date(request.requestedAt).toLocaleString("pt-BR")}
              </p>
              {request.response && <p className="mt-2">{request.response}</p>}
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-sm text-gray-400">Nenhuma solicitação registrada.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
