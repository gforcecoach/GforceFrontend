import React, { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash2,
  TrendingUp,
} from "lucide-react"
import { Card, Button, Badge } from "../components/ui"
import { GraficoEvolucao } from "../components/GraficoEvolucao"
import { HistoricoForm } from "../components/HistoricoForm"
import { ConfirmModal } from "../components/ConfirmModal"
import { useHistorico, useDeleteHistorico } from "../hooks/useHistorico"
import { useAluno } from "../hooks/useAlunos"
import { useAuth } from "../hooks/useAuth"
import { useMyAluno } from "../hooks/useMyAluno"
import { showToast } from "../utils/toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { type MetricaEvolucao } from "../types/historico"

interface EvolucaoPageProps {
  embeddedInStudentContext?: boolean
}

export const EvolucaoPage: React.FC<EvolucaoPageProps> = ({
  embeddedInStudentContext = false,
}) => {
  const navigate = useNavigate()
  const { id: alunoIdParam } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [metricaSelecionada, setMetricaSelecionada] =
    useState<MetricaEvolucao>("pesoKg")
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    id: string
  }>({ isOpen: false, id: "" })

  const isAdmin = user?.role === "ADMIN"
  const isProfessor = user?.role === "PROFESSOR"
  const isAluno = user?.role === "ALUNO"
  const podeEditar = isAdmin || isProfessor

  const { data: meuAlunoRegistro } = useMyAluno()

  const alunoId =
    isAluno && meuAlunoRegistro ? meuAlunoRegistro.id : alunoIdParam

  const { data: aluno, isLoading: loadingAluno } = useAluno(alunoId || "", {
    enabled: !!alunoId,
  })

  const {
    data: historico,
    isLoading: loadingHistorico,
    refetch,
  } = useHistorico(alunoId || "", undefined, {
    enabled: !!alunoId,
  })
  const deleteHistorico = useDeleteHistorico()

  const getBackRoute = () => {
    if (isAdmin) return "/admin/alunos"
    if (isProfessor) return "/professor/dashboard"
    return "/aluno/dashboard"
  }

  const handleDelete = async (id: string) => {
    setConfirmDelete({ isOpen: true, id })
  }

  const confirmDeleteAction = async () => {
    try {
      await deleteHistorico.mutateAsync({
        id: confirmDelete.id,
        alunoId: alunoId || "",
      })
      setConfirmDelete({ isOpen: false, id: "" })
      refetch()
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast.error(error.message)
      } else {
        showToast.error("Erro ao excluir registro")
      }
    }
  }

  if (loadingAluno || loadingHistorico) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[color:var(--student-info)]" />
        <p className="text-[color:var(--student-text-soft)]">Carregando...</p>
      </div>
    )
  }

  if (!aluno) {
    return (
      <Card className="bg-[color:var(--student-danger-surface)] border-2 border-[color:var(--app-danger-border)]">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-[color:var(--student-danger)] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[color:var(--student-text)] mb-2">
              Aluno não encontrado
            </h3>
            <Button
              onClick={() => navigate(getBackRoute())}
              variant="secondary"
            >
              Voltar
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-w-0" data-onboarding-target="onboarding-evolution-main">
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {!embeddedInStudentContext && (
            <button
              onClick={() => navigate(getBackRoute())}
              className="mt-1 flex-shrink-0 p-2 hover:bg-[color:var(--student-surface-soft)] rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold leading-tight text-[color:var(--student-text)] sm:text-3xl">
              {embeddedInStudentContext
                ? "Evolução física"
                : `Evolução - ${aluno.user?.nome || "Aluno"}`}
            </h1>
            <p className="text-[color:var(--student-text-soft)] mt-1">
              {historico?.length || 0}{" "}
              {historico?.length === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>

        {podeEditar && (
          <Button
            icon={TrendingUp}
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "secondary" : "primary"}
            className="min-h-10 self-start px-3 py-2 text-sm sm:px-4 sm:text-base"
          >
            <span className="sm:hidden">
              {showForm ? "Ocultar" : "Registrar"}
            </span>
            <span className="hidden sm:inline">
              {showForm ? "Ocultar Formulário" : "Novo Registro"}
            </span>
          </Button>
        )}
      </div>

      {podeEditar && showForm && (
        <div className="mb-6">
          <HistoricoForm
            alunoId={alunoId || ""}
            onSuccess={() => {
              setShowForm(false)
              refetch()
            }}
          />
        </div>
      )}

      <Card className="mb-6">
        <label className="block text-sm font-medium text-[color:var(--student-text-soft)] mb-3">
          Selecione a métrica para visualizar:
        </label>
        <select
          value={metricaSelecionada}
          onChange={(e) =>
            setMetricaSelecionada(e.target.value as MetricaEvolucao)
          }
          className="w-full md:w-auto px-4 py-2 bg-[color:var(--student-surface)] text-[color:var(--student-text)] border border-[color:var(--student-border)] rounded-lg focus:ring-2 focus:ring-[color:var(--student-border-strong)] focus:border-transparent"
        >
          <option value="pesoKg">Peso (kg)</option>
          <option value="cinturaCm">Cintura (cm)</option>
          <option value="quadrilCm">Quadril (cm)</option>
          <option value="pescocoCm">Pescoço (cm)</option>
          <option value="percentualGordura">% Gordura</option>
          <option value="massaMagraKg">Massa magra estimada (kg)</option>
          <option value="bracoEsquerdoCm">Braço Esquerdo (cm)</option>
          <option value="bracoDireitoCm">Braço Direito (cm)</option>
          <option value="pernaEsquerdaCm">Perna Esquerda (cm)</option>
          <option value="pernaDireitaCm">Perna Direita (cm)</option>
        </select>
      </Card>

      <div className="mb-6">
        <GraficoEvolucao alunoId={alunoId || ""} metrica={metricaSelecionada} />
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-[color:var(--student-text)] mb-4">Histórico Completo</h2>

        {historico && historico.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-[color:var(--student-surface-soft)]">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-[color:var(--student-text-soft)]">
                    Data
                  </th>
                  <th className="p-3 text-center text-sm font-medium text-[color:var(--student-text-soft)]">
                    Peso
                  </th>
                  <th className="p-3 text-center text-sm font-medium text-[color:var(--student-text-soft)]">
                    Altura
                  </th>
                  <th className="p-3 text-center text-sm font-medium text-[color:var(--student-text-soft)]">
                    Cintura
                  </th>
                  <th className="p-3 text-center text-sm font-medium text-[color:var(--student-text-soft)]">
                    % Gordura
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[color:var(--student-text-soft)]">
                    Observações
                  </th>
                  {podeEditar && (
                    <th className="p-3 text-center text-sm font-medium text-[color:var(--student-text-soft)]">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {historico.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-[color:var(--student-surface)]">
                    <td className="p-3 text-sm">
                      {format(new Date(item.dataRegistro), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="p-3 text-center text-sm">
                      {item.pesoKg ? (
                        <Badge variant="success">
                          <span className="whitespace-nowrap">
                            {item.pesoKg} kg
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-[color:var(--student-text-muted)]">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-sm">
                      {item.alturaCm ? (
                        <Badge>
                          <span className="whitespace-nowrap">
                            {item.alturaCm} cm
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-[color:var(--student-text-muted)]">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-sm">
                      {item.cinturaCm ? (
                        <Badge variant="warning">
                          <span className="whitespace-nowrap">
                            {item.cinturaCm} cm
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-[color:var(--student-text-muted)]">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-sm">
                      {item.percentualGordura ? (
                        <Badge variant="danger">
                          <span className="whitespace-nowrap">
                            {item.percentualGordura}%
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-[color:var(--student-text-muted)]">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-[color:var(--student-text-soft)]">
                      {item.observacoes || "-"}
                    </td>
                    {podeEditar && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteHistorico.isLoading}
                          className="p-2 hover:bg-[color:var(--student-danger-surface)] rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-[color:var(--student-danger)]" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-[color:var(--student-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[color:var(--student-text)] mb-2">
              Nenhum registro de evolução
            </h3>
            <p className="text-[color:var(--student-text-muted)] mb-6">
              {podeEditar
                ? "Adicione o primeiro registro para começar o acompanhamento"
                : "Ainda não há registros de evolução disponíveis"}
            </p>
            {podeEditar && !showForm && (
              <Button icon={TrendingUp} onClick={() => setShowForm(true)}>
                Adicionar Primeiro Registro
              </Button>
            )}
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Excluir Registro"
        message={`Deseja realmente excluir este registro de evolução?\n\nEsta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, id: "" })}
        isLoading={deleteHistorico.isLoading}
      />
    </div>
  )
}
