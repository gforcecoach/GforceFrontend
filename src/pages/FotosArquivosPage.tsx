import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, Button } from "../components/ui"
import { ModalEnviarFoto } from "../components/ModalEnviarFoto"
import { ModalEnviarArquivo } from "../components/ModalEnviarArquivo"
import { ConfirmModal } from "../components/ConfirmModal"
import { useFotoShape } from "../hooks/useFotoShape"
import { useArquivosAluno } from "../hooks/useArquivosAluno"
import { useAluno } from "../hooks/useAlunos"
import { useAuth } from "../hooks/useAuth"
import { useMyAluno } from "../hooks/useMyAluno"
import { showToast } from "../utils/toast"
import type { TipoArquivoAluno } from "../types"

interface FotosArquivosPageProps {
  embeddedInStudentContext?: boolean
}

type DeleteTarget = "foto" | "arquivo"

const formatDateTime = (value: string) =>
  format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR })

const tipoArquivoLabel: Record<TipoArquivoAluno, string> = {
  TREINO: "Treino",
  DIETA: "Dieta",
}

export const FotosArquivosPage: React.FC<FotosArquivosPageProps> = ({
  embeddedInStudentContext = false,
}) => {
  const navigate = useNavigate()
  const { id: alunoIdParam } = useParams<{ id: string }>()
  const { user, token } = useAuth()

  const [showModalFoto, setShowModalFoto] = useState(false)
  const [showModalArquivo, setShowModalArquivo] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    id: string
    target: DeleteTarget
  }>({ isOpen: false, id: "", target: "foto" })

  const isAluno = user?.role === "ALUNO"
  const isAdmin = user?.role === "ADMIN"
  const isProfessor = user?.role === "PROFESSOR"

  const podeEnviarFoto = isAluno
  const podeGerenciarArquivo = isAdmin || isProfessor
  const podeDeletarFoto = isAluno || isAdmin || isProfessor

  const { data: meuAlunoRegistro } = useMyAluno()

  const alunoId =
    isAluno && meuAlunoRegistro ? meuAlunoRegistro.id : alunoIdParam

  const { data: aluno, isLoading: loadingAluno } = useAluno(alunoId || "", {
    enabled: !!alunoId,
  })

  const fotoHook = useFotoShape()
  const arquivoHook = useArquivosAluno()

  useEffect(() => {
    if (alunoId && token) {
      fotoHook.fetchFotos(alunoId)
      arquivoHook.fetchArquivos(alunoId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId, token])

  const getBackRoute = () => {
    if (isAdmin) return "/admin/alunos"
    if (isProfessor) return "/professor/dashboard"
    return "/aluno/dashboard"
  }

  const refreshContent = () => {
    if (!alunoId || !token) return
    fotoHook.fetchFotos(alunoId)
    arquivoHook.fetchArquivos(alunoId)
  }

  const handleUploadFoto = async (file: File, descricao?: string) => {
    try {
      await fotoHook.upload(file, descricao)
      showToast.success("Foto enviada com sucesso!")
      if (alunoId) {
        fotoHook.fetchFotos(alunoId)
      }
    } catch (error) {
      if (error instanceof Error) {
        showToast.error(error.message)
      }
      throw error
    }
  }

  const handleUploadArquivo = async (input: {
    file: File
    tipo: TipoArquivoAluno
    titulo: string
    descricao?: string
  }) => {
    if (!alunoId) {
      throw new Error("Aluno não encontrado")
    }

    try {
      await arquivoHook.upload({
        alunoId,
        file: input.file,
        tipo: input.tipo,
        titulo: input.titulo,
        descricao: input.descricao,
      })
      showToast.success("Arquivo enviado com sucesso!")
      arquivoHook.fetchArquivos(alunoId)
    } catch (error) {
      if (error instanceof Error) {
        showToast.error(error.message)
      }
      throw error
    }
  }

  const handleDelete = (id: string, target: DeleteTarget) => {
    setConfirmDelete({ isOpen: true, id, target })
  }

  const confirmDeleteAction = async () => {
    try {
      if (confirmDelete.target === "foto") {
        await fotoHook.deleteFoto(confirmDelete.id)
        showToast.success("Foto excluída com sucesso!")
      } else {
        await arquivoHook.deleteArquivo(confirmDelete.id)
        showToast.success("Arquivo excluído com sucesso!")
      }

      setConfirmDelete({ isOpen: false, id: "", target: "foto" })
    } catch (error) {
      if (error instanceof Error) {
        showToast.error(error.message)
      }
    }
  }

  if (loadingAluno) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[color:var(--student-info)]" />
        <p className="text-[color:var(--student-text-soft)]">Carregando...</p>
      </div>
    )
  }

  if (!aluno) {
    return (
      <Card className="border-2 border-[color:var(--app-danger-border)] bg-[color:var(--student-danger-surface)]">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-[color:var(--student-danger)]" />
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-[color:var(--student-text)]">
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

  const loadError = fotoHook.error || arquivoHook.error

  if (loadError) {
    return (
      <div>
        {!embeddedInStudentContext && (
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => navigate(getBackRoute())}
              className="rounded-lg p-2 transition-colors hover:bg-[color:var(--student-surface-soft)]"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-[color:var(--student-text)]">
              Erro ao carregar dados
            </h1>
          </div>
        )}
        <Card className="border-2 border-[color:var(--app-danger-border)] bg-[color:var(--student-danger-surface)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-[color:var(--student-danger)]" />
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold text-[color:var(--student-text)]">
                Erro ao carregar
              </h3>
              <p className="text-[color:var(--student-text)]">{loadError}</p>
              <div className="mt-4">
                <Button onClick={refreshContent} variant="secondary">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const title = embeddedInStudentContext
    ? "Fotos e Arquivos"
    : isAluno
      ? "Minhas Fotos e Arquivos"
      : `Fotos e Arquivos - ${aluno.user?.nome}`

  return (
    <div data-onboarding-target="onboarding-photos-main">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {!embeddedInStudentContext && (
            <button
              onClick={() => navigate(getBackRoute())}
              className="rounded-lg p-2 transition-colors hover:bg-[color:var(--student-surface-soft)]"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-[color:var(--student-text)]">
              {title}
            </h1>
            <p className="mt-1 text-[color:var(--student-text-soft)]">
              {fotoHook.fotos.length} foto(s) • {arquivoHook.arquivos.length} arquivo(s)
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <ImageIcon className="h-5 w-5" />
            {isAluno ? "Minhas Fotos de Shape" : "Fotos de Shape do Aluno"}
          </h2>
          {podeEnviarFoto && (
            <Button
              icon={Plus}
              onClick={() => setShowModalFoto(true)}
              disabled={fotoHook.loading}
            >
              Enviar Foto
            </Button>
          )}
        </div>

        {fotoHook.loading && fotoHook.fotos.length === 0 ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--student-info)]" />
          </div>
        ) : fotoHook.fotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {fotoHook.fotos.map((foto) => (
              <div
                key={foto.id}
                className="group relative overflow-hidden rounded-lg border-2 border-[color:var(--student-border)] transition-colors hover:border-[color:var(--student-border-strong)]"
              >
                <img
                  src={foto.url}
                  alt={foto.descricao || "Foto de shape"}
                  className="h-48 w-full object-cover"
                />
                {podeDeletarFoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all group-hover:bg-opacity-50">
                    <button
                      onClick={() => handleDelete(foto.id, "foto")}
                      className="rounded-lg bg-[color:var(--student-danger-surface)] p-2 text-[color:var(--student-text)] opacity-0 transition-all hover:bg-[color:var(--app-danger-surface-hover)] group-hover:opacity-100"
                      title="Excluir"
                      aria-label="Excluir foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="bg-[color:var(--student-surface)] p-2">
                  <p className="text-xs text-[color:var(--student-text-soft)]">
                    {formatDateTime(foto.createdAt)}
                  </p>
                  {foto.descricao && (
                    <p className="mt-1 text-sm text-[color:var(--student-text)]">
                      {foto.descricao}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-[color:var(--student-border)] bg-[color:var(--student-surface)] py-12 text-center">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-[color:var(--student-text-muted)]" />
            <h3 className="mb-2 text-lg font-medium text-[color:var(--student-text)]">
              Nenhuma foto disponível
            </h3>
            <p className="mb-4 text-[color:var(--student-text-soft)]">
              {isAluno
                ? "Envie fotos para acompanhar sua evolução física"
                : "O aluno ainda não enviou fotos"}
            </p>
            {podeEnviarFoto && (
              <Button icon={Plus} onClick={() => setShowModalFoto(true)}>
                Enviar Primeira Foto
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <FileText className="h-5 w-5" />
            {isAluno ? "Meus Arquivos" : "Arquivos do Aluno"}
          </h2>
          {podeGerenciarArquivo && (
            <Button
              icon={Plus}
              onClick={() => setShowModalArquivo(true)}
              disabled={arquivoHook.loading}
            >
              Enviar Arquivo
            </Button>
          )}
        </div>

        {arquivoHook.loading && arquivoHook.arquivos.length === 0 ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--student-info)]" />
          </div>
        ) : arquivoHook.arquivos.length > 0 ? (
          <div className="divide-y divide-[color:var(--student-border)] overflow-hidden rounded-lg border border-[color:var(--student-border)]">
            {arquivoHook.arquivos.map((arquivo) => (
              <div
                key={arquivo.id}
                className="flex flex-col gap-4 bg-[color:var(--student-surface)] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--student-surface-soft)] text-[color:var(--student-text-soft)]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[color:var(--student-text)]">
                        {arquivo.titulo}
                      </h3>
                      <span className="rounded-full border border-[color:var(--student-border)] px-2 py-0.5 text-xs text-[color:var(--student-text-soft)]">
                        {tipoArquivoLabel[arquivo.tipo]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--student-text-soft)]">
                      {formatDateTime(arquivo.createdAt)}
                    </p>
                    {arquivo.descricao && (
                      <p className="mt-2 text-sm text-[color:var(--student-text-soft)]">
                        {arquivo.descricao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={arquivo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] px-3 py-2 text-sm font-medium text-[color:var(--student-text)] transition-colors hover:bg-[color:var(--student-surface-soft)]"
                  >
                    <Download className="h-4 w-4" />
                    Abrir
                  </a>
                  {podeGerenciarArquivo && (
                    <button
                      onClick={() => handleDelete(arquivo.id, "arquivo")}
                      className="rounded-lg border border-[color:var(--app-danger-border)] bg-[color:var(--student-danger-surface)] p-2 text-[color:var(--student-danger)] transition-colors hover:bg-[color:var(--app-danger-surface-hover)]"
                      title="Excluir"
                      aria-label="Excluir arquivo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-[color:var(--student-border)] bg-[color:var(--student-surface)] py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-[color:var(--student-text-muted)]" />
            <h3 className="mb-2 text-lg font-medium text-[color:var(--student-text)]">
              Nenhum arquivo disponível
            </h3>
            <p className="mb-4 text-[color:var(--student-text-soft)]">
              {podeGerenciarArquivo
                ? "Envie PDFs de treino ou dieta para este aluno"
                : "Seu professor ainda não enviou arquivos"}
            </p>
            {podeGerenciarArquivo && (
              <Button icon={Plus} onClick={() => setShowModalArquivo(true)}>
                Enviar Primeiro Arquivo
              </Button>
            )}
          </div>
        )}
      </Card>

      <ModalEnviarFoto
        isOpen={showModalFoto}
        onClose={() => setShowModalFoto(false)}
        onSubmit={handleUploadFoto}
        isLoading={fotoHook.loading}
      />

      <ModalEnviarArquivo
        isOpen={showModalArquivo}
        onClose={() => setShowModalArquivo(false)}
        onSubmit={handleUploadArquivo}
        isLoading={arquivoHook.loading}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.target === "foto" ? "Excluir Foto" : "Excluir Arquivo"}
        message={`Deseja realmente excluir este ${
          confirmDelete.target === "foto" ? "item" : "arquivo"
        }?\n\nEsta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() =>
          setConfirmDelete({ isOpen: false, id: "", target: "foto" })
        }
        isLoading={fotoHook.loading || arquivoHook.loading}
      />
    </div>
  )
}
