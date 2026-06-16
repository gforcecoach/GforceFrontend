import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Lock,
  Pencil,
  Plus,
  Repeat,
  Shirt,
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlock,
  Users,
} from "lucide-react"
import { ConfirmModal } from "../../components/ConfirmModal"
import { Button, Card } from "../../components/ui"
import {
  useCloseFinanceMonth,
  useCreateFinanceEntry,
  useCreateFinanceRenewal,
  useDeleteFinanceEntry,
  useDeleteFinanceRenewal,
  useFinanceDashboard,
  useFinanceEntries,
  useFinanceRenewals,
  useReopenFinanceMonth,
  useUpdateFinanceEntry,
  useUpdateFinanceRenewal,
} from "../../hooks/useFinance"
import { useAlunos } from "../../hooks/useAlunos"
import { showToast } from "../../utils/toast"
import {
  type FinanceEntryCategory,
  type FinanceEntryType,
  type FinanceRenewalPlanType,
} from "../../types"

type FinanceViewMode = "METRICAS" | "GRAFICOS"
type EntryFilter = "ALL" | FinanceEntryType
type ConfirmDialogState = {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  variant: "danger" | "warning" | "info"
  onConfirm: null | (() => Promise<void>)
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const createInitialConfirmDialog = (): ConfirmDialogState => ({
  isOpen: false,
  title: "",
  message: "",
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  variant: "warning",
  onConfirm: null,
})

const formatMonthLabel = (month: string) => {
  const [yearRaw, monthRaw] = month.split("-")
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1
  const date = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0))
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

const formatDateLabel = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const toMonthInput = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

const toDateInput = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const toIsoDate = (dateInput: string): string => {
  return new Date(`${dateInput}T12:00:00.000Z`).toISOString()
}

const shiftMonths = (base: Date, offset: number): Date => {
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1, 0, 0, 0, 0),
  )
}

const mapCategoryLabel = (category: FinanceEntryCategory) => {
  switch (category) {
    case "CAMISA":
      return "Camisas"
    case "YOUTUBE":
      return "YouTube"
    case "PARCERIA":
      return "Parcerias"
    case "OUTRA_RECEITA":
      return "Outras Receitas"
    case "CUSTO_OPERACIONAL":
      return "Custo Operacional"
    case "OUTRA_DESPESA":
      return "Outras Despesas"
    default:
      return category
  }
}

const mapPlanLabel = (plan: FinanceRenewalPlanType) => {
  switch (plan) {
    case "COMPLETO":
      return "Completo"
    case "TREINO":
      return "Treino"
    case "DIETA":
      return "Dieta"
    default:
      return plan
  }
}

const mapEntryTypeLabel = (type: FinanceEntryType) =>
  type === "RECEITA" ? "Receita" : "Despesa"

