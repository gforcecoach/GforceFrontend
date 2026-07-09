import { useState } from "react"
import { arquivosAlunoApi, type UploadArquivoAlunoDTO } from "../services/api"
import type { ArquivoAluno } from "../types"

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

export function useArquivosAluno() {
  const [arquivos, setArquivos] = useState<ArquivoAluno[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchArquivos = async (alunoId: string) => {
    setLoading(true)
    setError(null)

    try {
      const data = await arquivosAlunoApi.listByAluno(alunoId)
      setArquivos(data)
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao carregar arquivos")
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const upload = async (input: UploadArquivoAlunoDTO) => {
    setLoading(true)
    setError(null)

    try {
      const data = await arquivosAlunoApi.upload(input)
      setArquivos((prev) => [data, ...prev])
      return data
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao enviar arquivo")
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteArquivo = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await arquivosAlunoApi.delete(id)
      setArquivos((prev) => prev.filter((arquivo) => arquivo.id !== id))
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao excluir arquivo")
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return { arquivos, loading, error, upload, fetchArquivos, deleteArquivo }
}
