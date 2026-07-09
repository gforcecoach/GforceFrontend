import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { Badge, Button, Card, Select, Textarea } from "../../components/ui"
import { privacyApi } from "../../services/api"
import type {
  AdminDataSubjectRequest,
  DataSubjectRequestStatus,
  DataSubjectRequestType,
} from "../../types"
import { showToast } from "../../utils/toast"

const requestTypeLabels: Record<DataSubjectRequestType, string> = {
  EXPORT: "Exportação",
  DELETE: "Exclusão",
  CORRECTION: "Correção",
  CONSENT_REVOKE: "Revogação de consentimento",
  OTHER: "Outra",
}

const statusLabels: Record<DataSubjectRequestStatus, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  REJECTED: "Rejeitada",
  FAILED: "Falhou",
}

const terminalStatuses: DataSubjectRequestStatus[] = [
  "COMPLETED",
  "REJECTED",
  "FAILED",
]

const processStatusOptions: DataSubjectRequestStatus[] = [
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "FAILED",
]

const typeOptions: Array<DataSubjectRequestType | "ALL"> = [
  "ALL",
  "EXPORT",
  "DELETE",
  "CORRECTION",
  "CONSENT_REVOKE",
  "OTHER",
]

const statusOptions: Array<DataSubjectRequestStatus | "ALL"> = [
  "ALL",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "FAILED",
]

interface RequestDraft {
  status: DataSubjectRequestStatus
  response: string
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

const getStatusVariant = (status: DataSubjectRequestStatus) => {
  if (status === "COMPLETED") return "success"
  if (status === "REJECTED" || status === "FAILED") return "danger"
  if (status === "OPEN") return "warning"
  return "default"
}

export const PrivacyRequestsPage: React.FC = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<AdminDataSubjectRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, RequestDraft>>({})
  const [statusFilter, setStatusFilter] = useState<
    DataSubjectRequestStatus | "ALL"
  >("ALL")
  const [typeFilter, setTypeFilter] = useState<DataSubjectRequestType | "ALL">(
    "ALL",
  )

