import React, { useState } from "react"
import { X, Upload, Image as ImageIcon } from "lucide-react"
import { Button, Textarea } from "./ui"
import { validarFoto } from "../utils/validacaoUpload"
import { logError } from "../utils/logError"

interface ModalEnviarFotoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (file: File, descricao?: string) => Promise<void>
  isLoading?: boolean
}

export const ModalEnviarFoto: React.FC<ModalEnviarFotoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [descricao, setDescricao] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const erro = validarFoto(selectedFile)
    if (erro) {
      setError(erro)
      setFile(null)
      setPreview(null)
      return
    }

    setError(null)
    setFile(selectedFile)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleSubmit = async () => {
    if (!file) {
      setError("Selecione uma foto")
      return
    }

    try {
      await onSubmit(file, descricao.trim() || undefined)
      handleClose()
    } catch (error) {
      logError("ModalEnviarFoto.handleSubmit", error)
    }
  }

  const handleClose = () => {
    setFile(null)
    setDescricao("")
    setPreview(null)
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--student-border)] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[color:var(--student-text)]">
            <ImageIcon className="h-5 w-5" />
            Nova Foto de Shape
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-[color:var(--student-text-muted)] transition-colors hover:bg-[color:var(--student-surface)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
                preview
                  ? "border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)]"
                  : "border-[color:var(--student-border)] hover:border-[color:var(--student-border-strong)] hover:bg-[color:var(--student-surface)]"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />

              {preview ? (
                <div className="text-center">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 rounded-lg mb-3"
                  />
                  <p className="text-sm text-[color:var(--student-text-soft)]">{file?.name}</p>
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
                    JPG, PNG, WebP • Máximo 2MB
                  </p>
                </div>
              )}
            </label>

            {error && (
              <p className="mt-2 flex items-center gap-1 text-sm text-[color:var(--student-danger)]">
                ⚠️ {error}
              </p>
            )}
          </div>

          <Textarea
            label="Descrição (opcional)"
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Frente - Semana 1"
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
