import React, { type ReactNode } from "react"
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"
import {
  Activity,
  ArrowLeft,
  Camera,
  ClipboardList,
  Dumbbell,
  FileText,
  Loader2,
  Ruler,
  TrendingUp,
  User,
  UtensilsCrossed,
} from "lucide-react"
import { addMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge, Button, Card } from "../../components/ui"
import { useAluno } from "../../hooks/useAlunos"
import { useHistorico } from "../../hooks/useHistorico"
import { type Aluno } from "../../types"
import { type HistoricoEvolucao } from "../../types/historico"
import { AnswerForm } from "../AnswerForm"
import { EvolucaoPage } from "../EvolucaoPage"
import { FotosArquivosPage } from "../FotosArquivosPage"
import { PlanoDietaEditorPage } from "./PlanoDietaEditorPage"
import { PlanoTreinoEditorPage } from "./PlanoTreinoEditorPage"

interface StudentContextContentProps {
  embeddedInStudentContext?: boolean
}

const tabs = [
  { label: "Visao Geral", path: "", icon: User },
  { label: "Evolucao", path: "evolucao", icon: TrendingUp },
  { label: "Formulario", path: "formulario", icon: ClipboardList },
  { label: "Treino", path: "treino", icon: Dumbbell },
  { label: "Dieta", path: "dieta", icon: UtensilsCrossed },
  { label: "Fotos", path: "fotos", icon: Camera },
]

const latestHistoryFilters = { limite: 1 }

const formatDate = (value?: string | null) => {
  if (!value) return "Sem registro"
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR })
}

