import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "react-query"
import { exerciciosApi, treinoApi } from "../services/treinoApi"
import type {
  ComentarProfessorCheckinDTO,
  CreateExercicioDTO,
  Exercicio,
  ExercicioExterno,
  ExercicioMediaKind,
  GrupamentoMuscular,
  ImportExercicioExternoDTO,
  PlanoTreino,
  ProgressSerieTreino,
  TreinoCheckin,
  UpdateExercicioCheckinDTO,
  UpsertPlanoTreinoDTO,
} from "../types"
import { showToast } from "../utils/toast"

interface UseExerciciosOptions {
  q?: string
  grupamento?: GrupamentoMuscular
}

interface UseExerciciosExternosOptions {
  q?: string
  limit?: number
  enabled?: boolean
}

interface UpdateTreinoExercicioVariables {
  checkinId: string
  treinoDiaExercicioId: string
  data: UpdateExercicioCheckinDTO
}

interface ComentarProfessorVariables {
  checkinId: string
  data: ComentarProfessorCheckinDTO
}

export const useExercicios = (
  options?: UseExerciciosOptions,
): UseQueryResult<Exercicio[], Error> => {
  return useQuery<Exercicio[], Error>(
    ["exercicios", options],
    () => exerciciosApi.list(options),
    {
      staleTime: 30000,
      cacheTime: 300000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  )
}

export const useGrupamentosExercicios = (): UseQueryResult<
  GrupamentoMuscular[],
  Error
> => {
  return useQuery<GrupamentoMuscular[], Error>(
    "grupamentos-exercicios",
    exerciciosApi.listGrupamentos,
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  )
}

export const useExerciciosExternos = (
  options?: UseExerciciosExternosOptions,
): UseQueryResult<ExercicioExterno[], Error> => {
  const enabledByQuery = !!options?.q?.trim()
  return useQuery<ExercicioExterno[], Error>(
    ["exercicios-externos", options],
    () =>
      exerciciosApi.searchExternal({
        q: options?.q?.trim() || undefined,
        limit: options?.limit ?? 20,
      }),
    {
      enabled: (options?.enabled ?? true) && enabledByQuery,
      staleTime: 60000,
      cacheTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useCreateExercicio = (): UseMutationResult<
  Exercicio,
  Error,
  CreateExercicioDTO
> => {
  const queryClient = useQueryClient()

  return useMutation<Exercicio, Error, CreateExercicioDTO>(
    (data) => exerciciosApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("exercicios")
        showToast.success("Exercício criado com sucesso!")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao criar exercício")
      },
    },
  )
}

export const useImportExercicioExterno = (): UseMutationResult<
  Exercicio,
  Error,
  ImportExercicioExternoDTO
> => {
  const queryClient = useQueryClient()

  return useMutation<Exercicio, Error, ImportExercicioExternoDTO>(
    (data) => exerciciosApi.importExternal(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("exercicios")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao importar exercício")
      },
    },
  )
}

export const useUploadExercicioMedia = (): UseMutationResult<
  Exercicio,
  Error,
  { exercicioId: string; kind: ExercicioMediaKind; file: File }
> => {
  const queryClient = useQueryClient()

  return useMutation<Exercicio, Error, { exercicioId: string; kind: ExercicioMediaKind; file: File }>(
    ({ exercicioId, kind, file }) => exerciciosApi.uploadMedia(exercicioId, kind, file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("exercicios")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao enviar mídia do exercício")
      },
    },
  )
}

export const useClearExercicioMedia = (): UseMutationResult<
  Exercicio,
  Error,
  { exercicioId: string; kind: ExercicioMediaKind }
> => {
  const queryClient = useQueryClient()

  return useMutation<Exercicio, Error, { exercicioId: string; kind: ExercicioMediaKind }>(
    ({ exercicioId, kind }) => exerciciosApi.clearMedia(exercicioId, kind),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("exercicios")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao limpar mídia do exercício")
      },
    },
  )
}

