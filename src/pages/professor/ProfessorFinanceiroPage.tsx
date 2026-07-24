import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  CalendarDays,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { Button, Card } from "../../components/ui"
import { ConfirmModal } from "../../components/ConfirmModal"
import { useProfessorFinanceDashboard } from "../../hooks/useProfessorOperations"
import { useAlunos } from "../../hooks/useAlunos"
import {
  useCreateFinanceEntry,
  useCreateFinanceRenewal,
  useDeleteFinanceEntry,
  useDeleteFinanceRenewal,
  useFinanceEntries,
  useUpdateFinanceEntry,
  useUpdateFinanceRenewal,
} from "../../hooks/useFinance"
import { showToast } from "../../utils/toast"
import {
  type FinanceEntryCategory,
  type FinanceEntryType,
  type FinanceRenewalPlanType,
} from "../../types"

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

type ConfirmDialogState = {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  variant: "danger" | "warning" | "info"
  onConfirm: null | (() => Promise<void>)
}

const createInitialConfirmDialog = (): ConfirmDialogState => ({
  isOpen: false,
  title: "",
  message: "",
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  variant: "warning",
  onConfirm: null,
})

const formatMonth = (month: string) => {
  const [year, monthRaw] = month.split("-")
  const date = new Date(Date.UTC(Number(year), Number(monthRaw) - 1, 1))
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

const toMonthInput = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`

const toDateInput = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const toIsoDate = (dateInput: string): string =>
  new Date(`${dateInput}T12:00:00.000Z`).toISOString()

const shiftMonths = (base: Date, offset: number) =>
  new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1))

const mapCategoryLabel = (category: FinanceEntryCategory) => {
  switch (category) {
    case "CAMISA":
      return "Camisas"
    case "YOUTUBE":
      return "YouTube"
    case "PARCERIA":
      return "Parcerias"
    case "OUTRA_RECEITA":
      return "Outras receitas"
    case "CUSTO_OPERACIONAL":
      return "Custo operacional"
    case "OUTRA_DESPESA":
      return "Outras despesas"
    default:
      return category
  }
}

const mapEntryTypeLabel = (type: FinanceEntryType) =>
  type === "RECEITA" ? "Receita" : "Despesa"

export const ProfessorFinanceiroPage: React.FC = () => {
  const navigate = useNavigate()
  const now = new Date()
  const initialTo = toMonthInput(now)
  const initialFrom = toMonthInput(shiftMonths(now, -5))
  const initialDateInput = toDateInput(now)

  const [draftFrom, setDraftFrom] = useState(initialFrom)
  const [draftTo, setDraftTo] = useState(initialTo)
  const [filters, setFilters] = useState({ from: initialFrom, to: initialTo })
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(
    createInitialConfirmDialog,
  )

  const [renewalForm, setRenewalForm] = useState({
    alunoId: "",
    tipoPlano: "COMPLETO" as FinanceRenewalPlanType,
    valor: "",
    renovadoEm: initialDateInput,
    observacao: "",
  })

  const [entryForm, setEntryForm] = useState({
    tipo: "RECEITA" as FinanceEntryType,
    categoria: "CAMISA" as FinanceEntryCategory,
    valor: "",
    quantidade: "",
    descricao: "",
    dataLancamento: initialDateInput,
  })

  const { data, isLoading, error, refetch } = useProfessorFinanceDashboard(
    filters.from,
    filters.to,
  )

  const { data: alunos } = useAlunos()
  const activeAlunos = useMemo(() => (alunos || []).filter((aluno) => aluno.ativo), [alunos])

  const currentMonth = data?.currentMonth ?? toMonthInput(now)
  const { data: entries, isLoading: loadingEntries } = useFinanceEntries(currentMonth)

  const createRenewal = useCreateFinanceRenewal()
  const updateRenewal = useUpdateFinanceRenewal()
  const deleteRenewal = useDeleteFinanceRenewal()
  const createEntry = useCreateFinanceEntry()
  const updateEntry = useUpdateFinanceEntry()
  const deleteEntry = useDeleteFinanceEntry()

  const monthIsClosed = data?.currentMonthStatus === "FECHADO"

  const isMutating =
    createRenewal.isLoading ||
    updateRenewal.isLoading ||
    deleteRenewal.isLoading ||
    createEntry.isLoading ||
    updateEntry.isLoading ||
    deleteEntry.isLoading

  const maxRevenue = useMemo(() => {
    const values = data?.charts.evolucaoMensal || []
    return Math.max(1, ...values.map((item) => item.receita))
  }, [data?.charts.evolucaoMensal])

  const applyFilters = () => {
    if (!draftFrom || !draftTo || draftFrom > draftTo) return
    setFilters({ from: draftFrom, to: draftTo })
  }

  const handleCreateRenewal = async () => {
    const valor = Number(renewalForm.valor)

    if (!renewalForm.alunoId) {
      showToast.error("Selecione um aluno")
      return
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      showToast.error("Informe um valor válido")
      return
    }

    await createRenewal.mutateAsync({
      alunoId: renewalForm.alunoId,
      tipoPlano: renewalForm.tipoPlano,
      valor,
      renovadoEm: toIsoDate(renewalForm.renovadoEm),
      observacao: renewalForm.observacao.trim() || undefined,
    })

    setRenewalForm((prev) => ({ ...prev, valor: "", observacao: "" }))
  }

  const handleQuickEditRenewal = async (renewalId: string, currentValue: number) => {
    const raw = window.prompt("Novo valor da renovação", String(currentValue))
    if (!raw) return

    const value = Number(raw.replace(",", "."))
    if (!Number.isFinite(value) || value <= 0) {
      showToast.error("Valor inválido")
      return
    }

    await updateRenewal.mutateAsync({ id: renewalId, data: { valor: value } })
  }

  const handleDeleteRenewal = (renewalId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remover renovação",
      message: "Deseja remover esta renovação?",
      confirmText: "Sim, remover",
      cancelText: "Cancelar",
      variant: "danger",
      onConfirm: async () => {
        await deleteRenewal.mutateAsync(renewalId)
      },
    })
  }

  const handleCreateEntry = async () => {
    const valor = Number(entryForm.valor)
    const quantidade = entryForm.quantidade ? Number(entryForm.quantidade) : undefined

    if (!Number.isFinite(valor) || valor <= 0) {
      showToast.error("Informe um valor válido")
      return
    }

    if (entryForm.quantidade && (!Number.isInteger(quantidade) || (quantidade || 0) <= 0)) {
      showToast.error("Quantidade deve ser um inteiro positivo")
      return
    }

    await createEntry.mutateAsync({
      tipo: entryForm.tipo,
      categoria: entryForm.categoria,
      valor,
      quantidade,
      descricao: entryForm.descricao.trim() || undefined,
      dataLancamento: toIsoDate(entryForm.dataLancamento),
    })

    setEntryForm((prev) => ({ ...prev, valor: "", quantidade: "", descricao: "" }))
  }

  const handleQuickEditEntry = async (entryId: string, currentValue: number) => {
    const raw = window.prompt("Novo valor do lançamento", String(currentValue))
    if (!raw) return

    const value = Number(raw.replace(",", "."))
    if (!Number.isFinite(value) || value <= 0) {
      showToast.error("Valor inválido")
      return
    }

    await updateEntry.mutateAsync({ id: entryId, data: { valor: value } })
  }

  const handleDeleteEntry = (entryId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remover lançamento",
      message: "Deseja remover este lançamento?",
      confirmText: "Sim, remover",
      cancelText: "Cancelar",
      variant: "danger",
      onConfirm: async () => {
        await deleteEntry.mutateAsync(entryId)
      },
    })
  }

  const closeConfirmDialog = () => setConfirmDialog(createInitialConfirmDialog())

  const handleConfirmAction = async () => {
    if (!confirmDialog.onConfirm) return

    try {
      await confirmDialog.onConfirm()
    } finally {
      closeConfirmDialog()
    }
  }

  if (isLoading) {
    return <p className="py-12 text-center text-zinc-300">Carregando financeiro...</p>
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-red-950/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-300" />
          <div className="space-y-3">
            <p className="font-semibold text-white">Não foi possível carregar o financeiro</p>
            <p className="text-sm text-zinc-300">{error.message}</p>
            <Button variant="secondary" icon={RefreshCcw} onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!data) return null

  const cards = [
    {
      label: "Receita do mês",
      value: brl.format(data.totals.receitaMensalAtual),
      helper: "Renovações no mês atual",
      icon: Wallet,
    },
    {
      label: "Receita anual",
      value: brl.format(data.totals.receitaAnual),
      helper: "Ano corrente",
      icon: TrendingUp,
    },
    {
      label: "Alunos pagantes",
      value: String(data.totals.alunosPagantesPeriodo),
      helper: `${data.totals.alunosAtivos} ativo(s)`,
      icon: Users,
    },
    {
      label: "Ticket médio",
      value: brl.format(data.totals.ticketMedio),
      helper: `${data.totals.pendentesMesAtual} pendente(s) no mês`,
      icon: CalendarDays,
    },
  ]

  return (
    <div className="space-y-8" data-onboarding-target="onboarding-finance-main">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Financeiro do Professor</h1>
          <p className="mt-1 text-zinc-300">
            Receita e renovações dos seus alunos, sem dados administrativos globais.
          </p>
        </div>
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-sm text-zinc-300">
              Início
              <input
                type="month"
                value={draftFrom}
                onChange={(event) => setDraftFrom(event.target.value)}
                className="mt-1 block rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-zinc-300">
              Fim
              <input
                type="month"
                value={draftTo}
                onChange={(event) => setDraftTo(event.target.value)}
                className="mt-1 block rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>
            <Button icon={RefreshCcw} onClick={applyFilters}>
              Atualizar
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <Card className="space-y-1">
        <p className="text-sm text-zinc-300">
          Mês corrente: {formatMonth(currentMonth)} • Status:{" "}
          <span className={monthIsClosed ? "text-red-300" : "text-emerald-300"}>
            {monthIsClosed ? "FECHADO" : "ABERTO"}
          </span>
        </p>
        {monthIsClosed && (
          <p className="text-xs text-zinc-500">
            O mês foi fechado por um administrador. Criação, edição e exclusão de renovações e
            lançamentos ficam bloqueadas até a reabertura.
          </p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Registrar renovação</h2>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Aluno</label>
              <select
                value={renewalForm.alunoId}
                onChange={(event) =>
                  setRenewalForm((prev) => ({ ...prev, alunoId: event.target.value }))
                }
                disabled={monthIsClosed || isMutating}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
              >
                <option value="">Selecione um aluno</option>
                {activeAlunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.user?.nome || aluno.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Plano</label>
                <select
                  value={renewalForm.tipoPlano}
                  onChange={(event) =>
                    setRenewalForm((prev) => ({
                      ...prev,
                      tipoPlano: event.target.value as FinanceRenewalPlanType,
                    }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
                >
                  <option value="COMPLETO">Completo (Treino + Dieta)</option>
                  <option value="TREINO">Treino</option>
                  <option value="DIETA">Dieta</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-300">Valor (BRL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={renewalForm.valor}
                  onChange={(event) =>
                    setRenewalForm((prev) => ({ ...prev, valor: event.target.value }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Data</label>
              <input
                type="date"
                value={renewalForm.renovadoEm}
                onChange={(event) =>
                  setRenewalForm((prev) => ({ ...prev, renovadoEm: event.target.value }))
                }
                disabled={monthIsClosed || isMutating}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Observação</label>
              <textarea
                value={renewalForm.observacao}
                onChange={(event) =>
                  setRenewalForm((prev) => ({ ...prev, observacao: event.target.value }))
                }
                disabled={monthIsClosed || isMutating}
                rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
              />
            </div>

            <Button
              icon={Plus}
              onClick={handleCreateRenewal}
              disabled={monthIsClosed}
              isLoading={createRenewal.isLoading}
              className="w-full"
            >
              Adicionar renovação
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Lançamento manual</h2>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Tipo</label>
                <select
                  value={entryForm.tipo}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      tipo: event.target.value as FinanceEntryType,
                    }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
                >
                  <option value="RECEITA">Receita</option>
                  <option value="DESPESA">Despesa</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-300">Categoria</label>
                <select
                  value={entryForm.categoria}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      categoria: event.target.value as FinanceEntryCategory,
                    }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
                >
                  <option value="CAMISA">Camisas</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="PARCERIA">Parceria</option>
                  <option value="OUTRA_RECEITA">Outra receita</option>
                  <option value="CUSTO_OPERACIONAL">Custo operacional</option>
                  <option value="OUTRA_DESPESA">Outra despesa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Valor (BRL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryForm.valor}
                  onChange={(event) =>
                    setEntryForm((prev) => ({ ...prev, valor: event.target.value }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-300">Quantidade (opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={entryForm.quantidade}
                  onChange={(event) =>
                    setEntryForm((prev) => ({ ...prev, quantidade: event.target.value }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-300">Data</label>
                <input
                  type="date"
                  value={entryForm.dataLancamento}
                  onChange={(event) =>
                    setEntryForm((prev) => ({ ...prev, dataLancamento: event.target.value }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-300">Descrição</label>
              <textarea
                value={entryForm.descricao}
                onChange={(event) =>
                  setEntryForm((prev) => ({ ...prev, descricao: event.target.value }))
                }
                disabled={monthIsClosed || isMutating}
                rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white disabled:opacity-60"
              />
            </div>

            <Button
              icon={Plus}
              onClick={handleCreateEntry}
              disabled={monthIsClosed}
              isLoading={createEntry.isLoading}
              className="w-full"
            >
              Adicionar lançamento
            </Button>
          </div>

          <div className="pt-2">
            <h3 className="mb-3 font-semibold text-white">
              Lançamentos do mês ({formatMonth(currentMonth)})
            </h3>

            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {loadingEntries && <p className="text-sm text-zinc-400">Carregando...</p>}

              {!loadingEntries && (!entries || entries.length === 0) && (
                <p className="rounded-lg border border-dashed border-[color:var(--student-border)] p-4 text-sm text-zinc-400">
                  Nenhum lançamento seu neste mês.
                </p>
              )}

              {(entries || []).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {mapCategoryLabel(entry.categoria)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {mapEntryTypeLabel(entry.tipo)} • {brl.format(entry.valor)}
                    </p>
                    {entry.descricao && (
                      <p className="mt-1 text-xs text-zinc-500">{entry.descricao}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickEditEntry(entry.id, entry.valor)}
                      disabled={monthIsClosed || isMutating}
                      className="rounded p-2 hover:bg-zinc-800 disabled:opacity-50"
                      title="Editar valor"
                    >
                      <Pencil className="h-4 w-4 text-zinc-300" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={monthIsClosed || isMutating}
                      className="rounded p-2 hover:bg-red-950/40 disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-red-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Evolução mensal</h2>
        <div className="space-y-3">
          {data.charts.evolucaoMensal.map((item) => (
            <div key={item.month} className="grid gap-2 sm:grid-cols-[9rem_1fr_7rem] sm:items-center">
              <p className="text-sm text-zinc-300">{formatMonth(item.month)}</p>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[color:var(--student-accent)]"
                  style={{ width: `${Math.max(4, (item.receita / maxRevenue) * 100)}%` }}
                />
              </div>
              <p className="text-sm font-medium text-white">{brl.format(item.receita)}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Composição por plano</h2>
          <div className="space-y-3">
            {data.charts.composicaoPlanos.map((item) => (
              <div
                key={item.tipoPlano}
                className="flex items-center justify-between rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4"
              >
                <div>
                  <p className="font-medium text-white">{item.tipoPlano}</p>
                  <p className="text-sm text-zinc-400">{item.total} renovação(ões)</p>
                </div>
                <p className="font-semibold text-white">{brl.format(item.valor)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Pendências operacionais</h2>
          {data.pendencias.length > 0 ? (
            <div className="space-y-3">
              {data.pendencias.map((item) => (
                <div
                  key={item.alunoId}
                  className="flex flex-col gap-3 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{item.alunoNome}</p>
                    <p className="text-sm text-zinc-400">Sem renovação registrada no mês</p>
                  </div>
                  <Button
                    variant="secondary"
                    icon={Users}
                    onClick={() => navigate(item.detailPath)}
                  >
                    Abrir aluno
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[color:var(--student-border)] p-4 text-sm text-zinc-400">
              Nenhuma pendência operacional no mês atual.
            </p>
          )}
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Últimas renovações</h2>
        {data.ultimasRenovacoes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-zinc-400">
                <tr className="border-b border-[color:var(--student-border)]">
                  <th className="py-3 pr-4">Aluno</th>
                  <th className="py-3 pr-4">Plano</th>
                  <th className="py-3 pr-4">Mês</th>
                  <th className="py-3 pr-4">Valor</th>
                  <th className="py-3 pr-4">Data</th>
                  <th className="py-3 pr-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.ultimasRenovacoes.map((item) => (
                  <tr key={item.id} className="border-b border-[color:var(--student-border)] text-zinc-200">
                    <td className="py-3 pr-4">{item.alunoNome}</td>
                    <td className="py-3 pr-4">{item.tipoPlano}</td>
                    <td className="py-3 pr-4">{formatMonth(item.month)}</td>
                    <td className="py-3 pr-4">{brl.format(item.valor)}</td>
                    <td className="py-3 pr-4">
                      {new Date(item.renovadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickEditRenewal(item.id, item.valor)}
                          disabled={monthIsClosed || isMutating}
                          className="rounded p-2 hover:bg-zinc-800 disabled:opacity-50"
                          title="Editar valor"
                        >
                          <Pencil className="h-4 w-4 text-zinc-300" />
                        </button>
                        <button
                          onClick={() => handleDeleteRenewal(item.id)}
                          disabled={monthIsClosed || isMutating}
                          className="rounded p-2 hover:bg-red-950/40 disabled:opacity-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[color:var(--student-border)] p-4 text-sm text-zinc-400">
            Nenhuma renovação encontrada no período.
          </p>
        )}
      </Card>

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
        isLoading={deleteRenewal.isLoading || deleteEntry.isLoading}
      />
    </div>
  )
}

const MetricCard: React.FC<{
  label: string
  value: string
  helper: string
  icon: React.ElementType
}> = ({ label, value, helper, icon: Icon }) => (
  <Card className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-[color:var(--student-text-muted)]">{label}</p>
      <Icon className="h-5 w-5 text-[color:var(--student-text-soft)]" />
    </div>
    <p className="text-2xl font-semibold text-white">{value}</p>
    <p className="text-sm text-[color:var(--student-text-soft)]">{helper}</p>
  </Card>
)
