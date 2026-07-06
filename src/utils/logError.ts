/**
 * Logging de erro sanitizado.
 *
 * Evita despejar o objeto de erro completo (e respostas Axios contendo PII,
 * headers ou tokens) no console. Loga apenas o contexto, uma mensagem genérica
 * e, quando disponível, o status HTTP da resposta.
 */
export function logError(context: string, error: unknown): void {
  let status: number | undefined
  let message = "Erro inesperado"

  if (error && typeof error === "object") {
    const maybeAxios = error as {
      response?: { status?: number }
      message?: string
    }
    status = maybeAxios.response?.status
    if (typeof maybeAxios.message === "string") {
      message = maybeAxios.message
    }
  }

  if (status !== undefined) {
    console.error(`[${context}] status=${status} message=${message}`)
  } else {
    console.error(`[${context}] message=${message}`)
  }
}
