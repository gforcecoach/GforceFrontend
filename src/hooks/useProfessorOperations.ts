import { useQuery, type UseQueryResult } from "react-query"
import { professorOperationsApi } from "../services/api"
import {
  type ProfessorDashboardResponse,
  type ProfessorFinanceDashboardResponse,
} from "../types"

export const useProfessorDashboard = (): UseQueryResult<
  ProfessorDashboardResponse,
  Error
> => {
  return useQuery<ProfessorDashboardResponse, Error>(
    ["professorDashboard"],
    professorOperationsApi.getDashboard,
    {
      staleTime: 30_000,
      cacheTime: 300_000,
      retry: 2,
    },
  )
}

export const useProfessorFinanceDashboard = (
  from?: string,
  to?: string,
): UseQueryResult<ProfessorFinanceDashboardResponse, Error> => {
  return useQuery<ProfessorFinanceDashboardResponse, Error>(
    ["professorFinanceDashboard", from ?? "", to ?? ""],
    () => professorOperationsApi.getFinanceDashboard(from, to),
    {
      staleTime: 30_000,
      cacheTime: 300_000,
      retry: 2,
    },
  )
}
