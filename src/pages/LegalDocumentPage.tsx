import { useEffect, useMemo, useState } from "react"
import { PublicSiteLayout } from "../modules/public-site/components/PublicSiteLayout"
import { legalApi } from "../services/api"
import { type LegalDocumentType, type LegalDocumentsResponse } from "../types"

interface LegalDocumentPageProps {
  documentType: LegalDocumentType
}

export const LegalDocumentPage = ({ documentType }: LegalDocumentPageProps) => {
  const [data, setData] = useState<LegalDocumentsResponse | null>(null)

  useEffect(() => {
    legalApi.currentDocuments().then(setData).catch(() => setData(null))
  }, [])

  const document = useMemo(
    () => data?.documents.find((item) => item.documentType === documentType),
    [data, documentType],
  )

  const title =
    documentType === "PRIVACY_POLICY"
      ? "Política de Privacidade"
      : "Termos de Uso"

  return (
    <PublicSiteLayout>
      <section className="min-h-screen px-5 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[color:var(--public-border)] bg-[color:var(--public-surface)] p-6 text-[color:var(--public-text)] shadow-[var(--public-shadow)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--public-accent)]">
            Documentos legais
          </p>
          <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
          {document ? (
            <>
              <p className="mt-3 text-sm text-[color:var(--public-text-soft)]">
                Versão {document.version}, publicada em{" "}
                {new Date(document.publishedAt).toLocaleDateString("pt-BR")}.
              </p>
              {data && (
                <div className="mt-6 rounded-2xl border border-[color:var(--public-border)] bg-[color:var(--public-bg-alt)] p-4 text-sm leading-6 text-[color:var(--public-text-soft)]">
                  <p>Controlador: {data.controller.name}</p>
                  <p>
                    {data.controller.documentType}: {data.controller.document}
                  </p>
                  <p>Endereço: {data.controller.address}</p>
                  <p>Contato de privacidade: {data.controller.privacyContact}</p>
                </div>
              )}
              <div className="mt-8 whitespace-pre-line text-sm leading-7 text-[color:var(--public-text-soft)]">
                {document.content}
              </div>
            </>
          ) : (
            <p className="mt-6 text-[color:var(--public-text-soft)]">
              Carregando documento...
            </p>
          )}
        </div>
      </section>
    </PublicSiteLayout>
  )
}
