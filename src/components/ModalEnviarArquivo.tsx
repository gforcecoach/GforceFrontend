import React, { useState } from "react"
import { FileText, Upload, X } from "lucide-react"
import { Button, Input, Select, Textarea } from "./ui"
import type { TipoArquivoAluno } from "../types"

interface ModalEnviarArquivoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: {
    file: File
    tipo: TipoArquivoAluno
    titulo: string
    descricao?: string
  }) => Promise<void>
  isLoading?: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

const validateFile = (file: File): string | null => {
  if (file.type !== "application/pdf") {
    return "Envie um arquivo PDF"
  }

  if (file.size > MAX_FILE_SIZE) {
    return "O arquivo deve ter no máximo 5MB"
  }

  return null
}

export const ModalEnviarArquivo: React.FC<ModalEnviarArquivoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState<TipoArquivoAluno>("TREINO")
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }

    setError(null)
    setFile(selectedFile)
    if (!titulo.trim()) {
      setTitulo(selectedFile.name.replace(/\.pdf$/i, ""))
    }
  }

  const handleSubmit = async () => {
    const normalizedTitle = titulo.trim()

    if (!file) {
      setError("Selecione um PDF")
      return
    }

    if (!normalizedTitle) {
      setError("Informe um título")
      return
    }

    setError(null)
    try {
      await onSubmit({
        file,
        tipo,
        titulo: normalizedTitle,
        descricao: descricao.trim() || undefined,
      })
      handleClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível enviar o arquivo",
      )
    }
  }

  const handleClose = () => {
    setFile(null)
    setTipo("TREINO")
    setTitulo("")
    setDescricao("")
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] shadow-[var(--student-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--student-border)] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[color:var(--student-text)]">
            <FileText className="h-5 w-5" />
            Novo Arquivo
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Fechar envio de arquivo"
            title="Fechar"
            className="rounded-lg p-2 text-[color:var(--student-text-muted)] transition-colors hover:bg-[color:var(--student-surface)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              file
                ? "border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)]"
                : "border-[color:var(--student-border)] hover:border-[color:var(--student-border-strong)] hover:bg-[color:var(--student-surface)]"
            }`}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />

            {file ? (
              <div className="text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-[color:var(--student-text-soft)]" />
                <p className="text-sm font-medium text-[color:var(--student-text)]">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-[color:var(--student-text-muted)]">
                  Clique para trocar
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto mb-3 h-12 w-12 text-[color:var(--student-text-muted)]" />
                <p className="mb-1 font-medium text-[color:var(--student-text-soft)]">
                  Arraste aqui ou clique
                </p>
                <p className="text-sm text-[color:var(--student-text-muted)]">
                  PDF • Máximo 5MB
                </p>
              </div>
            )}
          </label>

          {error && (
            <p
              role="alert"
              className="text-sm text-[color:var(--student-danger)]"
            >
              {error}
            </p>
          )}

          <Select
            label="Tipo"
            value={tipo}
            onChange={(event) => setTipo(event.target.value as TipoArquivoAluno)}
            disabled={isLoading}
          >
            <option value="TREINO">Treino</option>
            <option value="DIETA">Dieta</option>
          </Select>

          <Input
            label="Título"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            maxLength={120}
            disabled={isLoading}
          />

          <Textarea
            label="Descrição (opcional)"
            rows={3}
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            maxLength={500}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 border-t border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-6">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            isLoading={isLoading}
            className="flex-1"
          >
            {isLoading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
