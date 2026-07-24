import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "react-query"
import { financeApi } from "../services/api"
import {
  type CreateFinanceEntryDTO,
  type CreateFinanceRenewalDTO,
  type FinanceDashboardResponse,
  type FinanceEntry,
  type FinanceEntryType,
  type FinanceMonthState,
  type FinanceRenewal,
  type UpdateFinanceEntryDTO,
  type UpdateFinanceRenewalDTO,
} from "../types"
import { showToast } from "../utils/toast"

const financeDashboardKey = (from?: string, to?: string) => ["financeDashboard", from ?? "", to ?? ""]
const financeRenewalsKey = (month: string) => ["financeRenewals", month]
const financeEntriesKey = (month: string, type?: FinanceEntryType) => ["financeEntries", month, type ?? "ALL"]

export const useFinanceDashboard = (
  from?: string,
  to?: string,
): UseQueryResult<FinanceDashboardResponse, Error> => {
  return useQuery<FinanceDashboardResponse, Error>(
    financeDashboardKey(from, to),
    () => financeApi.getDashboard(from, to),
    {
      staleTime: 30_000,
      cacheTime: 300_000,
      retry: 2,
    },
  )
}

export const useFinanceRenewals = (
  month: string,
): UseQueryResult<FinanceRenewal[], Error> => {
  return useQuery<FinanceRenewal[], Error>(
    financeRenewalsKey(month),
    () => financeApi.getRenewals(month),
    {
      enabled: Boolean(month),
      staleTime: 30_000,
      cacheTime: 300_000,
      retry: 2,
    },
  )
}

export const useFinanceEntries = (
  month: string,
  type?: FinanceEntryType,
): UseQueryResult<FinanceEntry[], Error> => {
  return useQuery<FinanceEntry[], Error>(
    financeEntriesKey(month, type),
    () => financeApi.getEntries(month, type),
    {
      enabled: Boolean(month),
      staleTime: 30_000,
      cacheTime: 300_000,
      retry: 2,
    },
  )
}

export const useCreateFinanceRenewal = (): UseMutationResult<
  FinanceRenewal,
  Error,
  CreateFinanceRenewalDTO
> => {
  const queryClient = useQueryClient()

  return useMutation<FinanceRenewal, Error, CreateFinanceRenewalDTO>(
    (data) => financeApi.createRenewal(data),
    {
      onSuccess: (created) => {
        queryClient.invalidateQueries("financeDashboard")
        queryClient.invalidateQueries("professorFinanceDashboard")
        queryClient.invalidateQueries(["financeRenewals", created.month])
        showToast.success("Renovação registrada com sucesso")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao registrar renovação")
      },
    },
  )
}

export const useUpdateFinanceRenewal = (): UseMutationResult<
  FinanceRenewal,
  Error,
  { id: string; data: UpdateFinanceRenewalDTO }
> => {
  const queryClient = useQueryClient()

  return useMutation<
    FinanceRenewal,
    Error,
    { id: string; data: UpdateFinanceRenewalDTO }
  >(({ id, data }) => financeApi.updateRenewal(id, data), {
    onSuccess: (updated) => {
      queryClient.invalidateQueries("financeDashboard")
      queryClient.invalidateQueries("professorFinanceDashboard")
      queryClient.invalidateQueries(["financeRenewals", updated.month])
      showToast.success("Renovação atualizada")
    },
    onError: (error) => {
      showToast.error(error.message || "Erro ao atualizar renovação")
    },
  })
}

export const useDeleteFinanceRenewal = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>((id) => financeApi.deleteRenewal(id), {
    onSuccess: () => {
      queryClient.invalidateQueries("financeDashboard")
      queryClient.invalidateQueries("professorFinanceDashboard")
      queryClient.invalidateQueries("financeRenewals")
      showToast.success("Renovação removida")
    },
    onError: (error) => {
      showToast.error(error.message || "Erro ao remover renovação")
    },
  })
}

export const useCreateFinanceEntry = (): UseMutationResult<
  FinanceEntry,
  Error,
  CreateFinanceEntryDTO
> => {
  const queryClient = useQueryClient()

  return useMutation<FinanceEntry, Error, CreateFinanceEntryDTO>(
    (data) => financeApi.createEntry(data),
    {
      onSuccess: (created) => {
        queryClient.invalidateQueries("financeDashboard")
        queryClient.invalidateQueries("professorFinanceDashboard")
        queryClient.invalidateQueries(["financeEntries", created.month])
        showToast.success("Lançamento criado")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao criar lançamento")
      },
    },
  )
}

export const useUpdateFinanceEntry = (): UseMutationResult<
  FinanceEntry,
  Error,
  { id: string; data: UpdateFinanceEntryDTO }
> => {
  const queryClient = useQueryClient()

  return useMutation<FinanceEntry, Error, { id: string; data: UpdateFinanceEntryDTO }>(
    ({ id, data }) => financeApi.updateEntry(id, data),
    {
      onSuccess: (updated) => {
        queryClient.invalidateQueries("financeDashboard")
        queryClient.invalidateQueries("professorFinanceDashboard")
        queryClient.invalidateQueries(["financeEntries", updated.month])
        showToast.success("Lançamento atualizado")
      },
      onError: (error) => {
        showToast.error(error.message || "Erro ao atualizar lançamento")
      },
    },
  )
}

export const useDeleteFinanceEntry = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>((id) => financeApi.deleteEntry(id), {
    onSuccess: () => {
      queryClient.invalidateQueries("financeDashboard")
      queryClient.invalidateQueries("professorFinanceDashboard")
      queryClient.invalidateQueries("financeEntries")
      showToast.success("Lançamento removido")
    },
    onError: (error) => {
      showToast.error(error.message || "Erro ao remover lançamento")
    },
  })
}

export const useCloseFinanceMonth = (): UseMutationResult<FinanceMonthState, Error, string> => {
  const queryClient = useQueryClient()

  return useMutation<FinanceMonthState, Error, string>((month) => financeApi.closeMonth(month), {
    onSuccess: () => {
      queryClient.invalidateQueries("financeDashboard")
      queryClient.invalidateQueries("professorFinanceDashboard")
      queryClient.invalidateQueries("financeRenewals")
      queryClient.invalidateQueries("financeEntries")
      showToast.success("Mês fechado com sucesso")
    },
    onError: (error) => {
      showToast.error(error.message || "Erro ao fechar mês")
    },
  })
}

export const useReopenFinanceMonth = (): UseMutationResult<FinanceMonthState, Error, string> => {
  const queryClient = useQueryClient()

  return useMutation<FinanceMonthState, Error, string>((month) => financeApi.reopenMonth(month), {
    onSuccess: () => {
      queryClient.invalidateQueries("financeDashboard")
      queryClient.invalidateQueries("professorFinanceDashboard")
      queryClient.invalidateQueries("financeRenewals")
      queryClient.invalidateQueries("financeEntries")
      showToast.success("Mês reaberto com sucesso")
    },
    onError: (error) => {
      showToast.error(error.message || "Erro ao reabrir mês")
    },
  })
}
