import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  CalendarDays,
  RefreshCcw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { Button, Card } from "../../components/ui"
import { useProfessorFinanceDashboard } from "../../hooks/useProfessorOperations"

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
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

const shiftMonths = (base: Date, offset: number) =>
  new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1))

export const ProfessorFinanceiroPage: React.FC = () => {
  const navigate = useNavigate()
  const now = new Date()
  const initialTo = toMonthInput(now)
  const initialFrom = toMonthInput(shiftMonths(now, -5))
  const [draftFrom, setDraftFrom] = useState(initialFrom)
  const [draftTo, setDraftTo] = useState(initialTo)
  const [filters, setFilters] = useState({ from: initialFrom, to: initialTo })

  const { data, isLoading, error, refetch } = useProfessorFinanceDashboard(
    filters.from,
    filters.to,
  )

  const maxRevenue = useMemo(() => {
    const values = data?.charts.evolucaoMensal || []
    return Math.max(1, ...values.map((item) => item.receita))
  }, [data?.charts.evolucaoMensal])

  const applyFilters = () => {
    if (!draftFrom || !draftTo || draftFrom > draftTo) return
    setFilters({ from: draftFrom, to: draftTo })
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
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-zinc-400">
                <tr className="border-b border-[color:var(--student-border)]">
                  <th className="py-3 pr-4">Aluno</th>
                  <th className="py-3 pr-4">Plano</th>
                  <th className="py-3 pr-4">Mês</th>
                  <th className="py-3 pr-4">Valor</th>
                  <th className="py-3 pr-4">Data</th>
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
