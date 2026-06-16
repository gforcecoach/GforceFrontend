import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Card } from "../components/ui"
import { useAuth } from "../hooks/useAuth"
import { legalApi, authApi } from "../services/api"
import { type LegalDocumentVersion } from "../types"
import { showToast } from "../utils/toast"

export const LegalAcceptancePage = () => {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [documents, setDocuments] = useState<LegalDocumentVersion[]>([])
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    legalApi.currentDocuments().then((response) => {
      setDocuments(response.documents)
    })
  }, [])

  const acceptedDocuments = useMemo(
    () =>
      documents.map((document) => ({
        documentType: document.documentType,
        version: document.version,
      })),
    [documents],
  )

  const submit = async () => {
    if (!accepted || acceptedDocuments.length < 2) {
      showToast.error("Aceite os documentos legais atuais para continuar")
      return
    }

    setLoading(true)
    try {
      await legalApi.accept(acceptedDocuments)
      const user = await authApi.me()
      updateUser({ ...user, requiresLegalAcceptance: false })
      showToast.success("Aceite registrado")
      navigate("/", { replace: true })
    } catch {
      showToast.error("Erro ao registrar aceite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center">
        <Card>
          <h1 className="text-2xl font-bold">Atualização de documentos legais</h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            Para continuar usando a plataforma, leia e aceite a Política de
            Privacidade e os Termos de Uso atuais. Consentimentos opcionais
            podem ser gerenciados depois na área de privacidade.
          </p>
          <div className="mt-5 space-y-3 rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm">
            {documents.map((document) => (
              <p key={document.id}>
                {document.title}: versão {document.version}
              </p>
            ))}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>Li e aceito os documentos legais vigentes.</span>
            </label>
          </div>
          <Button
            onClick={submit}
            disabled={loading}
            isLoading={loading}
            className="mt-5 w-full"
          >
            Registrar aceite e continuar
          </Button>
        </Card>
      </div>
    </div>
  )
}
