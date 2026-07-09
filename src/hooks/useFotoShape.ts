import { useState } from "react"
import { api } from "../services/api"

interface FotoShape {
  id: string
  alunoId: string
  url: string
  publicId: string
  descricao: string | null
  createdAt: string
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

export function useFotoShape() {
  const [fotos, setFotos] = useState<FotoShape[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File, descricao?: string) => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (descricao) formData.append("descricao", descricao)

      const { data } = await api.post<FotoShape>("/fotos-shape", formData)

      setFotos((prev) => [data, ...prev])
      return data
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao enviar foto")
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFotos = async (alunoId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get<FotoShape[]>(
        `/fotos-shape/aluno/${alunoId}`,
      )
      setFotos(data)
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao carregar fotos")
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteFoto = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await api.delete(`/fotos-shape/${id}`)
      setFotos((prev) => prev.filter((foto) => foto.id !== id))
    } catch (err) {
      const message = getErrorMessage(err, "Erro ao excluir foto")
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return { fotos, loading, error, upload, fetchFotos, deleteFoto }
}
