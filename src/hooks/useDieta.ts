import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "react-query"
import { dietaAlimentosApi, dietaApi } from "../services/dietaApi"
import type {
  AlimentoDieta,
  AlimentoExterno,
  CreateAlimentoDietaDTO,
  DietaCheckin,
  DietaRecomendacao,
  ImportAlimentoExternoDTO,
  ObjetivoDieta,
  PlanoDieta,
  UpdateDietaRefeicaoCheckinDTO,
  UpsertPlanoDietaDTO,
} from "../types"
import { showToast } from "../utils/toast"

export const useDietaAlimentos = (q?: string): UseQueryResult<AlimentoDieta[], Error> => {
  return useQuery<AlimentoDieta[], Error>(
    ["dieta-alimentos", q],
    () => dietaAlimentosApi.list({ q: q?.trim() || undefined }),
    {
      staleTime: 30000,
      cacheTime: 300000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  )
}

export const useDietaAlimentosExternos = ({
  q,
  source = "ALL",
  limit = 20,
  enabled = true,
}: {
  q: string
  source?: "USDA" | "TACO" | "ALL"
  limit?: number
  enabled?: boolean
}): UseQueryResult<AlimentoExterno[], Error> => {
  const trimmed = q.trim()
  return useQuery<AlimentoExterno[], Error>(
    ["dieta-alimentos-externos", trimmed, source, limit],
    () =>
      dietaAlimentosApi.searchExternal({
        q: trimmed,
        source,
        limit,
      }),
    {
      enabled: enabled && trimmed.length >= 2,
      staleTime: 60000,
      cacheTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useImportAlimentoExterno = (): UseMutationResult<
  AlimentoDieta,
  Error,
  ImportAlimentoExternoDTO
> => {
  const queryClient = useQueryClient()

  return useMutation<AlimentoDieta, Error, ImportAlimentoExternoDTO>(
    (data) => dietaAlimentosApi.importExternal(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("dieta-alimentos")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao importar alimento")
      },
    },
  )
}

export const useCreateAlimentoDieta = (): UseMutationResult<
  AlimentoDieta,
  Error,
  CreateAlimentoDietaDTO
> => {
  const queryClient = useQueryClient()

  return useMutation<AlimentoDieta, Error, CreateAlimentoDietaDTO>(
    (data) => dietaAlimentosApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("dieta-alimentos")
        showToast.success("Alimento criado com sucesso!")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao criar alimento")
      },
    },
  )
}

export const usePlanoDietaAtivo = (
  alunoId: string,
  enabled = true,
): UseQueryResult<PlanoDieta | null, Error> => {
  return useQuery<PlanoDieta | null, Error>(
    ["plano-dieta-ativo", alunoId],
    () => dietaApi.getPlanoAtivo(alunoId),
    {
      enabled: enabled && !!alunoId,
      staleTime: 15000,
      cacheTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useDietaRecomendacao = (
  alunoId: string,
  objetivo?: ObjetivoDieta,
  fatorAtividade?: number,
  enabled = true,
): UseQueryResult<DietaRecomendacao | null, Error> => {
  return useQuery<DietaRecomendacao | null, Error>(
    ["dieta-recomendacao", alunoId, objetivo, fatorAtividade],
    () => dietaApi.getRecomendacao(alunoId, { objetivo, fatorAtividade }),
    {
      enabled: enabled && !!alunoId,
      staleTime: 30000,
      cacheTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useUpsertPlanoDieta = (): UseMutationResult<
  PlanoDieta,
  Error,
  UpsertPlanoDietaDTO
> => {
  const queryClient = useQueryClient()

  return useMutation<PlanoDieta, Error, UpsertPlanoDietaDTO>(
    (data) => dietaApi.upsertPlano(data),
    {
      onSuccess: (plano) => {
        queryClient.invalidateQueries(["plano-dieta-ativo", plano.alunoId])
        queryClient.invalidateQueries(["dieta-checkins", plano.alunoId])
        queryClient.invalidateQueries(["dieta-recomendacao", plano.alunoId])
        showToast.success("Plano de dieta salvo com sucesso!")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao salvar plano de dieta")
      },
    },
  )
}

export const useDietaCheckins = (
  alunoId: string,
  limit = 40,
  enabled = true,
): UseQueryResult<DietaCheckin[], Error> => {
  return useQuery<DietaCheckin[], Error>(
    ["dieta-checkins", alunoId, limit],
    () => dietaApi.listCheckins(alunoId, limit),
    {
      enabled: enabled && !!alunoId,
      staleTime: 15000,
      cacheTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useStartDietaCheckin = (): UseMutationResult<
  DietaCheckin,
  Error,
  { dietaDiaId: string; alunoId: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<DietaCheckin, Error, { dietaDiaId: string; alunoId: string }>(
    ({ dietaDiaId }) => dietaApi.startCheckin({ dietaDiaId }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(["dieta-checkins", variables.alunoId])
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao iniciar check-in da dieta")
      },
    },
  )
}

export const useUpdateDietaRefeicaoCheckin = (): UseMutationResult<
  unknown,
  Error,
  {
    checkinId: string
    dietaRefeicaoId: string
    data: UpdateDietaRefeicaoCheckinDTO
    alunoId: string
  }
> => {
  const queryClient = useQueryClient()

  return useMutation<
    unknown,
    Error,
    {
      checkinId: string
      dietaRefeicaoId: string
      data: UpdateDietaRefeicaoCheckinDTO
      alunoId: string
    }
  >(
    ({ checkinId, dietaRefeicaoId, data }) =>
      dietaApi.updateRefeicaoCheckin(checkinId, dietaRefeicaoId, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(["dieta-checkins", variables.alunoId])
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao atualizar refeição")
      },
    },
  )
}

export const useFinalizeDietaCheckin = (): UseMutationResult<
  DietaCheckin,
  Error,
  { checkinId: string; alunoId: string; observacaoDia?: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<
    DietaCheckin,
    Error,
    { checkinId: string; alunoId: string; observacaoDia?: string }
  >(
    ({ checkinId, observacaoDia }) => dietaApi.finalizeCheckin(checkinId, { observacaoDia }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(["dieta-checkins", variables.alunoId])
        showToast.success("Dia de dieta finalizado!")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao finalizar dia da dieta")
      },
    },
  )
}

export const useComentarDietaCheckinProfessor = (): UseMutationResult<
  DietaCheckin,
  Error,
  { checkinId: string; alunoId: string; comentarioProfessor: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<
    DietaCheckin,
    Error,
    { checkinId: string; alunoId: string; comentarioProfessor: string }
  >(
    ({ checkinId, comentarioProfessor }) =>
      dietaApi.comentarProfessor(checkinId, { comentarioProfessor }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(["dieta-checkins", variables.alunoId])
        showToast.success("Comentário enviado para o aluno")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao comentar check-in da dieta")
      },
    },
  )
}