  const load = async () => {
    setLoading(true)
    try {
      const data = await privacyApi.listAdminRequests()
      setRequests(data)
    } catch (error) {
      showToast.error(
        error instanceof Error
          ? error.message
          : "Erro ao carregar solicitações LGPD",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "ALL" || request.status === statusFilter
      const matchesType = typeFilter === "ALL" || request.type === typeFilter
      return matchesStatus && matchesType
    })
  }, [requests, statusFilter, typeFilter])

  const openCount = requests.filter((request) => request.status === "OPEN").length
  const inProgressCount = requests.filter(
    (request) => request.status === "IN_PROGRESS",
  ).length
  const terminalCount = requests.filter((request) =>
    terminalStatuses.includes(request.status),
  ).length

  const getDraft = (request: AdminDataSubjectRequest): RequestDraft =>
    drafts[request.id] ?? {
      status: request.status === "OPEN" ? "IN_PROGRESS" : request.status,
      response: request.response ?? "",
    }

  const updateDraft = (
    request: AdminDataSubjectRequest,
    patch: Partial<RequestDraft>,
  ) => {
    const current = getDraft(request)
    setDrafts((prev) => ({
      ...prev,
      [request.id]: {
        ...current,
        ...patch,
      },
    }))
  }

  const handleProcess = async (request: AdminDataSubjectRequest) => {
    const draft = getDraft(request)
    const response = draft.response.trim()

    if (request.type === "DELETE" && draft.status === "COMPLETED") {
      const confirmed = window.confirm(
        "Concluir esta solicitação de exclusão pode anonimizar e bloquear a conta do titular. Deseja continuar?",
      )
      if (!confirmed) return
    }

    setProcessingId(request.id)
    try {
      const updated = await privacyApi.processAdminRequest(request.id, {
        status: draft.status,
        response: response || undefined,
      })

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? {
                ...item,
                ...updated,
                user: item.user,
              }
            : item,
        ),
      )
      setDrafts((current) => {
        const next = { ...current }
        delete next[request.id]
        return next
      })
      showToast.success("Solicitação atualizada")
    } catch (error) {
      showToast.error(
        error instanceof Error
          ? error.message
          : "Erro ao processar solicitação",
      )
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="shrink-0 rounded-lg p-2 transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            aria-label="Voltar ao dashboard"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">
              Solicitações LGPD
            </h1>
            <p className="mt-1 text-zinc-400">
              Acompanhe e processe pedidos de titulares de dados.
            </p>
          </div>
        </div>

        <Button
          icon={RefreshCw}
          variant="secondary"
          onClick={() => void load()}
          disabled={loading}
        >
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-amber-950/30 border-amber-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100">Abertas</p>
              <p className="text-3xl font-bold text-white">{openCount}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-200" />
          </div>
        </Card>
        <Card className="bg-blue-950/30 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Em andamento</p>
              <p className="text-3xl font-bold text-white">{inProgressCount}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-blue-200" />
          </div>
        </Card>
        <Card className="bg-emerald-950/30 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-100">Finalizadas</p>
              <p className="text-3xl font-bold text-white">{terminalCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-200" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-zinc-100">
            <Filter className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Fila de solicitações</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[520px]">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as DataSubjectRequestStatus | "ALL",
                )
              }
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "Todos" : statusLabels[status]}
                </option>
              ))}
            </Select>
            <Select
              label="Tipo"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as DataSubjectRequestType | "ALL")
              }
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === "ALL" ? "Todos" : requestTypeLabels[type]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-zinc-300">
            Carregando solicitações...
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const draft = getDraft(request)
              const isProcessing = processingId === request.id

              return (
                <div
                  key={request.id}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-zinc-100">
                          {requestTypeLabels[request.type]}
                        </h3>
                        <Badge variant={getStatusVariant(request.status)}>
                          {statusLabels[request.status]}
                        </Badge>
                      </div>

                      <div className="text-sm text-zinc-300">
                        <p>
                          <span className="text-zinc-500">Titular:</span>{" "}
                          {request.user.nome} ({request.user.email})
                        </p>
                        <p>
                          <span className="text-zinc-500">Perfil:</span>{" "}
                          {request.user.role}
                          {request.user.blockedAt ? " · conta bloqueada" : ""}
                        </p>
                        <p>
                          <span className="text-zinc-500">Solicitada em:</span>{" "}
                          {formatDateTime(request.requestedAt)}
                        </p>
                        <p>
                          <span className="text-zinc-500">Processada em:</span>{" "}
                          {formatDateTime(request.processedAt)}
                        </p>
                      </div>

                      {request.description && (
                        <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
                          {request.description}
                        </p>
                      )}

                      {request.response && (
                        <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
                          <span className="font-medium text-zinc-100">
                            Resposta registrada:
                          </span>{" "}
                          {request.response}
                        </p>
                      )}
                    </div>

                    <div className="w-full shrink-0 space-y-3 lg:w-[360px]">
                      <Select
                        label="Novo status"
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft(request, {
                            status: event.target.value as DataSubjectRequestStatus,
                          })
                        }
                        disabled={isProcessing}
                      >
                        {processStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </Select>

                      <Textarea
                        label="Resposta ao titular (opcional)"
                        rows={4}
                        value={draft.response}
                        onChange={(event) =>
                          updateDraft(request, { response: event.target.value })
                        }
                        maxLength={2000}
                        disabled={isProcessing}
                      />

                      {request.type === "DELETE" && draft.status === "COMPLETED" && (
                        <p className="rounded-lg border border-[color:var(--app-warning-border)] bg-[color:var(--student-warning-surface)] p-3 text-sm text-[color:var(--student-warning)]">
                          Concluir exclusão dispara o processo operacional de
                          anonimização e bloqueio da conta.
                        </p>
                      )}

                      <Button
                        onClick={() => void handleProcess(request)}
                        isLoading={isProcessing}
                        disabled={isProcessing}
                        className="w-full justify-center"
                      >
                        Salvar processamento
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900 py-10 text-center text-zinc-400">
            Nenhuma solicitação encontrada para os filtros selecionados.
          </div>
        )}
      </Card>
    </div>
  )
}
