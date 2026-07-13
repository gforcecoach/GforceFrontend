import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from "axios"
import {
  type User,
  type LoginDTO,
  type LoginResponse,
  type PasswordResetRequestDTO,
  type PasswordResetDTO,
  type RegisterDTO,
  type InviteCode,
  type CreateInviteCodeDTO,
  type LeadLink,
  type CreateLeadLinkDTO,
  type UpdateLeadLinkDTO,
  type TrackLeadClickDTO,
  type LeadLinksListResponse,
  type LeadAnalytics,
  type Professor,
  type CreateProfessorDTO,
  type UpdateProfessorDTO,
  type Aluno,
  type CreateAlunoDTO,
  type UpdateAlunoDTO,
  type UpdateAlunoStatusDTO,
  type ApiError,
  type YoutubeLatestContentResponse,
  type FinanceDashboardResponse,
  type FinanceRenewal,
  type CreateFinanceRenewalDTO,
  type UpdateFinanceRenewalDTO,
  type FinanceEntry,
  type CreateFinanceEntryDTO,
  type UpdateFinanceEntryDTO,
  type FinanceEntryType,
  type FinanceMonthState,
  type ProfessorDashboardResponse,
  type ProfessorFinanceDashboardResponse,
  type LegalDocumentsResponse,
  type AcceptedDocument,
  type PrivacyPreferences,
  type PrivacyPreferencesInput,
  type DataSubjectRequest,
  type DataSubjectRequestType,
  type AdminDataSubjectRequest,
  type ProcessDataSubjectRequestDTO,
  type OnboardingResponse,
  type OnboardingState,
  type ArquivoAluno,
  type TipoArquivoAluno,
} from "../types"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
})

export const AUTH_SESSION_REFRESHED_EVENT = "auth:session-refreshed"
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired"

export interface OptionalNotFoundRequestConfig extends AxiosRequestConfig {
  allowNotFound?: boolean
}

interface RetryableRequestConfig extends OptionalNotFoundRequestConfig {
  _retry?: boolean
}

const shouldLogApiErrors = import.meta.env.DEV

const isFormDataPayload = (data: unknown): data is FormData =>
  typeof FormData !== "undefined" && data instanceof FormData

const removeContentTypeHeader = (headers: AxiosRequestConfig["headers"]) => {
  if (!headers) return

  if (headers instanceof AxiosHeaders) {
    headers.delete("Content-Type")
    return
  }

  const mutableHeaders = headers as Record<string, unknown>
  delete mutableHeaders["Content-Type"]
  delete mutableHeaders["content-type"]
}

const cleanPayload = <T extends object>(data: T): Record<string, unknown> =>
  Object.entries(data as Record<string, unknown>).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, unknown>,
  )

let isRedirecting = false
let accessToken: string | null = null
let authSessionGeneration = 0
let isLogoutInProgress = false

const LOGOUT_IN_PROGRESS_MESSAGE = "Logout em andamento."
const STALE_AUTH_REFRESH_MESSAGE = "Sessao encerrada antes da renovacao."

const isAuthRefreshSuppressedError = (error: unknown) =>
  error instanceof Error &&
  (error.message === LOGOUT_IN_PROGRESS_MESSAGE ||
    error.message === STALE_AUTH_REFRESH_MESSAGE)

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const clearAccessToken = () => {
  authSessionGeneration += 1
  setAccessToken(null)
}

const clearAuth = () => {
  clearAccessToken()
}

const storeAuth = (session: LoginResponse) => {
  if (isLogoutInProgress) return false

  setAccessToken(session.token)
  window.dispatchEvent(
    new CustomEvent<LoginResponse>(AUTH_SESSION_REFRESHED_EVENT, {
      detail: session,
    }),
  )
  return true
}

const notifySessionExpired = () => {
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
}

let refreshSessionPromise: Promise<LoginResponse> | null = null

