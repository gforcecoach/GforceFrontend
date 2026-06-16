import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Card, Button } from "../components/ui"
import { ModalEnviarFoto } from "../components/ModalEnviarFoto"
import { ConfirmModal } from "../components/ConfirmModal"
import { useFotoShape } from "../hooks/useFotoShape"
import { useAluno } from "../hooks/useAlunos"
import { useAuth } from "../hooks/useAuth"
import { useMyAluno } from "../hooks/useMyAluno"
import { showToast } from "../utils/toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FotosArquivosPageProps {
  embeddedInStudentContext?: boolean
}

export const FotosArquivosPage: React.FC<FotosArquivosPageProps> = ({
  embeddedInStudentContext = false,
}) => {
  const navigate = useNavigate()
  const { id: alunoIdParam } = useParams<{ id: string }>()
  const { user, token } = useAuth()

  const [showModalFoto, setShowModalFoto] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    id: string
  }>({ isOpen: false, id: "" })

  const isAluno = user?.role === "ALUNO"
  const isAdmin = user?.role === "ADMIN"
  const isProfessor = user?.role === "PROFESSOR"

  const podeDeletarFoto = isAluno || isAdmin

  const { data: meuAlunoRegistro } = useMyAluno()

  const alunoId =
    isAluno && meuAlunoRegistro ? meuAlunoRegistro.id : alunoIdParam

  const { data: aluno, isLoading: loadingAluno } = useAluno(alunoId || "", {
    enabled: !!alunoId,
  })

  const fotoHook = useFotoShape(token || "")

  useEffect(() => {
    if (alunoId && token) {
      fotoHook.fetchFotos(alunoId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId, token])

  const getBackRoute = () => {
    if (isAdmin) return "/admin/alunos"
    if (isProfessor) return "/professor/dashboard"
    return "/aluno/dashboard"
  }

  const handleUploadFoto = async (file: File, descricao?: string) => {
    try {
      await fotoHook.upload(file, descricao)
      showToast.success("Foto enviada com sucesso!")
      fotoHook.fetchFotos(alunoId!)
    } catch (error) {
      if (error instanceof Error) {
        showToast.error(error.message)
      }
      throw error
    }
  }

  const handleDeleteFoto = (id: string) => {
    setConfirmDelete({ isOpen: true, id })
  }

  const confirmDeleteAction = async () => {
    try {
      await fotoHook.deleteFoto(confirmDelete.id)
      showToast.success("Foto excluída com sucesso!")
      setConfirmDelete({ isOpen: false, id: "" })
    } catch (error) {
      if (error instanceof Error) {
        showToast.error(error.message)
      }
    }
  }

  if (loadingAluno) {
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

  if (fotoHook.error) {
    return (
      <div>
        {!embeddedInStudentContext && (
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(getBackRoute())}
              className="p-2 hover:bg-[color:var(--student-surface-soft)] rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-[color:var(--student-text)]">
              Erro ao carregar dados
            </h1>
          </div>
        )}
        <Card className="bg-[color:var(--student-danger-surface)] border-2 border-[color:var(--app-danger-border)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-[color:var(--student-danger)] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[color:var(--student-text)] mb-2">
                Erro ao carregar
              </h3>
              <p className="text-[color:var(--student-text)]">
                {fotoHook.error}
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    if (alunoId && token) {
                      fotoHook.fetchFotos(alunoId)
                    }
                  }}
                  variant="secondary"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div data-onboarding-target="onboarding-photos-main">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {!embeddedInStudentContext && (
            <button
              onClick={() => navigate(getBackRoute())}
              className="p-2 hover:bg-[color:var(--student-surface-soft)] rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-[color:var(--student-text)]">
              {embeddedInStudentContext
                ? "Fotos"
                : isAluno
                  ? "Minhas Fotos"
                  : `Fotos - ${aluno.user?.nome}`}
            </h1>
            <p className="text-[color:var(--student-text-soft)] mt-1">
              {fotoHook.fotos.length} foto(s)
            </p>
          </div>
        </div>
      </div>

      {isAluno && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Minhas Fotos de Shape
            </h2>
            <Button
              icon={Plus}
              onClick={() => setShowModalFoto(true)}
              disabled={fotoHook.loading}
            >
              Enviar Foto
            </Button>
          </div>

          {fotoHook.loading && fotoHook.fotos.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[color:var(--student-info)] mx-auto" />
            </div>
          ) : fotoHook.fotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fotoHook.fotos.map((foto) => (
                <div
                  key={foto.id}
                  className="relative group rounded-lg overflow-hidden border-2 border-[color:var(--student-border)] hover:border-[color:var(--student-border-strong)] transition-colors"
                >
                  <img
                    src={foto.url}
                    alt={foto.descricao || "Foto de shape"}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteFoto(foto.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-[color:var(--student-danger-surface)] text-[color:var(--student-text)] rounded-lg hover:bg-[color:var(--app-danger-surface-hover)] transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-2 bg-[color:var(--student-surface)]">
                    <p className="text-xs text-[color:var(--student-text-soft)]">
                      {format(new Date(foto.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    {foto.descricao && (
                      <p className="text-sm text-[color:var(--student-text)] mt-1">
                        {foto.descricao}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[color:var(--student-surface)] rounded-lg border-2 border-dashed border-[color:var(--student-border)]">
              <ImageIcon className="h-12 w-12 text-[color:var(--student-text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[color:var(--student-text)] mb-2">
                Nenhuma foto enviada ainda
              </h3>
              <p className="text-[color:var(--student-text-soft)] mb-4">
                Envie fotos para acompanhar sua evolução física
              </p>
              <Button icon={Plus} onClick={() => setShowModalFoto(true)}>
                Enviar Primeira Foto
              </Button>
            </div>
          )}
        </Card>
      )}

      {!isAluno && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Fotos de Shape do Aluno
            </h2>
          </div>

          {fotoHook.loading && fotoHook.fotos.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[color:var(--student-info)] mx-auto" />
            </div>
          ) : fotoHook.fotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fotoHook.fotos.map((foto) => (
                <div
                  key={foto.id}
                  className="relative group rounded-lg overflow-hidden border-2 border-[color:var(--student-border)] hover:border-[color:var(--student-border-strong)] transition-colors"
                >
                  <img
                    src={foto.url}
                    alt={foto.descricao || "Foto de shape"}
                    className="w-full h-48 object-cover"
                  />
                  {podeDeletarFoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                      <button
                        onClick={() => handleDeleteFoto(foto.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-[color:var(--student-danger-surface)] text-[color:var(--student-text)] rounded-lg hover:bg-[color:var(--app-danger-surface-hover)] transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="p-2 bg-[color:var(--student-surface)]">
                    <p className="text-xs text-[color:var(--student-text-soft)]">
                      {format(new Date(foto.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    {foto.descricao && (
                      <p className="text-sm text-[color:var(--student-text)] mt-1">
                        {foto.descricao}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[color:var(--student-surface)] rounded-lg border-2 border-dashed border-[color:var(--student-border)]">
              <ImageIcon className="h-12 w-12 text-[color:var(--student-text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[color:var(--student-text)] mb-2">
                Nenhuma foto disponível
              </h3>
              <p className="text-[color:var(--student-text-soft)]">O aluno ainda não enviou fotos</p>
            </div>
          )}
        </Card>
      )}

      <ModalEnviarFoto
        isOpen={showModalFoto}
        onClose={() => setShowModalFoto(false)}
        onSubmit={handleUploadFoto}
        isLoading={fotoHook.loading}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Excluir Foto"
        message="Deseja realmente excluir esta foto?\n\nEsta ação não pode ser desfeita."
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() =>
          setConfirmDelete({ isOpen: false, id: "" })
        }
        isLoading={fotoHook.loading}
      />
    </div>
  )
}