export const FinanceiroPage: React.FC = () => {
  const navigate = useNavigate()

  const now = new Date()
  const initialToMonth = toMonthInput(now)
  const initialFromMonth = toMonthInput(shiftMonths(now, -5))
  const initialDateInput = toDateInput(now)

  const [viewMode, setViewMode] = useState<FinanceViewMode>("METRICAS")
  const [draftFrom, setDraftFrom] = useState(initialFromMonth)
  const [draftTo, setDraftTo] = useState(initialToMonth)
  const [filters, setFilters] = useState({
    from: initialFromMonth,
    to: initialToMonth,
  })

  const [activeMonth, setActiveMonth] = useState(initialToMonth)
  const [entryFilter, setEntryFilter] = useState<EntryFilter>("ALL")
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

  const { data: alunos } = useAlunos()
  const {
    data: dashboard,
    isLoading: loadingDashboard,
    error: dashboardError,
    refetch,
  } = useFinanceDashboard(filters.from, filters.to)
  const { data: renewals, isLoading: loadingRenewals } =
    useFinanceRenewals(activeMonth)
  const { data: entries, isLoading: loadingEntries } = useFinanceEntries(
    activeMonth,
    entryFilter === "ALL" ? undefined : entryFilter,
  )

  const createRenewal = useCreateFinanceRenewal()
  const updateRenewal = useUpdateFinanceRenewal()
  const deleteRenewal = useDeleteFinanceRenewal()
  const createEntry = useCreateFinanceEntry()
  const updateEntry = useUpdateFinanceEntry()
  const deleteEntry = useDeleteFinanceEntry()
  const closeMonth = useCloseFinanceMonth()
  const reopenMonth = useReopenFinanceMonth()

  const monthOptions = useMemo(() => {
    const monthsFromDashboard = dashboard?.months?.map((item) => item.month) || []

    if (monthsFromDashboard.length > 0) {
      return monthsFromDashboard
    }

    if (!filters.from || !filters.to) {
      return [initialToMonth]
    }

    const start = new Date(`${filters.from}-01T00:00:00.000Z`)
    const end = new Date(`${filters.to}-01T00:00:00.000Z`)

    if (start.getTime() > end.getTime()) {
      return [initialToMonth]
    }

    const values: string[] = []
    let cursor = start
    while (cursor.getTime() <= end.getTime()) {
      values.push(toMonthInput(cursor))
      cursor = shiftMonths(cursor, 1)
    }

    return values
  }, [dashboard?.months, filters.from, filters.to, initialToMonth])

  const currentMonthSummary = useMemo(
    () => dashboard?.months.find((item) => item.month === activeMonth),
    [dashboard?.months, activeMonth],
  )

  const monthIsClosed = currentMonthSummary?.status === "FECHADO"

  const maxBarValue = useMemo(() => {
    if (!dashboard?.charts.receitasVsDespesas?.length) return 1

    return Math.max(
      1,
      ...dashboard.charts.receitasVsDespesas.map((item) =>
        Math.max(item.receitas, item.despesas),
      ),
    )
  }, [dashboard?.charts.receitasVsDespesas])

  const saldoSeries = useMemo(() => {
    const values = dashboard?.charts.saldoAcumulado || []
    if (values.length === 0) return ""

    const width = 620
    const height = 180
    const max = Math.max(...values.map((item) => item.saldoAcumulado), 1)
    const min = Math.min(...values.map((item) => item.saldoAcumulado), 0)
    const range = max - min || 1

    return values
      .map((item, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * width
        const y = height - ((item.saldoAcumulado - min) / range) * height
        return `${x},${y}`
      })
      .join(" ")
  }, [dashboard?.charts.saldoAcumulado])

  const handleApplyFilters = () => {
    if (!draftFrom || !draftTo) {
      showToast.error("Selecione o período completo")
      return
    }

    if (draftFrom > draftTo) {
      showToast.error("Período inválido: início maior que o fim")
      return
    }

    setFilters({ from: draftFrom, to: draftTo })

    if (activeMonth < draftFrom || activeMonth > draftTo) {
      setActiveMonth(draftTo)
    }
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

    setRenewalForm((prev) => ({
      ...prev,
      valor: "",
      observacao: "",
    }))
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

    setEntryForm((prev) => ({
      ...prev,
      valor: "",
      quantidade: "",
      descricao: "",
    }))
  }

  const handleQuickEditRenewal = async (renewalId: string, currentValue: number) => {
    const raw = window.prompt("Novo valor da renovação", String(currentValue))
    if (!raw) return

    const value = Number(raw.replace(",", "."))
    if (!Number.isFinite(value) || value <= 0) {
      showToast.error("Valor inválido")
      return
    }

    await updateRenewal.mutateAsync({
      id: renewalId,
      data: { valor: value },
    })
  }

  const handleQuickEditEntry = async (entryId: string, currentValue: number) => {
    const raw = window.prompt("Novo valor do lançamento", String(currentValue))
    if (!raw) return

    const value = Number(raw.replace(",", "."))
    if (!Number.isFinite(value) || value <= 0) {
      showToast.error("Valor inválido")
      return
    }

    await updateEntry.mutateAsync({
      id: entryId,
      data: { valor: value },
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog(createInitialConfirmDialog())
  }

  const handleConfirmAction = async () => {
    if (!confirmDialog.onConfirm) {
      return
    }

    try {
      await confirmDialog.onConfirm()
    } finally {
      closeConfirmDialog()
    }
  }

  const handleDeleteRenewal = (renewalId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remover Renovação",
      message: "Deseja remover esta renovação?",
      confirmText: "Sim, Remover",
      cancelText: "Cancelar",
      variant: "danger",
      onConfirm: async () => {
        await deleteRenewal.mutateAsync(renewalId)
      },
    })
  }

  const handleDeleteEntry = (entryId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remover Lançamento",
      message: "Deseja remover este lançamento?",
      confirmText: "Sim, Remover",
      cancelText: "Cancelar",
      variant: "danger",
      onConfirm: async () => {
        await deleteEntry.mutateAsync(entryId)
      },
    })
  }

  const handleCloseMonth = () => {
    const monthLabel = formatMonthLabel(activeMonth)

    setConfirmDialog({
      isOpen: true,
      title: "Fechar Mês",
      message: `Deseja fechar o mês ${monthLabel}?\n\nCriação, edição e exclusão de registros ficarão bloqueadas até reabrir.`,
      confirmText: "Sim, Fechar Mês",
      cancelText: "Cancelar",
      variant: "warning",
      onConfirm: async () => {
        await closeMonth.mutateAsync(activeMonth)
      },
    })
  }

  const handleReopenMonth = () => {
    const monthLabel = formatMonthLabel(activeMonth)

    setConfirmDialog({
      isOpen: true,
      title: "Reabrir Mês",
      message: `Deseja reabrir o mês ${monthLabel}?\n\nRenovações e lançamentos voltarão a poder ser alterados.`,
      confirmText: "Sim, Reabrir Mês",
      cancelText: "Cancelar",
      variant: "info",
      onConfirm: async () => {
        await reopenMonth.mutateAsync(activeMonth)
      },
    })
  }

  const isMutating =
    createRenewal.isLoading ||
    updateRenewal.isLoading ||
    deleteRenewal.isLoading ||
    createEntry.isLoading ||
    updateEntry.isLoading ||
    deleteEntry.isLoading ||
    closeMonth.isLoading ||
    reopenMonth.isLoading

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Controle Financeiro</h1>
            <p className="text-zinc-400">Visão mensal de caixa, projeção e indicadores</p>
          </div>
        </div>

        <div className="inline-flex bg-zinc-900 border border-zinc-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode("METRICAS")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "METRICAS"
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            Métricas
          </button>
          <button
            onClick={() => setViewMode("GRAFICOS")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "GRAFICOS"
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            Gráficos
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">De</label>
            <input
              type="month"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Até</label>
            <input
              type="month"
              value={draftTo}
              onChange={(event) => setDraftTo(event.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Mês de Gestão</label>
            <select
              value={activeMonth}
              onChange={(event) => setActiveMonth(event.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} icon={CalendarDays} className="flex-1">
              Aplicar
            </Button>
            <Button variant="secondary" onClick={() => refetch()} icon={Repeat}>
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      {dashboardError && (
        <Card className="border-red-500/40 bg-red-950/30">
          <p className="text-[color:var(--app-danger)]">Erro ao carregar dashboard financeiro: {dashboardError.message}</p>
        </Card>
      )}

      {loadingDashboard ? (
        <Card>
          <p className="text-zinc-300">Carregando dados financeiros...</p>
        </Card>
      ) : (
        <>
          {viewMode === "METRICAS" && dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card className="border-emerald-500/40 bg-emerald-900/10">
                  <p className="text-sm text-zinc-300">Receitas</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    {brl.format(dashboard.totals.receitas)}
                  </p>
                </Card>

                <Card className="border-red-500/40 bg-red-900/10">
                  <p className="text-sm text-zinc-300">Despesas</p>
                  <p className="text-2xl font-bold text-red-300">
                    {brl.format(dashboard.totals.despesas)}
                  </p>
                </Card>

                <Card
                  className={`${
                    dashboard.totals.saldo >= 0
                      ? "border-blue-500/40 bg-blue-900/10"
                      : "border-amber-500/40 bg-amber-900/10"
                  }`}
                >
                  <p className="text-sm text-zinc-300">Saldo</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {brl.format(dashboard.totals.saldo)}
                  </p>
                </Card>

                <Card className="border-indigo-500/40 bg-indigo-900/10">
                  <p className="text-sm text-zinc-300">Renovações</p>
                  <p className="text-2xl font-bold text-indigo-300">
                    {dashboard.totals.renewals.total}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    C: {dashboard.totals.renewals.completo} | T: {dashboard.totals.renewals.treino} |
                    D: {dashboard.totals.renewals.dieta}
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Camisas Vendidas</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {dashboard.totals.camisasVendidas}
                      </p>
                    </div>
                    <Shirt className="h-5 w-5 text-zinc-400" />
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Alunos Ativos</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {dashboard.systemMetrics.alunos.ativos}
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-emerald-300" />
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Alunos Inativos</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {dashboard.systemMetrics.alunos.inativos}
                      </p>
                    </div>
                    <TrendingDown className="h-5 w-5 text-red-300" />
                  </div>
                </Card>

                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Total Alunos</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {dashboard.systemMetrics.alunos.total}
                      </p>
                    </div>
                    <Users className="h-5 w-5 text-blue-300" />
                  </div>
                </Card>
              </div>

              <Card>
                <h2 className="text-lg font-semibold text-zinc-100 mb-3">
                  Previsão (média móvel dos últimos meses fechados)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
                    <p className="text-sm text-zinc-400">Próximos 3 meses</p>
                    <p className="text-xl font-bold text-zinc-100">
                      {brl.format(dashboard.projections.months3.saldo)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Receita: {brl.format(dashboard.projections.months3.receitas)} | Despesa:{" "}
                      {brl.format(dashboard.projections.months3.despesas)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
                    <p className="text-sm text-zinc-400">Próximos 6 meses</p>
                    <p className="text-xl font-bold text-zinc-100">
                      {brl.format(dashboard.projections.months6.saldo)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Receita: {brl.format(dashboard.projections.months6.receitas)} | Despesa:{" "}
                      {brl.format(dashboard.projections.months6.despesas)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  Base: {dashboard.projections.baseMonths.join(", ") || "sem meses fechados"}
                </p>
              </Card>
            </div>
          )}

          {viewMode === "GRAFICOS" && dashboard && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">
                  Receitas vs Despesas por Mês
                </h2>
                <div className="space-y-3">
                  {dashboard.charts.receitasVsDespesas.map((item) => (
                    <div key={item.month}>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>{formatMonthLabel(item.month)}</span>
                        <span>
                          {brl.format(item.receitas)} / {brl.format(item.despesas)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 rounded bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(item.receitas / maxBarValue) * 100}%` }}
                          />
                        </div>
                        <div className="h-2 rounded bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${(item.despesas / maxBarValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">Linha de Saldo Acumulado</h2>
                <div className="overflow-x-auto">
                  <div className="min-w-[680px]">
                    <svg viewBox="0 0 620 180" className="w-full h-48">
                      <polyline
                        fill="none"
                        stroke="var(--app-chart-primary)"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={saldoSeries}
                      />
                    </svg>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-zinc-500 mt-2">
                      {dashboard.charts.saldoAcumulado.map((item) => (
                        <div key={item.month} className="flex justify-between">
                          <span>{formatMonthLabel(item.month)}</span>
                          <span>{brl.format(item.saldoAcumulado)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">Composição de Receitas</h2>
                <div className="space-y-2">
                  {dashboard.charts.composicaoReceitas.map((item) => {
                    const total = dashboard.totals.receitas || 1
                    const width = (item.valor / total) * 100

                    return (
                      <div key={item.categoria}>
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                          <span>{mapCategoryLabel(item.categoria)}</span>
                          <span>{brl.format(item.valor)}</span>
                        </div>
                        <div className="h-2 rounded bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${Math.max(width, 2)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}

                  {dashboard.charts.composicaoReceitas.length === 0 && (
                    <p className="text-sm text-zinc-500">Sem receitas no período.</p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Fechamento Mensal</h2>
            <p className="text-sm text-zinc-400">
              Mês ativo: {formatMonthLabel(activeMonth)} • Status:{" "}
              <span className={monthIsClosed ? "text-red-300" : "text-emerald-300"}>
                {monthIsClosed ? "FECHADO" : "ABERTO"}
              </span>
            </p>
          </div>

          {monthIsClosed ? (
            <Button
              variant="secondary"
              icon={Unlock}
              onClick={handleReopenMonth}
              isLoading={reopenMonth.isLoading}
            >
              Reabrir Mês
            </Button>
          ) : (
            <Button
              variant="danger"
              icon={Lock}
              onClick={handleCloseMonth}
              isLoading={closeMonth.isLoading}
            >
              Fechar Mês
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Registrar Renovação</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Aluno</label>
              <select
                value={renewalForm.alunoId}
                onChange={(event) =>
                  setRenewalForm((prev) => ({ ...prev, alunoId: event.target.value }))
                }
                disabled={monthIsClosed || isMutating}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
              >
                <option value="">Selecione um aluno</option>
                {(alunos || []).map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.user?.nome || aluno.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Plano</label>
                <select
                  value={renewalForm.tipoPlano}
                  onChange={(event) =>
                    setRenewalForm((prev) => ({
                      ...prev,
                      tipoPlano: event.target.value as FinanceRenewalPlanType,
                    }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
                >
                  <option value="COMPLETO">Completo (Treino + Dieta)</option>
                  <option value="TREINO">Treino</option>
                  <option value="DIETA">Dieta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">Valor (BRL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={renewalForm.valor}
                  onChange={(event) =>
                    setRenewalForm((prev) => ({ ...prev, valor: event.target.value }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Data</label>
              <input
                type="date"
                value={renewalForm.renovadoEm}
                onChange={(event) =>
                  setRenewalForm((prev) => ({ ...prev, renovadoEm: event.target.value }))
                }
                disabled={monthIsClosed || isMutating}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Observação</label>
              <textarea
                value={renewalForm.observacao}
                onChange={(event) =>
                  setRenewalForm((prev) => ({ ...prev, observacao: event.target.value }))
                }
                disabled={monthIsClosed || isMutating}
                rows={2}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
              />
            </div>

            <Button
              icon={Plus}
              onClick={handleCreateRenewal}
              disabled={monthIsClosed}
              isLoading={createRenewal.isLoading}
              className="w-full"
            >
              Adicionar Renovação
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-zinc-100 mb-3">
              Renovações do mês ({formatMonthLabel(activeMonth)})
            </h3>

            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {loadingRenewals && <p className="text-sm text-zinc-400">Carregando...</p>}

              {!loadingRenewals && (!renewals || renewals.length === 0) && (
                <p className="text-sm text-zinc-500">Nenhuma renovação registrada.</p>
              )}

              {(renewals || []).map((renewal) => (
                <div
                  key={renewal.id}
                  className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-sm text-zinc-100 font-medium">
                      {renewal.aluno?.user?.nome || renewal.alunoId}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {mapPlanLabel(renewal.tipoPlano)} • {brl.format(renewal.valor)} • {" "}
                      {formatDateLabel(renewal.renovadoEm)}
                    </p>
                    {renewal.observacao && (
                      <p className="text-xs text-zinc-500 mt-1">{renewal.observacao}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickEditRenewal(renewal.id, renewal.valor)}
                      disabled={monthIsClosed || isMutating}
                      className="p-2 rounded hover:bg-zinc-800 disabled:opacity-50"
                      title="Editar valor"
                    >
                      <Pencil className="h-4 w-4 text-zinc-300" />
                    </button>
                    <button
                      onClick={() => handleDeleteRenewal(renewal.id)}
                      disabled={monthIsClosed || isMutating}
                      className="p-2 rounded hover:bg-red-950/40 disabled:opacity-50"
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

        <Card>
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Lançamento Manual</h2>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Tipo</label>
                <select
                  value={entryForm.tipo}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      tipo: event.target.value as FinanceEntryType,
                    }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
                >
                  <option value="RECEITA">Receita</option>
                  <option value="DESPESA">Despesa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">Categoria</label>
                <select
                  value={entryForm.categoria}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      categoria: event.target.value as FinanceEntryCategory,
                    }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Valor (BRL)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryForm.valor}
                  onChange={(event) =>
                    setEntryForm((prev) => ({ ...prev, valor: event.target.value }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">Quantidade (opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={entryForm.quantidade}
                  onChange={(event) =>
                    setEntryForm((prev) => ({ ...prev, quantidade: event.target.value }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">Data</label>
                <input
                  type="date"
                  value={entryForm.dataLancamento}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      dataLancamento: event.target.value,
                    }))
                  }
                  disabled={monthIsClosed || isMutating}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Descrição</label>
              <textarea
                value={entryForm.descricao}
                onChange={(event) =>
                  setEntryForm((prev) => ({ ...prev, descricao: event.target.value }))
                }
                disabled={monthIsClosed || isMutating}
                rows={2}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white disabled:opacity-60"
              />
            </div>

            <Button
              icon={Plus}
              onClick={handleCreateEntry}
              disabled={monthIsClosed}
              isLoading={createEntry.isLoading}
              className="w-full"
            >
              Adicionar Lançamento
            </Button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-zinc-100">
                Lançamentos do mês ({formatMonthLabel(activeMonth)})
              </h3>

              <select
                value={entryFilter}
                onChange={(event) => setEntryFilter(event.target.value as EntryFilter)}
                className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white"
              >
                <option value="ALL">Todos</option>
                <option value="RECEITA">Receitas</option>
                <option value="DESPESA">Despesas</option>
              </select>
            </div>

            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {loadingEntries && <p className="text-sm text-zinc-400">Carregando...</p>}

              {!loadingEntries && (!entries || entries.length === 0) && (
                <p className="text-sm text-zinc-500">Nenhum lançamento registrado.</p>
              )}

              {(entries || []).map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-sm text-zinc-100 font-medium">
                      {mapCategoryLabel(entry.categoria)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {mapEntryTypeLabel(entry.tipo)} • {brl.format(entry.valor)} • {" "}
                      {formatDateLabel(entry.dataLancamento)}
                    </p>
                    {entry.quantidade && (
                      <p className="text-xs text-zinc-500">Qtd: {entry.quantidade}</p>
                    )}
                    {entry.descricao && (
                      <p className="text-xs text-zinc-500 mt-1">{entry.descricao}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickEditEntry(entry.id, entry.valor)}
                      disabled={monthIsClosed || isMutating}
                      className="p-2 rounded hover:bg-zinc-800 disabled:opacity-50"
                      title="Editar valor"
                    >
                      <Pencil className="h-4 w-4 text-zinc-300" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={monthIsClosed || isMutating}
                      className="p-2 rounded hover:bg-red-950/40 disabled:opacity-50"
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

      {dashboard && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-zinc-300" />
            <h2 className="text-lg font-semibold text-zinc-100">Métricas por Professor</h2>
          </div>

          <div className="space-y-2">
            {dashboard.systemMetrics.professores.map((prof) => (
              <div
                key={prof.professorId}
                className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 rounded-lg border border-zinc-700 bg-zinc-900"
              >
                <p className="text-zinc-100 font-medium md:col-span-1">{prof.professorNome}</p>
                <p className="text-sm text-zinc-300">Ativos: {prof.ativos}</p>
                <p className="text-sm text-zinc-300">Inativos: {prof.inativos}</p>
                <p className="text-sm text-zinc-300">Total: {prof.total}</p>
              </div>
            ))}

            {dashboard.systemMetrics.professores.length === 0 && (
              <p className="text-sm text-zinc-500">Nenhum professor encontrado.</p>
            )}
          </div>
        </Card>
      )}

      {monthIsClosed && (
        <Card className="border-amber-500/40 bg-amber-900/15">
          <div className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-amber-300 mt-0.5" />
            <p className="text-sm text-[color:var(--app-warning)]">
              O mês {formatMonthLabel(activeMonth)} está fechado. Criação, edição e exclusão de
              registros ficam bloqueadas até reabrir.
            </p>
          </div>
        </Card>
      )}

      <Card className="bg-zinc-900 border-zinc-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-950">
            <p className="text-zinc-400">Automático v1</p>
            <p className="text-zinc-100 mt-1">
              Alunos totais/ativos/inativos, distribuição por professor, novos alunos por mês e
              aquisição por canal.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-950">
            <p className="text-zinc-400">Manual obrigatório v1</p>
            <p className="text-zinc-100 mt-1">
              Renovações por plano, camisas vendidas, receitas YouTube/parceiros/outras e despesas
              operacionais.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-950">
            <p className="text-zinc-400">Previsão</p>
            <p className="text-zinc-100 mt-1">
              Cálculo de 3 e 6 meses por média móvel dos 3 últimos meses fechados.
            </p>
          </div>
        </div>
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
        isLoading={
          deleteRenewal.isLoading ||
          deleteEntry.isLoading ||
          closeMonth.isLoading ||
          reopenMonth.isLoading
        }
      />
    </div>
  )
}

export default FinanceiroPage
