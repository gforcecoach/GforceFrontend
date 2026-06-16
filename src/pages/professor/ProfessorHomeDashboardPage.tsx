import React from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  CalendarClock,
  ClipboardList,
  Dumbbell,
  MessageSquareText,
  Plus,
  RefreshCcw,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { Badge, Button, Card } from "../../components/ui"
import { useProfessorDashboard } from "../../hooks/useProfessorOperations"
import type { ProfessorFeedbackItem } from "../../types"

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

const statusBadgeVariant = (status: ProfessorFeedbackItem["status"]) =>
  status === "AGUARDANDO_RESPOSTA" ? "warning" : "success"

const statusLabel = (status: ProfessorFeedbackItem["status"]) =>
  status === "AGUARDANDO_RESPOSTA" ? "Aguardando resposta" : "Respondido"

const MetricCard: React.FC<{
  label: string
  value: number
  helper: string
  icon: React.ElementType
}> = ({ label, value, helper, icon: Icon }) => (
  <Card className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-[color:var(--student-text-muted)]">{label}</p>
      <Icon className="h-5 w-5 text-[color:var(--student-text-soft)]" />
    </div>
    <p className="text-3xl font-semibold text-white">{value}</p>
    <p className="text-sm text-[color:var(--student-text-soft)]">{helper}</p>
  </Card>
)

const FeedbackColumn: React.FC<{
  title: string
  items: ProfessorFeedbackItem[]
  icon: React.ElementType
}> = ({ title, items, icon: Icon }) => {
  const navigate = useNavigate()

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[color:var(--student-text-soft)]" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-white">{item.alunoNome}</p>
                  <p className="text-sm text-[color:var(--student-text-muted)]">
                    {formatDate(item.data)}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(item.status)}>
                  {statusLabel(item.status)}
                </Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-[color:var(--student-text-soft)]">
                {item.resumo}
              </p>
              <Button
                variant="secondary"
                className="mt-4 w-full justify-center"
                icon={MessageSquareText}
                onClick={() => navigate(item.detailPath)}
              >
                Abrir detalhes
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[color:var(--student-border)] p-4 text-sm text-[color:var(--student-text-muted)]">
          Nenhum feedback recente nesta categoria.
        </p>
      )}
    </Card>
  )
}

export const ProfessorHomeDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useProfessorDashboard()

  if (isLoading) {
    return <p className="py-12 text-center text-zinc-300">Carregando dashboard...</p>
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-red-950/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-300" />
          <div className="space-y-3">
            <p className="font-semibold text-white">Não foi possível carregar o dashboard</p>
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

  const metrics = [
    {
      label: "Alunos ativos",
      value: data.summary.alunosAtivos,
      helper: `${data.summary.alunosInativos} inativo(s)`,
      icon: Users,
    },
    {
      label: "Aguardando resposta",
      value: data.summary.aguardandoResposta,
      helper: "Feedbacks com ação pendente",
      icon: MessageSquareText,
    },
    {
      label: "Sem treino ativo",
      value: data.summary.semTreinoAtivo,
      helper: "Alunos ativos sem prescrição",
      icon: Dumbbell,
    },
    {
      label: "Reavaliações próximas",
      value: data.summary.reavaliacoesProximas,
      helper: "Janela operacional de 5 dias",
      icon: CalendarClock,
    },
  ]

  const shortcuts = [
    { label: "Meus alunos", path: "/professor/alunos", icon: Users },
    { label: "Novo aluno", path: "/professor/alunos/new", icon: Plus },
    { label: "Prescrição de treino", path: "/professor/alunos", icon: Dumbbell },
    { label: "Prescrição alimentar", path: "/professor/alunos", icon: UtensilsCrossed },
    { label: "Reavaliações", path: "/professor/dashboard", icon: CalendarClock },
    { label: "Financeiro", path: "/professor/financeiro", icon: Wallet },
  ]

  return (
    <div className="space-y-8">
      <div
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        data-onboarding-target="onboarding-professor-dashboard-title"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard do Professor</h1>
          <p className="mt-1 text-zinc-300">
            Acompanhe alunos, feedbacks e pendências operacionais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={Plus} onClick={() => navigate("/professor/alunos/new")}>
            Novo aluno
          </Button>
          <Button
            variant="secondary"
            icon={Users}
            onClick={() => navigate("/professor/alunos")}
          >
            Meus alunos
          </Button>
        </div>
      </div>

      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        data-onboarding-target="onboarding-professor-dashboard-metrics"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div
        className="grid gap-6 lg:grid-cols-2"
        data-onboarding-target="onboarding-professor-feedbacks"
      >
        <FeedbackColumn
          title="Feedbacks de treino"
          items={data.feedbacks.treino}
          icon={Dumbbell}
        />
        <FeedbackColumn
          title="Feedbacks de dieta"
          items={data.feedbacks.dieta}
          icon={UtensilsCrossed}
        />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-[color:var(--student-text-soft)]" />
          <h2 className="text-lg font-semibold text-white">Reavaliações próximas</h2>
        </div>
        {data.reavaliacoesProximas.length > 0 ? (
          <div className="grid gap-3">
            {data.reavaliacoesProximas.map((item) => (
              <div
                key={item.alunoId}
                className="flex flex-col gap-3 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-white">{item.alunoNome}</p>
                  <p className="text-sm text-[color:var(--student-text-muted)]">
                    Última avaliação em{" "}
                    {item.ultimaAvaliacaoEm ? formatDate(item.ultimaAvaliacaoEm) : "-"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={item.diasRestantes <= 1 ? "warning" : "default"}>
                    {item.diasRestantes === 0
                      ? "Hoje"
                      : `Faltam ${item.diasRestantes} dias`}
                  </Badge>
                  <Button
                    variant="secondary"
                    icon={TrendingUp}
                    onClick={() => navigate(item.detailPath)}
                  >
                    Abrir aluno
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[color:var(--student-border)] p-4 text-sm text-[color:var(--student-text-muted)]">
            Nenhuma reavaliação nos próximos dias.
          </p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[color:var(--student-text-soft)]" />
            <h2 className="text-lg font-semibold text-white">Resumo dos alunos</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryItem label="Recém cadastrados" value={data.summary.alunosRecemCadastrados} />
            <SummaryItem label="Sem dieta ativa" value={data.summary.semDietaAtiva} />
            <SummaryItem label="Sem feedback recente" value={data.summary.semFeedbackRecente} />
            <SummaryItem label="Acompanhamento longo" value={data.summary.maiorTempoAcompanhamento.length} />
          </div>
          {data.summary.maiorTempoAcompanhamento.length > 0 && (
            <div className="space-y-2">
              {data.summary.maiorTempoAcompanhamento.slice(0, 3).map((item) => (
                <button
                  key={item.alunoId}
                  onClick={() => navigate(item.detailPath)}
                  className="flex w-full items-center justify-between rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] px-4 py-3 text-left transition-colors hover:bg-[color:var(--student-surface-soft)]"
                >
                  <span className="font-medium text-white">{item.alunoNome}</span>
                  <span className="text-sm text-[color:var(--student-text-muted)]">
                    {item.dias} dias
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Navegação rápida</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {shortcuts.map((shortcut) => (
              <Button
                key={shortcut.label}
                variant="secondary"
                icon={shortcut.icon}
                onClick={() => navigate(shortcut.path)}
                className="w-full justify-start"
              >
                {shortcut.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

const SummaryItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4">
    <p className="text-sm text-[color:var(--student-text-muted)]">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
  </div>
)
