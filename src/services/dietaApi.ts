import { api, type OptionalNotFoundRequestConfig } from "./api"
import type {
  AlimentoDieta,
  AlimentoExterno,
  CreateAlimentoDietaDTO,
  DietaCheckin,
  DietaRecomendacao,
  FinalizeDietaCheckinDTO,
  ImportAlimentoExternoDTO,
  ObjetivoDieta,
  StartDietaCheckinDTO,
  UpdateDietaRefeicaoCheckinDTO,
  UpsertPlanoDietaDTO,
  PlanoDieta,
} from "../types"

interface ListAlimentosParams {
  q?: string
}

interface SearchExternalParams {
  q: string
  source?: "USDA" | "TACO" | "ALL"
  limit?: number
}

export const dietaAlimentosApi = {
  list: async (params?: ListAlimentosParams): Promise<AlimentoDieta[]> => {
    const response = await api.get<AlimentoDieta[]>("/dietas/alimentos", { params })
    return response.data
  },

  searchExternal: async (params: SearchExternalParams): Promise<AlimentoExterno[]> => {
    const response = await api.get<AlimentoExterno[]>("/dietas/alimentos/externos", {
      params,
    })
    return response.data
  },

  importExternal: async (data: ImportAlimentoExternoDTO): Promise<AlimentoDieta> => {
    const response = await api.post<AlimentoDieta>("/dietas/alimentos/importar", data)
    return response.data
  },

  create: async (data: CreateAlimentoDietaDTO): Promise<AlimentoDieta> => {
    const response = await api.post<AlimentoDieta>("/dietas/alimentos", data)
    return response.data
  },
}

export const dietaApi = {
  upsertPlano: async (data: UpsertPlanoDietaDTO): Promise<PlanoDieta> => {
    const response = await api.post<PlanoDieta>("/dietas/plano", data)
    return response.data
  },

  getPlanoAtivo: async (alunoId: string): Promise<PlanoDieta | null> => {
    const response = await api.get<PlanoDieta | null>(
      `/dietas/aluno/${alunoId}/ativo`,
      { allowNotFound: true } as OptionalNotFoundRequestConfig,
    )
    return response.data
  },

  getRecomendacao: async (
    alunoId: string,
    params?: { objetivo?: ObjetivoDieta; fatorAtividade?: number },
  ): Promise<DietaRecomendacao | null> => {
    const response = await api.get<DietaRecomendacao | null>(
      `/dietas/aluno/${alunoId}/recomendacao`,
      { params, allowNotFound: true } as OptionalNotFoundRequestConfig,
    )
    return response.data
  },

  listCheckins: async (alunoId: string, limit = 40): Promise<DietaCheckin[]> => {
    const response = await api.get<DietaCheckin[]>(`/dietas/aluno/${alunoId}/checkins`, {
      params: { limit },
    })
    return response.data
  },

  startCheckin: async (data: StartDietaCheckinDTO): Promise<DietaCheckin> => {
    const response = await api.post<DietaCheckin>("/dietas/checkins/start", data)
    return response.data
  },

  updateRefeicaoCheckin: async (
    checkinId: string,
    dietaRefeicaoId: string,
    data: UpdateDietaRefeicaoCheckinDTO,
  ) => {
    const response = await api.patch(
      `/dietas/checkins/${checkinId}/refeicoes/${dietaRefeicaoId}`,
      data,
    )
    return response.data
  },

  finalizeCheckin: async (
    checkinId: string,
    data: FinalizeDietaCheckinDTO,
  ): Promise<DietaCheckin> => {
    const response = await api.patch<DietaCheckin>(
      `/dietas/checkins/${checkinId}/finalizar`,
      data,
    )
    return response.data
  },

  comentarProfessor: async (
    checkinId: string,
    data: { comentarioProfessor: string },
  ): Promise<DietaCheckin> => {
    const response = await api.patch<DietaCheckin>(
      `/dietas/checkins/${checkinId}/comentario-professor`,
      data,
    )
    return response.data
  },
}