const getInitials = (name?: string | null) => {
  if (!name) return "AL"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

const SummaryMetric: React.FC<{
  icon: React.ElementType
  label: string
  value: ReactNode
}> = ({ icon: Icon, label, value }) => (
  <div className="min-w-0 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4">
    <div className="mb-2 flex items-center gap-2 text-sm text-[color:var(--student-text-soft)]">
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </div>
    <div className="break-words text-lg font-semibold text-[color:var(--student-text)]">
      {value}
    </div>
  </div>
)

const StudentHeader: React.FC<{
  aluno: Aluno
  latestHistory?: HistoricoEvolucao
}> = ({ aluno, latestHistory }) => {
  const navigate = useNavigate()
  const name = aluno.user?.nome || "Aluno"
  const latestDate = latestHistory?.dataRegistro
  const nextDate = latestDate
    ? addMonths(new Date(latestDate), 1).toISOString()
    : null

  return (
    <section className="rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] p-4 shadow-[var(--student-shadow)] sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-[color:var(--student-border-strong)] bg-[color:var(--student-accent-surface)] text-xl font-bold text-[color:var(--student-text)]">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold leading-tight text-[color:var(--student-text)] sm:text-3xl">
                {name}
              </h1>
              <Badge variant={aluno.ativo ? "success" : "warning"}>
                {aluno.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="break-words text-sm text-[color:var(--student-text-soft)]">
              {aluno.user?.email || "Email nao informado"}
              {aluno.telefone ? ` - ${aluno.telefone}` : ""}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate("/professor/alunos")}
          className="w-full justify-center sm:w-auto"
        >
          Voltar para Meus Alunos
        </Button>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric
          icon={TrendingUp}
          label="Ultima avaliacao"
          value={formatDate(latestDate)}
        />
        <SummaryMetric
          icon={Activity}
          label="Proxima reavaliacao"
          value={formatDate(nextDate)}
        />
        <SummaryMetric
          icon={Ruler}
          label="Composicao atual"
          value={
            aluno.pesoKg || aluno.alturaCm
              ? `${aluno.pesoKg ? `${aluno.pesoKg} kg` : "Peso pendente"} - ${
                  aluno.alturaCm ? `${aluno.alturaCm} cm` : "Altura pendente"
                }`
              : "Medidas pendentes"
          }
        />
        <SummaryMetric
          icon={Dumbbell}
          label="Rotina"
          value={
            aluno.dias_treino_semana
              ? `${aluno.dias_treino_semana}x por semana`
              : "Frequencia pendente"
          }
        />
      </div>
    </section>
  )
}

const StudentTabs: React.FC<{ alunoId: string }> = ({ alunoId }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = `/professor/alunos/${alunoId}`
  const currentSuffix = location.pathname
    .replace(basePath, "")
    .replace(/^\/+/, "")

  return (
    <nav
      aria-label="Navegacao do aluno"
      className="max-w-full overflow-x-auto rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-1"
    >
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.path
            ? currentSuffix === tab.path
            : currentSuffix === ""
          const target = tab.path ? `${basePath}/${tab.path}` : basePath

          return (
            <button
              key={tab.path || "overview"}
              type="button"
              onClick={() => navigate(target)}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[color:var(--student-accent)] text-[color:var(--student-accent-contrast)]"
                  : "text-[color:var(--student-text-soft)] hover:bg-[color:var(--student-surface-soft)] hover:text-[color:var(--student-text)]"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

const OverviewItem: React.FC<{ label: string; value: ReactNode }> = ({
  label,
  value,
}) => (
  <div className="min-w-0 border-b border-[color:var(--student-border)] py-3 last:border-b-0">
    <p className="text-sm text-[color:var(--student-text-soft)]">{label}</p>
    <p className="mt-1 break-words text-[color:var(--student-text)]">{value}</p>
  </div>
)

const ProfessorAlunoOverview: React.FC<{
  aluno: Aluno
  latestHistory?: HistoricoEvolucao
}> = ({ aluno, latestHistory }) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const basePath = `/professor/alunos/${id}`

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <Card className="min-w-0 shadow-none">
        <h2 className="mb-4 text-xl font-semibold text-[color:var(--student-text)]">
          Resumo rapido
        </h2>
        <OverviewItem label="Objetivo atual" value={aluno.objetivos_atuais || "Nao informado"} />
        <OverviewItem label="Idade" value={aluno.idade ? `${aluno.idade} anos` : "Nao informada"} />
        <OverviewItem label="Dores articulares" value={aluno.dores_articulares || "Nao informado"} />
        <OverviewItem
          label="Preferencias alimentares"
          value={
            aluno.alimentos_quer_diario?.length
              ? aluno.alimentos_quer_diario.join(", ")
              : "Nao informadas"
          }
        />
        <OverviewItem
          label="Restricoes alimentares"
          value={
            aluno.alergias_alimentares?.length ||
            aluno.alimentos_nao_comem?.length
              ? [
                  ...(aluno.alergias_alimentares || []),
                  ...(aluno.alimentos_nao_comem || []),
                ].join(", ")
              : "Nao informadas"
          }
        />
      </Card>

      <div className="grid min-w-0 gap-4">
        <Card className="min-w-0 shadow-none">
          <h2 className="mb-4 text-xl font-semibold text-[color:var(--student-text)]">
            Acoes principais
          </h2>
          <div className="grid gap-2">
            <Button
              variant="secondary"
              icon={Dumbbell}
              onClick={() => navigate(`${basePath}/treino`)}
              className="justify-center"
            >
              Abrir Treino
            </Button>
            <Button
              variant="secondary"
              icon={UtensilsCrossed}
              onClick={() => navigate(`${basePath}/dieta`)}
              className="justify-center"
            >
              Abrir Dieta
            </Button>
            <Button
              variant="secondary"
              icon={TrendingUp}
              onClick={() => navigate(`${basePath}/evolucao`)}
              className="justify-center"
            >
              Abrir Evolucao
            </Button>
          </div>
        </Card>

        <Card className="min-w-0 shadow-none">
          <h2 className="mb-4 text-xl font-semibold text-[color:var(--student-text)]">
            Avaliacao
          </h2>
          <OverviewItem
            label="Ultimo registro"
            value={formatDate(latestHistory?.dataRegistro)}
          />
          <OverviewItem
            label="Observacoes"
            value={latestHistory?.observacoes || "Sem observacoes recentes"}
          />
          <Button
            variant="secondary"
            icon={FileText}
            onClick={() => navigate(`${basePath}/formulario`)}
            className="mt-4 w-full justify-center"
          >
            Ver Formulario
          </Button>
        </Card>
      </div>
    </div>
  )
}

export const ProfessorAlunoContextPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: aluno, isLoading: loadingAluno, error } = useAluno(id || "", {
    enabled: !!id,
  })
  const { data: latestHistoryList } = useHistorico(
    id || "",
    latestHistoryFilters,
    { enabled: !!id },
  )
  const latestHistory = latestHistoryList?.[0]

  if (!id) {
    return <Navigate to="/professor/alunos" replace />
  }

  if (loadingAluno) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[color:var(--student-info)]" />
        <p className="text-[color:var(--student-text-soft)]">
          Carregando aluno...
        </p>
      </div>
    )
  }

  if (error || !aluno) {
    return (
      <Card className="border-2 border-[color:var(--app-danger-border)] bg-[color:var(--student-danger-surface)]">
        <p className="mb-4 text-[color:var(--student-danger)]">
          {error?.message || "Aluno nao encontrado."}
        </p>
        <Button variant="secondary" onClick={() => navigate("/professor/alunos")}>
          Voltar para Meus Alunos
        </Button>
      </Card>
    )
  }

  const embeddedProps: StudentContextContentProps = {
    embeddedInStudentContext: true,
  }

  return (
    <div className="min-w-0 space-y-4 overflow-x-clip">
      <StudentHeader aluno={aluno} latestHistory={latestHistory} />
      <StudentTabs alunoId={id} />
      <div className="min-w-0">
        <Routes>
          <Route
            index
            element={
              <ProfessorAlunoOverview aluno={aluno} latestHistory={latestHistory} />
            }
          />
          <Route path="evolucao" element={<EvolucaoPage {...embeddedProps} />} />
          <Route path="formulario" element={<AnswerForm {...embeddedProps} />} />
          <Route path="treino" element={<PlanoTreinoEditorPage {...embeddedProps} />} />
          <Route path="dieta" element={<PlanoDietaEditorPage {...embeddedProps} />} />
          <Route path="fotos" element={<FotosArquivosPage {...embeddedProps} />} />
          <Route path="edit" element={<Navigate to="../formulario" replace />} />
          <Route path="fotos-arquivos" element={<Navigate to="../fotos" replace />} />
          <Route path="*" element={<Navigate to={`/professor/alunos/${id}`} replace />} />
        </Routes>
      </div>
    </div>
  )
}
