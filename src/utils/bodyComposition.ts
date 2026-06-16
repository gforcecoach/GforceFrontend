import type { ObjetivoDieta, SexoBiologico } from "../types"

const round2 = (value: number) => Math.round(value * 100) / 100

interface NavyInput {
  sexoBiologico: SexoBiologico
  alturaCm: number
  cinturaCm: number
  pescocoCm: number
  quadrilCm?: number | null
}

export const calculateNavyBodyFat = (input: NavyInput): number | null => {
  const { sexoBiologico, alturaCm, cinturaCm, pescocoCm, quadrilCm } = input

  if (alturaCm <= 0 || cinturaCm <= 0 || pescocoCm <= 0) {
    return null
  }

  if (sexoBiologico === "MASCULINO") {
    const diff = cinturaCm - pescocoCm
    if (diff <= 0) return null
    const result =
      495 /
        (1.0324 -
          0.19077 * Math.log10(diff) +
          0.15456 * Math.log10(alturaCm)) -
      450
    if (!Number.isFinite(result)) return null
    return Math.max(2, Math.min(70, result))
  }

  if (!quadrilCm || quadrilCm <= 0) return null
  const diff = cinturaCm + quadrilCm - pescocoCm
  if (diff <= 0) return null
  const result =
    495 /
      (1.29579 -
        0.35004 * Math.log10(diff) +
        0.221 * Math.log10(alturaCm)) -
    450
  if (!Number.isFinite(result)) return null
  return Math.max(2, Math.min(70, result))
}

export const calculateLeanMassKg = (
  pesoKg?: number | null,
  percentualGordura?: number | null,
) => {
  if (!pesoKg || pesoKg <= 0 || percentualGordura === undefined || percentualGordura === null) {
    return null
  }
  const value = pesoKg * (1 - percentualGordura / 100)
  if (!Number.isFinite(value)) return null
  return Math.max(0, value)
}

export const calculateBmr = ({
  sexoBiologico,
  pesoKg,
  alturaCm,
  idade,
}: {
  sexoBiologico: SexoBiologico
  pesoKg: number
  alturaCm: number
  idade: number
}) => {
  if (pesoKg <= 0 || alturaCm <= 0 || idade <= 0) return null
  if (sexoBiologico === "MASCULINO") {
    return round2(10 * pesoKg + 6.25 * alturaCm - 5 * idade + 5)
  }
  return round2(10 * pesoKg + 6.25 * alturaCm - 5 * idade - 161)
}

export const resolveActivityFactor = (diasTreinoSemana?: number | null) => {
  if (!diasTreinoSemana || diasTreinoSemana <= 1) return 1.2
  if (diasTreinoSemana <= 3) return 1.375
  if (diasTreinoSemana <= 5) return 1.55
  if (diasTreinoSemana === 6) return 1.725
  return 1.9
}

export const calculateTargetCalories = (
  objetivo: ObjetivoDieta,
  caloriasManutencao: number,
) => {
  if (objetivo === "PERDER") return round2(caloriasManutencao * 0.85)
  if (objetivo === "GANHAR") return round2(caloriasManutencao * 1.12)
  return round2(caloriasManutencao)
}

export const calculateMacroTargets = ({
  objetivo,
  pesoKg,
  caloriasMeta,
}: {
  objetivo: ObjetivoDieta
  pesoKg: number
  caloriasMeta: number
}) => {
  const proteinPerKg = objetivo === "PERDER" ? 2.0 : 1.8
  const fatPerKg = objetivo === "GANHAR" ? 1.0 : 0.8

  const proteinasG = round2(pesoKg * proteinPerKg)
  const gordurasG = round2(pesoKg * fatPerKg)
  const caloriasProteina = proteinasG * 4
  const caloriasGordura = gordurasG * 9
  const carboidratosG = round2(
    Math.max(0, caloriasMeta - caloriasProteina - caloriasGordura) / 4,
  )

  return {
    proteinasG,
    carboidratosG,
    gordurasG,
  }
}

export const calculateFoodMacrosByQuantity = ({
  quantidadeGramas,
  calorias100g,
  proteinas100g,
  carboidratos100g,
  gorduras100g,
  fibras100g,
}: {
  quantidadeGramas: number
  calorias100g: number
  proteinas100g: number
  carboidratos100g: number
  gorduras100g: number
  fibras100g?: number | null
}) => {
  const base = quantidadeGramas / 100
  return {
    calorias: round2(calorias100g * base),
    proteinas: round2(proteinas100g * base),
    carboidratos: round2(carboidratos100g * base),
    gorduras: round2(gorduras100g * base),
    fibras:
      fibras100g === undefined || fibras100g === null
        ? null
        : round2(fibras100g * base),
  }
}