const refreshSession = async (): Promise<LoginResponse> => {
  if (isLogoutInProgress) {
    return Promise.reject(new Error(LOGOUT_IN_PROGRESS_MESSAGE))
  }

  if (!refreshSessionPromise) {
    const refreshGeneration = authSessionGeneration

    refreshSessionPromise = api
      .post<LoginResponse>("/auth/refresh")
      .then((response) => {
        if (isLogoutInProgress) {
          throw new Error(LOGOUT_IN_PROGRESS_MESSAGE)
        }

        if (refreshGeneration !== authSessionGeneration) {
          throw new Error(STALE_AUTH_REFRESH_MESSAGE)
        }

        return response.data
      })
      .finally(() => {
        refreshSessionPromise = null
      })
  }

  return refreshSessionPromise
}

const redirectToPublicEntry = () => {
  if (isRedirecting) return
  isRedirecting = true

  notifySessionExpired()
  clearAuth()

  const currentPath = window.location.pathname
  if (
    !currentPath.includes("/landing") &&
    !currentPath.includes("/login") &&
    !currentPath.includes("/register")
  ) {
    window.location.href = "/landing"
  }

  setTimeout(() => {
    isRedirecting = false
  }, 1000)
}

api.interceptors.request.use(
  (config) => {
    if (isFormDataPayload(config.data)) {
      removeContentTypeHeader(config.headers)
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    if (shouldLogApiErrors) {
      console.error("Request Error:", error)
    }
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const requestUrl = originalRequest?.url || ""
    const status = error.response?.status
    const isExpectedNotFound = status === 404 && originalRequest?.allowNotFound

    if (error.response && isExpectedNotFound) {
      return {
        ...error.response,
        data: null,
      }
    }

    if (shouldLogApiErrors) {
      console.error("API Error:", {
        status,
        url: requestUrl,
      })
    }

    if (!error.response) {
      return Promise.reject(
        new Error("Servidor não respondeu. Verifique sua conexão."),
      )
    }

    const errorMessage = error.response.data?.error || "Erro desconhecido"
    const isLoginRequest = requestUrl.includes("/auth/login")
    const isRefreshRequest = requestUrl.includes("/auth/refresh")
    const isLogoutRequest = requestUrl.includes("/auth/logout")

    if (status === 401) {
      if (isLoginRequest) {
        return Promise.reject(new Error(errorMessage))
      }

      if (isRefreshRequest) {
        clearAuth()
        return Promise.reject(new Error("Sessão expirada. Faça login novamente."))
      }

      if (originalRequest && !originalRequest._retry && !isRefreshRequest && !isLogoutRequest) {
        originalRequest._retry = true

        try {
          const refreshedSession = await refreshSession()

          if (!storeAuth(refreshedSession)) {
            return Promise.reject(new Error(STALE_AUTH_REFRESH_MESSAGE))
          }

          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${refreshedSession.token}`
          return api(originalRequest)
        } catch (refreshError) {
          if (isAuthRefreshSuppressedError(refreshError)) {
            return Promise.reject(refreshError)
          }

          redirectToPublicEntry()
          return Promise.reject(
            new Error("Sessão expirada. Faça login novamente."),
          )
        }
      }

      redirectToPublicEntry()
      return Promise.reject(new Error("Sessão expirada. Faça login novamente."))
    }

    if (status === 403) {
      return Promise.reject(
        new Error("Você não tem permissão para acessar este recurso"),
      )
    }

    if (status === 451) {
      window.location.href = "/legal/pendente"
      return Promise.reject(new Error(errorMessage))
    }

    if (status === 404) {
      return Promise.reject(new Error("Recurso não encontrado"))
    }

    if (status === 409) {
      const err = new Error(errorMessage) as Error & { status: number }
      err.status = 409
      return Promise.reject(err)
    }

    if (error.response.data?.details) {
      const details = error.response.data.details
        .map((d) => `${d.campo}: ${d.mensagem}`)
        .join(", ")
      return Promise.reject(new Error(`${errorMessage} - ${details}`))
    }

    return Promise.reject(new Error(errorMessage))
  },
)

export const authApi = {
  login: async (data: LoginDTO): Promise<LoginResponse> => {
    try {
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
      }

      const response = await api.post<LoginResponse>(
        "/auth/login",
        normalizedData,
      )
      return response.data
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          throw new Error("Email ou senha incorretos")
        }
        if (error.message.includes("404")) {
          throw new Error("Usuário não encontrado")
        }
        throw error
      }
      throw new Error("Erro ao fazer login")
    }
  },

  register: async (data: RegisterDTO): Promise<void> => {
    try {
      const normalizedData = {
        ...data,
        email: data.email.toLowerCase().trim(),
      }

      await api.post("/auth/register", normalizedData)
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("409") ||
          error.message.includes("já existe")
        ) {
          throw new Error("Este email já está cadastrado")
        }
        if (error.message.includes("código de convite")) {
          throw new Error("Código de convite inválido ou expirado")
        }
        throw error
      }
      throw new Error("Erro ao criar conta")
    }
  },

  requestPasswordReset: async (
    data: PasswordResetRequestDTO,
  ): Promise<void> => {
    try {
      const normalizedData = {
        email: data.email.toLowerCase().trim(),
      }

      await api.post("/auth/forgot-password", normalizedData)
    } catch {
      throw new Error(
        "Não foi possível enviar as instruções agora. Tente novamente.",
      )
    }
  },

  resetPassword: async (data: PasswordResetDTO): Promise<void> => {
    await api.post("/auth/reset-password", {
      token: data.token,
      newPassword: data.newPassword,
    })
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me")
    return response.data
  },

  checkToken: async (): Promise<boolean> => {
    try {
      await api.get("/auth/me")
      return true
    } catch {
      return false
    }
  },

  refresh: async (): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/refresh")
    setAccessToken(response.data.token)
    return response.data
  },

  logout: async (): Promise<void> => {
    isLogoutInProgress = true

    try {
      await api.post("/auth/logout")
      clearAuth()
    } finally {
      refreshSessionPromise = null
      isLogoutInProgress = false
    }
  },
}

export const inviteCodesApi = {
  create: async (data: CreateInviteCodeDTO): Promise<InviteCode> => {
    const response = await api.post<InviteCode>("/auth/invite-codes", data)
    return response.data
  },

  getAll: async (): Promise<InviteCode[]> => {
    const response = await api.get<InviteCode[]>("/auth/invite-codes")
    return response.data
  },
}

export const legalApi = {
  currentDocuments: async (): Promise<LegalDocumentsResponse> => {
    const response = await api.get<LegalDocumentsResponse>(
      "/legal/documents/current",
    )
    return response.data
  },

  accept: async (acceptedDocuments: AcceptedDocument[]): Promise<void> => {
    await api.post("/legal/acceptances", { acceptedDocuments })
  },
}

export const privacyApi = {
  getPreferences: async (): Promise<PrivacyPreferences> => {
    const response = await api.get<PrivacyPreferences>("/privacy/preferences")
    return response.data
  },

  updatePreferences: async (
    data: PrivacyPreferencesInput,
  ): Promise<PrivacyPreferences> => {
    const response = await api.put<PrivacyPreferences>(
      "/privacy/preferences",
      data,
    )
    return response.data
  },

  createRequest: async (
    type: DataSubjectRequestType,
    description?: string,
  ): Promise<DataSubjectRequest> => {
    const response = await api.post<DataSubjectRequest>("/privacy/requests", {
      type,
      description,
    })
    return response.data
  },

  listRequests: async (): Promise<DataSubjectRequest[]> => {
    const response = await api.get<DataSubjectRequest[]>("/privacy/requests")
    return response.data
  },

  exportData: async (): Promise<unknown> => {
    const response = await api.get<unknown>("/privacy/export")
    return response.data
  },

  listAdminRequests: async (): Promise<AdminDataSubjectRequest[]> => {
    const response = await api.get<AdminDataSubjectRequest[]>(
      "/privacy/admin/requests",
    )
    return response.data
  },

  processAdminRequest: async (
    id: string,
    data: ProcessDataSubjectRequestDTO,
  ): Promise<DataSubjectRequest> => {
    const response = await api.patch<DataSubjectRequest>(
      `/privacy/admin/requests/${id}`,
      data,
    )
    return response.data
  },
}

export const onboardingApi = {
  get: async (): Promise<OnboardingResponse> => {
    const response = await api.get<OnboardingResponse>("/onboarding")
    return response.data
  },

  progress: async (currentStepKey: string): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>("/onboarding/progress", {
      currentStepKey,
    })
    return response.data
  },

  complete: async (): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>("/onboarding/complete")
    return response.data
  },

  dismiss: async (): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>("/onboarding/dismiss")
    return response.data
  },

  restart: async (): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>("/onboarding/restart")
    return response.data
  },

  completeChecklistItem: async (key: string): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>(
      "/onboarding/checklist/complete",
      { key },
    )
    return response.data
  },
}

export const leadLinksApi = {
  create: async (data: CreateLeadLinkDTO): Promise<LeadLink> => {
    const response = await api.post<LeadLink>("/lead-links", data)
    return response.data
  },

  getAll: async (range = 30): Promise<LeadLinksListResponse> => {
    const response = await api.get<LeadLinksListResponse>(
      `/lead-links?range=${range}`,
    )
    return response.data
  },

  update: async (id: string, data: UpdateLeadLinkDTO): Promise<LeadLink> => {
    const response = await api.patch<LeadLink>(`/lead-links/${id}`, data)
    return response.data
  },

  getAnalytics: async (range = 30): Promise<LeadAnalytics> => {
    const response = await api.get<LeadAnalytics>(
      `/lead-links/analytics?range=${range}`,
    )
    return response.data
  },

  trackClick: async (
    data: TrackLeadClickDTO,
  ): Promise<{ tracked: boolean }> => {
    const response = await api.post<{ tracked: boolean }>("/lead-links/click", data)
    return response.data
  },
}

export const contentApi = {
  getLatestYoutubeVideo: async (): Promise<YoutubeLatestContentResponse> => {
    const response = await api.get<YoutubeLatestContentResponse>(
      "/content/youtube/latest",
    )
    return response.data
  },
}

export const professoresApi = {
  getAll: async (): Promise<Professor[]> => {
    const response = await api.get<Professor[]>("/professores")
    return response.data
  },

  getById: async (id: string): Promise<Professor> => {
    const response = await api.get<Professor>(`/professores/${id}`)
    return response.data
  },

  create: async (data: CreateProfessorDTO): Promise<Professor> => {
    const response = await api.post<Professor>("/professores", data)
    return response.data
  },

  update: async (id: string, data: UpdateProfessorDTO): Promise<Professor> => {
    const response = await api.put<Professor>(
      `/professores/${id}`,
      cleanPayload(data),
    )
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/professores/${id}`)
  },
}

export interface UploadArquivoAlunoDTO {
  alunoId: string
  tipo: TipoArquivoAluno
  titulo: string
  descricao?: string
  file: File
}

export const arquivosAlunoApi = {
  listByAluno: async (alunoId: string): Promise<ArquivoAluno[]> => {
    const response = await api.get<ArquivoAluno[]>(
      `/arquivos-aluno/aluno/${alunoId}`,
    )
    return response.data
  },

  upload: async (data: UploadArquivoAlunoDTO): Promise<ArquivoAluno> => {
    const formData = new FormData()
    formData.append("alunoId", data.alunoId)
    formData.append("tipo", data.tipo)
    formData.append("titulo", data.titulo)
    if (data.descricao) {
      formData.append("descricao", data.descricao)
    }
    formData.append("file", data.file)

    const response = await api.post<ArquivoAluno>("/arquivos-aluno", formData)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/arquivos-aluno/${id}`)
  },
}

export const alunosApi = {
  getAll: async (): Promise<Aluno[]> => {
    const response = await api.get<Aluno[]>("/alunos")
    return response.data
  },

  getMe: async (): Promise<Aluno> => {
    const response = await api.get<Aluno>("/alunos/me")
    return response.data
  },

  getById: async (id: string): Promise<Aluno> => {
    const response = await api.get<Aluno>(`/alunos/${id}`)
    return response.data
  },

  create: async (data: CreateAlunoDTO): Promise<Aluno> => {
    const response = await api.post<Aluno>("/alunos", cleanPayload(data))
    return response.data
  },

  update: async (id: string, data: UpdateAlunoDTO): Promise<Aluno> => {
    const cleanData = cleanPayload(data)

    if (Object.keys(cleanData).length === 0) {
      throw new Error("Nenhum campo foi enviado para atualização")
    }

    const response = await api.put<Aluno>(`/alunos/${id}`, cleanData)
    return response.data
  },

  updateStatus: async (
    id: string,
    data: UpdateAlunoStatusDTO,
  ): Promise<Aluno> => {
    const response = await api.patch<Aluno>(`/alunos/${id}/status`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/alunos/${id}`)
  },
}

export const financeApi = {
  getDashboard: async (
    from?: string,
    to?: string,
  ): Promise<FinanceDashboardResponse> => {
    const params = new URLSearchParams()

    if (from) {
      params.set("from", from)
    }
    if (to) {
      params.set("to", to)
    }

    const query = params.toString()
    const path = query ? `/finance/dashboard?${query}` : "/finance/dashboard"
    const response = await api.get<FinanceDashboardResponse>(path)
    return response.data
  },

  getRenewals: async (month: string): Promise<FinanceRenewal[]> => {
    const response = await api.get<FinanceRenewal[]>(
      `/finance/renewals?month=${month}`,
    )
    return response.data
  },

  createRenewal: async (data: CreateFinanceRenewalDTO): Promise<FinanceRenewal> => {
    const response = await api.post<FinanceRenewal>("/finance/renewals", data)
    return response.data
  },

  updateRenewal: async (
    id: string,
    data: UpdateFinanceRenewalDTO,
  ): Promise<FinanceRenewal> => {
    const response = await api.patch<FinanceRenewal>(`/finance/renewals/${id}`, data)
    return response.data
  },

  deleteRenewal: async (id: string): Promise<void> => {
    await api.delete(`/finance/renewals/${id}`)
  },

  getEntries: async (month: string, type?: FinanceEntryType): Promise<FinanceEntry[]> => {
    const path = type
      ? `/finance/entries?month=${month}&type=${type}`
      : `/finance/entries?month=${month}`
    const response = await api.get<FinanceEntry[]>(path)
    return response.data
  },

  createEntry: async (data: CreateFinanceEntryDTO): Promise<FinanceEntry> => {
    const response = await api.post<FinanceEntry>("/finance/entries", data)
    return response.data
  },

  updateEntry: async (id: string, data: UpdateFinanceEntryDTO): Promise<FinanceEntry> => {
    const response = await api.patch<FinanceEntry>(`/finance/entries/${id}`, data)
    return response.data
  },

  deleteEntry: async (id: string): Promise<void> => {
    await api.delete(`/finance/entries/${id}`)
  },

  closeMonth: async (month: string): Promise<FinanceMonthState> => {
    const response = await api.patch<FinanceMonthState>(`/finance/months/${month}/close`)
    return response.data
  },

  reopenMonth: async (month: string): Promise<FinanceMonthState> => {
    const response = await api.patch<FinanceMonthState>(`/finance/months/${month}/reopen`)
    return response.data
  },
}

export const professorOperationsApi = {
  getDashboard: async (): Promise<ProfessorDashboardResponse> => {
    const response = await api.get<ProfessorDashboardResponse>(
      "/professor/dashboard",
    )
    return response.data
  },

  getFinanceDashboard: async (
    from?: string,
    to?: string,
  ): Promise<ProfessorFinanceDashboardResponse> => {
    const params = new URLSearchParams()

    if (from) params.set("from", from)
    if (to) params.set("to", to)

    const query = params.toString()
    const path = query
      ? `/professor/finance/dashboard?${query}`
      : "/professor/finance/dashboard"
    const response = await api.get<ProfessorFinanceDashboardResponse>(path)
    return response.data
  },
}

export default api
