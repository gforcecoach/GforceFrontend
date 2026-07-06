export interface HistoricoEvolucao {
  id: string
  alunoId: string
  pesoKg?: number | null
  alturaCm?: number | null
  cinturaCm?: number | null
  quadrilCm?: number | null
  pescocoCm?: number | null
  bracoEsquerdoCm?: number | null
  bracoDireitoCm?: number | null
  pernaEsquerdaCm?: number | null
  pernaDireitaCm?: number | null
  percentualGordura?: number | null
  massaMagraKg?: number | null
  observacoes?: string | null
  registradoPor: string
  dataRegistro: string
  createdAt: string
}

export interface CreateHistoricoDTO {
  alunoId: string
  pesoKg?: number
  alturaCm?: number
  cinturaCm?: number
  quadrilCm?: number
  pescocoCm?: number
  bracoEsquerdoCm?: number
  bracoDireitoCm?: number
  pernaEsquerdaCm?: number
  pernaDireitaCm?: number
  percentualGordura?: number
  massaMagraKg?: number
  observacoes?: string
  dataRegistro?: string
}

export interface UpdateHistoricoDTO {
  pesoKg?: number
  alturaCm?: number
  cinturaCm?: number
  quadrilCm?: number
  pescocoCm?: number
  bracoEsquerdoCm?: number
  bracoDireitoCm?: number
  pernaEsquerdaCm?: number
  pernaDireitaCm?: number
  percentualGordura?: number
  massaMagraKg?: number
  observacoes?: string
  dataRegistro?: string
}

export interface HistoricoFiltros {
  dataInicio?: string
  dataFim?: string
  limite?: number
}

export type MetricaEvolucao =
  | "pesoKg"
  | "cinturaCm"
  | "quadrilCm"
  | "pescocoCm"
  | "percentualGordura"
  | "massaMagraKg"
  | "bracoEsquerdoCm"
  | "bracoDireitoCm"
  | "pernaEsquerdaCm"
  | "pernaDireitaCm"
