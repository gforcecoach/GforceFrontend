import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  Plus,
  Search,
  User,
  Activity,
  Calendar,
  Phone,
  TrendingUp,
  Eye,
  Camera,
  Dumbbell,
  UtensilsCrossed,
  UserCheck,
  UserX,
} from "lucide-react"
import { ConfirmModal } from "../../components/ConfirmModal"
import { Card, Button, Input, Badge } from "../../components/ui"
import { useAlunos, useUpdateAlunoStatus } from "../../hooks/useAlunos"
import { logError } from "../../utils/logError"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type AlunoTab = "ATIVOS" | "INATIVOS" | "TODOS"
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

export const ProfessorDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data: alunos, isLoading } = useAlunos()
  const updateAlunoStatus = useUpdateAlunoStatus()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<AlunoTab>("ATIVOS")
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(
    createInitialConfirmDialog,
  )

  const alunosAtivos = useMemo(
    () => (alunos || []).filter((aluno) => aluno.ativo).length,
    [alunos],
  )
  const alunosInativos = useMemo(
    () => (alunos || []).filter((aluno) => !aluno.ativo).length,
    [alunos],
  )

  const filteredAlunos = (alunos || []).filter((aluno) => {
    const matchesTab =
      activeTab === "TODOS"
        ? true
        : activeTab === "ATIVOS"
          ? aluno.ativo
          : !aluno.ativo

    if (!matchesTab) return false

    const search = searchTerm.toLowerCase()
    const nome = aluno.user?.nome?.toLowerCase() || ""
    const email = aluno.user?.email?.toLowerCase() || ""

    return (
      nome.includes(search) ||
      email.includes(search) ||
      aluno.id.toLowerCase().includes(search)
    )
  })

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

  const handleToggleStatus = (alunoId: string, ativoAtual: boolean) => {
    const actionLabel = ativoAtual ? "inativar" : "reativar"

    setConfirmDialog({
      isOpen: true,
      title: ativoAtual ? "Inativar Aluno" : "Reativar Aluno",
      message: `Deseja ${actionLabel} este aluno?`,
      confirmText: ativoAtual ? "Sim, Inativar" : "Sim, Reativar",
      cancelText: "Cancelar",
      variant: ativoAtual ? "warning" : "info",
      onConfirm: async () => {
        try {
          await updateAlunoStatus.mutateAsync({
            id: alunoId,
            data: { ativo: !ativoAtual },
          })
        } catch (error) {
          logError("ProfessorDashboard.updateAlunoStatus", error)
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Meus Alunos</h1>
          <p className="text-zinc-300 mt-1">
            {alunos?.length || 0} {alunos?.length === 1 ? "aluno" : "alunos"}{" "}
            cadastrado(s)
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            {alunosAtivos} ativo(s) • {alunosInativos} inativo(s)
          </p>
        </div>

        <Button icon={Plus} onClick={() => navigate("/professor/alunos/new")}>
          Adicionar Aluno
        </Button>
      </div>

      {alunos && alunos.length > 0 && (
        <Card className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === "ATIVOS" ? "primary" : "secondary"}
              onClick={() => setActiveTab("ATIVOS")}
            >
              Ativos ({alunosAtivos})
            </Button>
            <Button
              variant={activeTab === "INATIVOS" ? "primary" : "secondary"}
              onClick={() => setActiveTab("INATIVOS")}
            >
              Inativos ({alunosInativos})
            </Button>
            <Button
              variant={activeTab === "TODOS" ? "primary" : "secondary"}
              onClick={() => setActiveTab("TODOS")}
            >
              Todos ({alunos?.length || 0})
            </Button>
          </div>

          <Input
            icon={Search}
            placeholder="Buscar aluno por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Card>
      )}

      {filteredAlunos.length > 0 ? (
        <div className="grid gap-4">
          {filteredAlunos.map((aluno) => (
            <Card key={aluno.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {aluno.user?.nome || `Aluno #${aluno.id.slice(0, 8)}`}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {aluno.user?.email || "Email não disponível"}
                    </p>
                    <div className="mt-2">
                      <Badge variant={aluno.ativo ? "success" : "warning"}>
                        {aluno.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Cadastrado em{" "}
                      {format(new Date(aluno.createdAt), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(aluno.id, aluno.ativo)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    title={aluno.ativo ? "Inativar aluno" : "Reativar aluno"}
                  >
                    {aluno.ativo ? (
                      <UserX className="h-5 w-5 text-amber-300" />
                    ) : (
                      <UserCheck className="h-5 w-5 text-emerald-300" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/professor/alunos/${aluno.id}/evolucao`)
                    }
                    className="p-2 hover:bg-emerald-950/40 rounded-lg transition-colors"
                    title="Ver Evolução"
                  >
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/professor/alunos/${aluno.id}/fotos`)
                    }
                    className="p-2 hover:bg-purple-950/40 rounded-lg transition-colors"
                    title="Ver Fotos"
                  >
                    <Camera className="h-5 w-5 text-purple-600" />
                  </button>
                  <button
                    onClick={() => navigate(`/professor/alunos/${aluno.id}/treino`)}
                    className="p-2 hover:bg-blue-950/40 rounded-lg transition-colors"
                    title="Editar Treino"
                  >
                    <Dumbbell className="h-5 w-5 text-blue-300" />
                  </button>
                  <button
                    onClick={() => navigate(`/professor/alunos/${aluno.id}/dieta`)}
                    className="p-2 hover:bg-orange-950/40 rounded-lg transition-colors"
                    title="Editar Dieta"
                  >
                    <UtensilsCrossed className="h-5 w-5 text-orange-300" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {aluno.telefone && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{aluno.telefone}</span>
                  </div>
                )}
                {aluno.idade && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{aluno.idade} anos</span>
                  </div>
                )}
                {aluno.dias_treino_semana !== null && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">
                      {aluno.dias_treino_semana}x por semana
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {aluno.pesoKg && <Badge>Peso: {aluno.pesoKg} kg</Badge>}
                {aluno.alturaCm && (
                  <Badge variant="success">Alt: {aluno.alturaCm} cm</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 border-t pt-3">
                <Button
                  variant="secondary"
                  icon={Eye}
                  onClick={() => navigate(`/professor/alunos/${aluno.id}/edit`)}
                  className="w-full"
                >
                  Ver Perfil
                </Button>
                <Button
                  variant="secondary"
                  icon={TrendingUp}
                  onClick={() =>
                    navigate(`/professor/alunos/${aluno.id}/evolucao`)
                  }
                  className="w-full"
                >
                  Evolução
                </Button>
                <Button
                  variant="secondary"
                  icon={Camera}
                  onClick={() =>
                    navigate(`/professor/alunos/${aluno.id}/fotos`)
                  }
                  className="w-full"
                >
                  Fotos
                </Button>
                <Button
                  variant="secondary"
                  icon={Dumbbell}
                  onClick={() => navigate(`/professor/alunos/${aluno.id}/treino`)}
                  className="w-full"
                >
                  Treino
                </Button>
                <Button
                  variant="secondary"
                  icon={UtensilsCrossed}
                  onClick={() => navigate(`/professor/alunos/${aluno.id}/dieta`)}
                  className="w-full"
                >
                  Dieta
                </Button>
                <Button
                  variant="secondary"
                  icon={aluno.ativo ? UserX : UserCheck}
                  onClick={() => handleToggleStatus(aluno.id, aluno.ativo)}
                  className="w-full"
                  disabled={updateAlunoStatus.isLoading}
                >
                  {aluno.ativo ? "Inativar" : "Reativar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Users className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno nesta aba"}
          </h3>
          <p className="text-zinc-400 mb-6">
            {searchTerm
              ? "Tente ajustar sua busca"
              : "Adicione seu primeiro aluno para começar"}
          </p>
          {!searchTerm ? (
            <Button
              icon={Plus}
              onClick={() => navigate("/professor/alunos/new")}
            >
              Adicionar Primeiro Aluno
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setSearchTerm("")}>
              Limpar Busca
            </Button>
          )}
        </Card>
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
        isLoading={updateAlunoStatus.isLoading}
      />
    </div>
  )
}