export const usePlanoTreinoAtivo = (
  alunoId: string,
  enabled = true,
): UseQueryResult<PlanoTreino | null, Error> => {
  return useQuery<PlanoTreino | null, Error>(
    ["plano-treino-ativo", alunoId],
    () => treinoApi.getPlanoAtivo(alunoId),
    {
      enabled: enabled && !!alunoId,
      staleTime: 15000,
      cacheTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useUpsertPlanoTreino = (): UseMutationResult<
  PlanoTreino,
  Error,
  UpsertPlanoTreinoDTO
> => {
  const queryClient = useQueryClient()

  return useMutation<PlanoTreino, Error, UpsertPlanoTreinoDTO>(
    (data) => treinoApi.upsertPlano(data),
    {
      onSuccess: (plano) => {
        queryClient.invalidateQueries(["plano-treino-ativo", plano.alunoId])
        queryClient.invalidateQueries(["treino-checkins", plano.alunoId])
        queryClient.invalidateQueries(["treino-timeline", plano.alunoId])
        queryClient.invalidateQueries(["treino-progress", plano.alunoId])
        showToast.success("Plano de treino salvo com sucesso!")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao salvar plano de treino")
      },
    },
  )
}

export const useTreinoCheckins = (
  alunoId: string,
  limit = 50,
  enabled = true,
): UseQueryResult<TreinoCheckin[], Error> => {
  return useQuery<TreinoCheckin[], Error>(
    ["treino-checkins", alunoId, limit],
    () => treinoApi.listCheckins(alunoId, limit),
    {
      enabled: enabled && !!alunoId,
      staleTime: 15000,
      cacheTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useTreinoTimeline = (
  alunoId: string,
  limit = 80,
  enabled = true,
) => {
  return useQuery(
    ["treino-timeline", alunoId, limit],
    () => treinoApi.timeline(alunoId, limit),
    {
      enabled: enabled && !!alunoId,
      staleTime: 10000,
      cacheTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useTreinoProgress = (
  alunoId: string,
  exercicioId?: string,
  enabled = true,
): UseQueryResult<ProgressSerieTreino[], Error> => {
  return useQuery<ProgressSerieTreino[], Error>(
    ["treino-progress", alunoId, exercicioId],
    () => treinoApi.progresso(alunoId, exercicioId),
    {
      enabled: enabled && !!alunoId,
      staleTime: 15000,
      cacheTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  )
}

export const useStartTreinoCheckin = (): UseMutationResult<
  TreinoCheckin,
  Error,
  { treinoDiaId: string; alunoId: string; force?: boolean }
> => {
  const queryClient = useQueryClient()

  return useMutation<TreinoCheckin, Error, { treinoDiaId: string; alunoId: string; force?: boolean }>(
    ({ treinoDiaId, force }) => treinoApi.startCheckin({ treinoDiaId, force }),
    {
      onSuccess: (checkin, variables) => {
        queryClient.invalidateQueries(["treino-checkins", variables.alunoId])
        queryClient.invalidateQueries(["treino-timeline", variables.alunoId])
        queryClient.setQueryData(["checkin-ativo", variables.alunoId], checkin)
      },
      onError: (error: Error & { status?: number }) => {
        if (error.status === 409) return
        showToast.error(error.message || "Erro ao iniciar check-in")
      },
    },
  )
}

export const useUpdateTreinoExercicioCheckin = (): UseMutationResult<
  TreinoCheckin["exercicios"][number],
  Error,
  UpdateTreinoExercicioVariables
> => {
  const queryClient = useQueryClient()

  return useMutation<
    TreinoCheckin["exercicios"][number],
    Error,
    UpdateTreinoExercicioVariables
  >(
    ({ checkinId, treinoDiaExercicioId, data }) =>
      treinoApi.updateExercicioCheckin(checkinId, treinoDiaExercicioId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("treino-checkins")
        queryClient.invalidateQueries("treino-timeline")
        queryClient.invalidateQueries("treino-progress")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao atualizar exercício")
      },
    },
  )
}

export const useFinalizeTreinoCheckin = (): UseMutationResult<
  TreinoCheckin,
  Error,
  { checkinId: string; alunoId: string; comentarioAluno?: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<
    TreinoCheckin,
    Error,
    { checkinId: string; alunoId: string; comentarioAluno?: string }
  >(
    ({ checkinId, comentarioAluno }) =>
      treinoApi.finalizeCheckin(checkinId, { comentarioAluno }),
    {
      onSuccess: (finalizado, variables) => {
        queryClient.setQueriesData<TreinoCheckin[]>(
          ["treino-checkins", variables.alunoId],
          (old) => old?.map((c) => (c.id === finalizado.id ? finalizado : c)) ?? [],
        )
        queryClient.invalidateQueries(["treino-checkins", variables.alunoId], { refetchActive: false })
        queryClient.invalidateQueries(["treino-timeline", variables.alunoId])
        queryClient.invalidateQueries(["treino-progress", variables.alunoId])
        showToast.success("Treino finalizado com sucesso!")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao finalizar treino")
      },
    },
  )
}

export const useComentarCheckinProfessor = (): UseMutationResult<
  TreinoCheckin,
  Error,
  ComentarProfessorVariables
> => {
  const queryClient = useQueryClient()

  return useMutation<TreinoCheckin, Error, ComentarProfessorVariables>(
    ({ checkinId, data }) => treinoApi.comentarProfessor(checkinId, data),
    {
      onSuccess: (checkin) => {
        queryClient.invalidateQueries(["treino-checkins", checkin.alunoId])
        queryClient.invalidateQueries(["treino-timeline", checkin.alunoId])
        showToast.success("Comentário enviado para o check-in")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao comentar check-in")
      },
    },
  )
}
