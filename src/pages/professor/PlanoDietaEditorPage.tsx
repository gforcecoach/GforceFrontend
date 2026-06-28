import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Copy,
  Plus,
  Save,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react"
import { Badge, Button, Card, Input, Textarea } from "../../components/ui"
import { useAluno } from "../../hooks/useAlunos"
import {
  useComentarDietaCheckinProfessor,
  useCreateAlimentoDieta,
  useDietaAlimentos,
  useDietaAlimentosExternos,
  useDietaCheckins,
  useDietaRecomendacao,
  useImportAlimentoExterno,
  usePlanoDietaAtivo,
  useUpsertPlanoDieta,
} from "../../hooks/useDieta"
import { useAuth } from "../../hooks/useAuth"
import { showToast } from "../../utils/toast"
import { calculateFoodMacrosByQuantity } from "../../utils/bodyComposition"
import { formatDiaSemana } from "../../utils/treino"
import type {
  AlimentoDieta,
  AlimentoExterno,
  DietaCheckin,
  ObjetivoDieta,
  UpsertPlanoDietaDTO,
} from "../../types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TreinoDayNavigator } from "../../components/treino/TreinoDayNavigator"

interface DraftItem {
  localId: string
  alimentoId: string
  alimento: AlimentoDieta
  ordem: number
  quantidadeGramas: number
  observacoes?: string
}

interface DraftMeal {
  localId: string
  nome: string
  ordem: number
  horario?: string
  observacoes?: string
  itens: DraftItem[]
}

interface DraftDay {
  localId: string
  titulo: string
  ordem: number
  diaSemana?: number
  observacoes?: string
  refeicoes: DraftMeal[]
}

interface CustomFoodForm {
  nome: string
  descricao: string
  calorias100g: string
  proteinas100g: string
  carboidratos100g: string
  gorduras100g: string
  fibras100g: string
}

const createLocalId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const objetivos: Array<{ value: ObjetivoDieta; label: string; description: string }> = [
  {
    value: "MANTER",
    label: "Manter peso",
    description: "Calorias próximas da manutenção",
  },
  {
    value: "PERDER",
    label: "Diminuir peso",
    description: "Déficit calórico controlado",
  },
  {
    value: "GANHAR",
    label: "Aumentar peso",
    description: "Superávit calórico moderado",
  },
]

const diasSemana = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
]

const parseOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : undefined
}

const mapCheckinStatus = (checkin: DietaCheckin) => {
  if (checkin.status === "CONCLUIDO") {
    return { text: "Concluído", variant: "success" as const }
  }
  return { text: "Em andamento", variant: "warning" as const }
}

interface PlanoDietaEditorPageProps {
  embeddedInStudentContext?: boolean
}

export const PlanoDietaEditorPage: React.FC<PlanoDietaEditorPageProps> = ({
  embeddedInStudentContext = false,
}) => {
  const navigate = useNavigate()
  const { id: alunoId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [nomePlano, setNomePlano] = useState("")
  const [objetivo, setObjetivo] = useState<ObjetivoDieta>("MANTER")
  const [fatorAtividadeInput, setFatorAtividadeInput] = useState("")
  const [caloriasMetaInput, setCaloriasMetaInput] = useState("")
  const [proteinaMetaInput, setProteinaMetaInput] = useState("")
  const [carboMetaInput, setCarboMetaInput] = useState("")
  const [gorduraMetaInput, setGorduraMetaInput] = useState("")
  const [observacoesPlano, setObservacoesPlano] = useState("")

  const [dias, setDias] = useState<DraftDay[]>([])
  const [selectedDayId, setSelectedDayId] = useState("")
  const [selectedMealId, setSelectedMealId] = useState("")
  const [selectedMealByDay, setSelectedMealByDay] = useState<Record<string, string>>({})
  const [copySourceDayId, setCopySourceDayId] = useState("")
  const [copyTargetDayIds, setCopyTargetDayIds] = useState<string[]>([])
  const [filtroAlimento, setFiltroAlimento] = useState("")
  const [buscaExterna, setBuscaExterna] = useState("")
  const [fonteExterna, setFonteExterna] = useState<"USDA" | "TACO" | "ALL">("ALL")
  const [customFood, setCustomFood] = useState<CustomFoodForm>({
    nome: "",
    descricao: "",
    calorias100g: "",
    proteinas100g: "",
    carboidratos100g: "",
    gorduras100g: "",
    fibras100g: "",
  })
  const [comentariosProfessor, setComentariosProfessor] = useState<Record<string, string>>({})
  const [initializedFromBackend, setInitializedFromBackend] = useState(false)
  const foodBankRef = useRef<HTMLDivElement | null>(null)

  const { data: aluno, isLoading: loadingAluno } = useAluno(alunoId || "", {
    enabled: !!alunoId,
  })

  const {
    data: planoAtivo,
    isLoading: loadingPlano,
    error: erroPlano,
  } = usePlanoDietaAtivo(alunoId || "", !!alunoId)

  const fatorAtividade = parseOptionalNumber(fatorAtividadeInput)
  const {
    data: recomendacao,
    isLoading: loadingRecomendacao,
  } = useDietaRecomendacao(alunoId || "", objetivo, fatorAtividade, !!alunoId)

  const { data: alimentos, isLoading: loadingAlimentos } = useDietaAlimentos(
    filtroAlimento || undefined,
  )
  const { data: checkins, isLoading: loadingCheckins } = useDietaCheckins(
    alunoId || "",
    20,
    !!alunoId,
  )

  const { data: externos, isFetching: loadingExternos } = useDietaAlimentosExternos({
    q: buscaExterna,
    source: fonteExterna,
    enabled: buscaExterna.trim().length >= 2,
  })

  const importAlimento = useImportAlimentoExterno()
  const createAlimento = useCreateAlimentoDieta()
  const upsertPlano = useUpsertPlanoDieta()
  const comentarCheckinProfessor = useComentarDietaCheckinProfessor()

  const erroPlanoNaoEncontrado =
    erroPlano?.message?.toLowerCase().includes("não encontrado") ||
    erroPlano?.message?.toLowerCase().includes("recurso não encontrado")

  const checkinsOrdenados = useMemo(() => {
    return [...(checkins || [])].sort(
      (a, b) =>
        new Date(b.iniciadoEm).getTime() - new Date(a.iniciadoEm).getTime(),
    )
  }, [checkins])

  useEffect(() => {
    if (initializedFromBackend || loadingPlano) return

    if (planoAtivo) {
      setNomePlano(planoAtivo.nome)
      setObjetivo(planoAtivo.objetivo)
      setFatorAtividadeInput(planoAtivo.fatorAtividade ? String(planoAtivo.fatorAtividade) : "")
      setCaloriasMetaInput(String(planoAtivo.caloriasMeta || ""))
      setProteinaMetaInput(String(planoAtivo.proteinasMetaG || ""))
      setCarboMetaInput(String(planoAtivo.carboidratosMetaG || ""))
      setGorduraMetaInput(String(planoAtivo.gordurasMetaG || ""))
      setObservacoesPlano(planoAtivo.observacoes || "")

      const diasMapeados: DraftDay[] = planoAtivo.dias.map((dia, dayIndex) => ({
        localId: createLocalId(),
        titulo: dia.titulo,
        ordem: dayIndex + 1,
        diaSemana: dia.diaSemana || undefined,
        observacoes: dia.observacoes || "",
        refeicoes: dia.refeicoes.map((ref, refIndex) => ({
          localId: createLocalId(),
          nome: ref.nome,
          ordem: refIndex + 1,
          horario: ref.horario || "",
          observacoes: ref.observacoes || "",
          itens: ref.itens.map((item, itemIndex) => ({
            localId: createLocalId(),
            alimentoId: item.alimentoId,
            alimento: item.alimento,
            ordem: itemIndex + 1,
            quantidadeGramas: item.quantidadeGramas,
            observacoes: item.observacoes || "",
          })),
        })),
      }))

      setDias(diasMapeados)
      if (diasMapeados.length > 0) {
        setSelectedDayId(diasMapeados[0].localId)
        if (diasMapeados[0].refeicoes.length > 0) {
          setSelectedMealId(diasMapeados[0].refeicoes[0].localId)
          setSelectedMealByDay({
            [diasMapeados[0].localId]: diasMapeados[0].refeicoes[0].localId,
          })
        }
      }
      setInitializedFromBackend(true)
      return
    }

    if (erroPlano && !erroPlanoNaoEncontrado) return

    const diaInicial: DraftDay = {
      localId: createLocalId(),
      titulo: "Dia 1",
      ordem: 1,
      diaSemana: 1,
      observacoes: "",
      refeicoes: [
        {
          localId: createLocalId(),
          nome: "Café da manhã",
          ordem: 1,
          horario: "",
          observacoes: "",
          itens: [],
        },
      ],
    }

    setNomePlano("Plano Alimentar Semanal")
    setDias([diaInicial])
    setSelectedDayId(diaInicial.localId)
    setSelectedMealId(diaInicial.refeicoes[0].localId)
    setSelectedMealByDay({
      [diaInicial.localId]: diaInicial.refeicoes[0].localId,
    })
    setInitializedFromBackend(true)
  }, [erroPlano, erroPlanoNaoEncontrado, initializedFromBackend, loadingPlano, planoAtivo])

  useEffect(() => {
    if (!recomendacao) return
    if (!caloriasMetaInput) setCaloriasMetaInput(String(recomendacao.caloriasMeta || ""))
    if (!proteinaMetaInput) setProteinaMetaInput(String(recomendacao.proteinasMetaG || ""))
    if (!carboMetaInput) setCarboMetaInput(String(recomendacao.carboidratosMetaG || ""))
    if (!gorduraMetaInput) setGorduraMetaInput(String(recomendacao.gordurasMetaG || ""))
    if (!fatorAtividadeInput) {
      setFatorAtividadeInput(
        recomendacao.fatorAtividade ? String(recomendacao.fatorAtividade) : "",
      )
    }
  }, [recomendacao, caloriasMetaInput, proteinaMetaInput, carboMetaInput, gorduraMetaInput, fatorAtividadeInput])

  useEffect(() => {
    if (!dias.length) {
      setCopySourceDayId("")
      setCopyTargetDayIds([])
      return
    }

    if (!copySourceDayId || !dias.some((day) => day.localId === copySourceDayId)) {
      setCopySourceDayId(selectedDayId || dias[0].localId)
    }

    setCopyTargetDayIds((prev) => prev.filter((id) => dias.some((day) => day.localId === id)))
  }, [copySourceDayId, dias, selectedDayId])

  const selectedDay = dias.find((day) => day.localId === selectedDayId)
  const selectedMeal = selectedDay?.refeicoes.find((meal) => meal.localId === selectedMealId)
  const copySourceDay = dias.find((day) => day.localId === copySourceDayId)
  const visibleDays = selectedDay ? [selectedDay] : []

  const dayNavigationItems = useMemo(
    () =>
      dias.map((day) => ({
        id: day.localId,
        title: day.titulo || `Dia ${day.ordem}`,
        subtitle: formatDiaSemana(day.diaSemana),
        countLabel: `${day.refeicoes.length} refeição(ões)`,
      })),
    [dias],
  )

  const selectDay = (dayId: string) => {
    const nextDay = dias.find((day) => day.localId === dayId)
    const rememberedMealId = selectedMealByDay[dayId]
    const rememberedMealExists = nextDay?.refeicoes.some(
      (meal) => meal.localId === rememberedMealId,
    )
    setSelectedDayId(dayId)
    setSelectedMealId(
      rememberedMealExists
        ? rememberedMealId
        : nextDay?.refeicoes[0]?.localId || "",
    )
  }

  const handleFocusFoodBank = () => {
    foodBankRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
    window.setTimeout(() => foodBankRef.current?.focus({ preventScroll: true }), 250)
  }

  const ensureSelectedMeal = () => {
    if (selectedMealId && selectedMeal) return selectedMealId
    if (selectedDay?.refeicoes.length) {
      const fallback = selectedDay.refeicoes[0].localId
      setSelectedMealId(fallback)
      setSelectedMealByDay((prev) => ({
        ...prev,
        [selectedDay.localId]: fallback,
      }))
      return fallback
    }
    showToast.error("Selecione ou crie uma refeição para adicionar alimentos")
    return null
  }

  const updateDay = (dayId: string, patch: Partial<DraftDay>) => {
    setDias((prev) =>
      prev.map((day) => (day.localId === dayId ? { ...day, ...patch } : day)),
    )
  }

  const addDay = () => {
    const newDay: DraftDay = {
      localId: createLocalId(),
      titulo: `Dia ${dias.length + 1}`,
      ordem: dias.length + 1,
      diaSemana: undefined,
      observacoes: "",
      refeicoes: [],
    }
    setDias((prev) => [...prev, newDay])
    setSelectedDayId(newDay.localId)
    setSelectedMealId("")
  }

  const duplicateSelectedDay = () => {
    if (!selectedDay) {
      showToast.error("Selecione um dia para duplicar")
      return
    }

    const duplicatedDay: DraftDay = {
      localId: createLocalId(),
      titulo: `${selectedDay.titulo || `Dia ${selectedDay.ordem}`} cópia`,
      ordem: dias.length + 1,
      diaSemana: selectedDay.diaSemana,
      observacoes: selectedDay.observacoes || "",
      refeicoes: selectedDay.refeicoes.map((meal, mealIndex) => ({
        localId: createLocalId(),
        nome: meal.nome,
        ordem: mealIndex + 1,
        horario: meal.horario || "",
        observacoes: meal.observacoes || "",
        itens: meal.itens.map((item, itemIndex) => ({
          localId: createLocalId(),
          alimentoId: item.alimentoId,
          alimento: item.alimento,
          ordem: itemIndex + 1,
          quantidadeGramas: item.quantidadeGramas,
          observacoes: item.observacoes || "",
        })),
      })),
    }

    setDias((prev) => [...prev, duplicatedDay])
    setSelectedDayId(duplicatedDay.localId)
    setSelectedMealId(duplicatedDay.refeicoes[0]?.localId || "")
    if (duplicatedDay.refeicoes[0]) {
      setSelectedMealByDay((prev) => ({
        ...prev,
        [duplicatedDay.localId]: duplicatedDay.refeicoes[0].localId,
      }))
    }
  }

  const addMealToSelectedDay = () => {
    if (!selectedDay) {
      showToast.error("Selecione um dia para adicionar refeição")
      return
    }

    addMeal(selectedDay.localId)
  }

  const removeDay = (dayId: string) => {
    if (dias.length === 1) {
      showToast.error("A dieta precisa ter ao menos um dia")
      return
    }

    setDias((prev) =>
      prev
        .filter((day) => day.localId !== dayId)
        .map((day, index) => ({ ...day, ordem: index + 1 })),
    )

    if (selectedDayId === dayId) {
      const fallback = dias.find((day) => day.localId !== dayId)
      if (fallback) {
        setSelectedDayId(fallback.localId)
        setSelectedMealId(fallback.refeicoes[0]?.localId || "")
      }
    }
  }

  const addMeal = (dayId: string) => {
    setDias((prev) =>
      prev.map((day) => {
        if (day.localId !== dayId) return day
        const newMeal: DraftMeal = {
          localId: createLocalId(),
          nome: `Refeição ${day.refeicoes.length + 1}`,
          ordem: day.refeicoes.length + 1,
          horario: "",
          observacoes: "",
          itens: [],
        }
        setSelectedMealId(newMeal.localId)
        setSelectedMealByDay((prevSelected) => ({
          ...prevSelected,
          [dayId]: newMeal.localId,
        }))
        return { ...day, refeicoes: [...day.refeicoes, newMeal] }
      }),
    )
  }

  const updateMeal = (dayId: string, mealId: string, patch: Partial<DraftMeal>) => {
    setDias((prev) =>
      prev.map((day) => {
        if (day.localId !== dayId) return day
        return {
          ...day,
          refeicoes: day.refeicoes.map((meal) =>
            meal.localId === mealId ? { ...meal, ...patch } : meal,
          ),
        }
      }),
    )
  }

  const removeMeal = (dayId: string, mealId: string) => {
    setDias((prev) =>
      prev.map((day) => {
        if (day.localId !== dayId) return day
        return {
          ...day,
          refeicoes: day.refeicoes
            .filter((meal) => meal.localId !== mealId)
            .map((meal, index) => ({ ...meal, ordem: index + 1 })),
        }
      }),
    )
    if (selectedMealId === mealId) {
      const fallback = selectedDay?.refeicoes.find((meal) => meal.localId !== mealId)
      setSelectedMealId(fallback?.localId || "")
      if (selectedDay) {
        setSelectedMealByDay((prev) => ({
          ...prev,
          [selectedDay.localId]: fallback?.localId || "",
        }))
      }
    }
  }

  const addFoodToMeal = (dayId: string, mealId: string, alimento: AlimentoDieta) => {
    setDias((prev) =>
      prev.map((day) => {
        if (day.localId !== dayId) return day
        return {
          ...day,
          refeicoes: day.refeicoes.map((meal) => {
            if (meal.localId !== mealId) return meal
            const newItem: DraftItem = {
              localId: createLocalId(),
              alimentoId: alimento.id,
              alimento,
              ordem: meal.itens.length + 1,
              quantidadeGramas: 100,
              observacoes: "",
            }
            return {
              ...meal,
              itens: [...meal.itens, newItem],
            }
          }),
        }
      }),
    )
  }

  const updateFoodItem = (
    dayId: string,
    mealId: string,
    itemId: string,
    patch: Partial<DraftItem>,
  ) => {
    setDias((prev) =>
      prev.map((day) => {
        if (day.localId !== dayId) return day
        return {
          ...day,
          refeicoes: day.refeicoes.map((meal) => {
            if (meal.localId !== mealId) return meal
            return {
              ...meal,
              itens: meal.itens.map((item) =>
                item.localId === itemId ? { ...item, ...patch } : item,
              ),
            }
          }),
        }
      }),
    )
  }

  const removeFoodItem = (dayId: string, mealId: string, itemId: string) => {
    setDias((prev) =>
      prev.map((day) => {
        if (day.localId !== dayId) return day
        return {
          ...day,
          refeicoes: day.refeicoes.map((meal) => {
            if (meal.localId !== mealId) return meal
            return {
              ...meal,
              itens: meal.itens
                .filter((item) => item.localId !== itemId)
                .map((item, index) => ({ ...item, ordem: index + 1 })),
            }
          }),
        }
      }),
    )
  }

  const handleImportExternal = async (food: AlimentoExterno) => {
    const mealId = ensureSelectedMeal()
    if (!mealId || !selectedDay) return

    try {
      const imported = await importAlimento.mutateAsync({
        externalId: food.externalId,
        nome: food.nome,
        descricao: food.descricao,
        calorias100g: food.calorias100g,
        proteinas100g: food.proteinas100g,
        carboidratos100g: food.carboidratos100g,
        gorduras100g: food.gorduras100g,
        fibras100g: food.fibras100g,
        source: food.source,
      })
      addFoodToMeal(selectedDay.localId, mealId, imported)
      showToast.success("Alimento importado e adicionado à refeição")
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreateCustomFood = async () => {
    if (!customFood.nome.trim()) {
      showToast.error("Informe o nome do alimento")
      return
    }

    const calorias100g = parseOptionalNumber(customFood.calorias100g)
    const proteinas100g = parseOptionalNumber(customFood.proteinas100g)
    const carboidratos100g = parseOptionalNumber(customFood.carboidratos100g)
    const gorduras100g = parseOptionalNumber(customFood.gorduras100g)
    const fibras100g = parseOptionalNumber(customFood.fibras100g)

    if (
      calorias100g === undefined ||
      proteinas100g === undefined ||
      carboidratos100g === undefined ||
      gorduras100g === undefined
    ) {
      showToast.error("Preencha calorias, proteínas, carboidratos e gorduras")
      return
    }

    if (calorias100g < 0 || proteinas100g < 0 || carboidratos100g < 0 || gorduras100g < 0) {
      showToast.error("Valores nutricionais devem ser números positivos")
      return
    }

    if (fibras100g !== undefined && fibras100g < 0) {
      showToast.error("Fibras deve ser um número positivo")
      return
    }

    if (proteinas100g + carboidratos100g + gorduras100g > 100.5) {
      showToast.error("A soma de proteínas, carboidratos e gorduras deve ser <= 100g")
      return
    }

    if (fibras100g !== undefined && fibras100g > carboidratos100g + 0.5) {
      showToast.error("Fibras não pode ser maior que carboidratos por 100g")
      return
    }

    const mealId = ensureSelectedMeal()
    if (!mealId || !selectedDay) return

    try {
      const created = await createAlimento.mutateAsync({
        nome: customFood.nome.trim(),
        descricao: customFood.descricao.trim() || undefined,
        calorias100g,
        proteinas100g,
        carboidratos100g,
        gorduras100g,
        fibras100g,
      })

      addFoodToMeal(selectedDay.localId, mealId, created)
      setCustomFood({
        nome: "",
        descricao: "",
        calorias100g: "",
        proteinas100g: "",
        carboidratos100g: "",
        gorduras100g: "",
        fibras100g: "",
      })
      showToast.success("Alimento criado e adicionado à refeição ativa")
    } catch (error) {
      console.error(error)
    }
  }

  const toggleCopyTargetDay = (dayId: string) => {
    setCopyTargetDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId],
    )
  }

  const handleApplyDayCopy = () => {
    if (!copySourceDay) {
      showToast.error("Selecione o dia de origem para a cópia")
      return
    }

    if (copySourceDay.refeicoes.length === 0) {
      showToast.error("O dia de origem precisa ter refeições para ser copiado")
      return
    }

    if (copyTargetDayIds.length === 0) {
      showToast.error("Selecione ao menos um dia-alvo vazio")
      return
    }

    let copiedCount = 0

    setDias((prev) =>
      prev.map((day) => {
        if (!copyTargetDayIds.includes(day.localId) || day.localId === copySourceDay.localId) {
          return day
        }

        if (day.refeicoes.length > 0) {
          return day
        }

        copiedCount += 1

        return {
          ...day,
          observacoes: copySourceDay.observacoes || "",
          refeicoes: copySourceDay.refeicoes.map((meal, mealIndex) => ({
            localId: createLocalId(),
            nome: meal.nome,
            ordem: mealIndex + 1,
            horario: meal.horario || "",
            observacoes: meal.observacoes || "",
            itens: meal.itens.map((item, itemIndex) => ({
              localId: createLocalId(),
              alimentoId: item.alimentoId,
              alimento: item.alimento,
              ordem: itemIndex + 1,
              quantidadeGramas: item.quantidadeGramas,
              observacoes: item.observacoes || "",
            })),
          })),
        }
      }),
    )

    if (copiedCount === 0) {
      showToast.error("Os dias selecionados já possuem refeições e não podem ser sobrescritos")
      return
    }

    setCopyTargetDayIds([])
    showToast.success(`Dia copiado para ${copiedCount} dia(s) vazio(s)`)
  }

  const handleSavePlano = async () => {
    if (!alunoId) return
    if (!nomePlano.trim()) {
      showToast.error("Informe o nome do plano")
      return
    }
    if (dias.length === 0) {
      showToast.error("Adicione ao menos um dia na dieta")
      return
    }
    const invalidDay = dias.find((day) => day.refeicoes.length === 0)
    if (invalidDay) {
      showToast.error("Todos os dias devem possuir ao menos uma refeição")
      return
    }
    const invalidMeal = dias.flatMap((day) => day.refeicoes).find((meal) => meal.itens.length === 0)
    if (invalidMeal) {
      showToast.error("Todas as refeições devem possuir ao menos um alimento")
      return
    }

    const payload: UpsertPlanoDietaDTO = {
      alunoId,
      nome: nomePlano.trim(),
      objetivo,
      fatorAtividade: parseOptionalNumber(fatorAtividadeInput),
      caloriasMeta: parseOptionalNumber(caloriasMetaInput),
      proteinasMetaG: parseOptionalNumber(proteinaMetaInput),
      carboidratosMetaG: parseOptionalNumber(carboMetaInput),
      gordurasMetaG: parseOptionalNumber(gorduraMetaInput),
      observacoes: observacoesPlano.trim() || undefined,
      dias: dias.map((day, dayIndex) => ({
        titulo: day.titulo.trim(),
        ordem: dayIndex + 1,
        diaSemana: day.diaSemana,
        observacoes: day.observacoes?.trim() || undefined,
        refeicoes: day.refeicoes.map((meal, mealIndex) => ({
          nome: meal.nome.trim(),
          ordem: mealIndex + 1,
          horario: meal.horario?.trim() || undefined,
          observacoes: meal.observacoes?.trim() || undefined,
          itens: meal.itens.map((item, itemIndex) => ({
            alimentoId: item.alimentoId,
            ordem: itemIndex + 1,
            quantidadeGramas: item.quantidadeGramas,
            observacoes: item.observacoes?.trim() || undefined,
          })),
        })),
      })),
    }

    await upsertPlano.mutateAsync(payload)
  }

  const handleSaveProfessorComment = async (checkinId: string) => {
    const draft = comentariosProfessor[checkinId]
    if (!draft || !draft.trim()) {
      showToast.error("Digite um comentário antes de salvar")
      return
    }

    await comentarCheckinProfessor.mutateAsync({
      checkinId,
      alunoId: alunoId || "",
      comentarioProfessor: draft.trim(),
    })
  }

  const macrosResumo = useMemo(() => {
    const totals = dias.reduce(
      (acc, day) => {
        for (const meal of day.refeicoes) {
          for (const item of meal.itens) {
            const calculated = calculateFoodMacrosByQuantity({
              quantidadeGramas: item.quantidadeGramas,
              calorias100g: item.alimento.calorias100g,
              proteinas100g: item.alimento.proteinas100g,
              carboidratos100g: item.alimento.carboidratos100g,
              gorduras100g: item.alimento.gorduras100g,
              fibras100g: item.alimento.fibras100g,
            })
            acc.calorias += calculated.calorias
            acc.proteinas += calculated.proteinas
            acc.carboidratos += calculated.carboidratos
            acc.gorduras += calculated.gorduras
          }
        }
        return acc
      },
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 },
    )
    return totals
  }, [dias])

  if (!alunoId) {
    return (
      <Card className="bg-red-950/40 border-2 border-red-500/30">
        <p className="text-red-300">Aluno inválido para montar dieta.</p>
      </Card>
    )
  }

  if (loadingAluno || loadingPlano) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-zinc-300">Carregando editor de dieta...</p>
      </div>
    )
  }

  if (!aluno) {
    return (
      <Card className="bg-red-950/40 border-2 border-red-500/30">
        <p className="text-red-300">Aluno não encontrado.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6" data-onboarding-target="onboarding-diet-editor">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {!embeddedInStudentContext && (
            <button
              onClick={() =>
                navigate(isAdmin ? "/admin/alunos" : "/professor/dashboard")
              }
              className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Editor de Dieta
            </h1>
            <p className="text-zinc-300">
              {embeddedInStudentContext
                ? "Plano semanal com macros e check-ins"
                : `${aluno.user?.nome || "Aluno"} • plano semanal com macros e check-ins`}
            </p>
          </div>
        </div>
        <Button icon={Save} onClick={handleSavePlano} isLoading={upsertPlano.isLoading}>
          Salvar Plano
        </Button>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Estratégia calórica e macros</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          {objetivos.map((item) => (
            <button
              key={item.value}
              onClick={() => setObjetivo(item.value)}
              className={`text-left border rounded-lg p-3 transition-colors ${
                objetivo === item.value
                  ? "border-blue-500 bg-blue-950/40"
                  : "border-zinc-700 hover:border-zinc-700"
              }`}
            >
              <p className="font-semibold text-white">{item.label}</p>
              <p className="text-xs text-zinc-300 mt-1">{item.description}</p>
            </button>
          ))}
        </div>

        {recomendacao && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-950/40 rounded-lg p-3">
              <p className="text-xs text-white">% Gordura</p>
              <p className="text-lg font-semibold text-white">
                {recomendacao.percentualGordura ?? "-"}
              </p>
            </div>
            <div className="bg-emerald-950/40 rounded-lg p-3">
              <p className="text-xs text-zinc-300">Massa magra (kg)</p>
              <p className="text-lg font-semibold text-emerald-300">
                {recomendacao.massaMagraKg ?? "-"}
              </p>
            </div>
            <div className="bg-amber-950/40 rounded-lg p-3">
              <p className="text-xs text-zinc-300">TMB (kcal)</p>
              <p className="text-lg font-semibold text-amber-300">
                {recomendacao.tmbKcal ?? "-"}
              </p>
            </div>
            <div className="bg-purple-950/40 rounded-lg p-3">
              <p className="text-xs text-white">Calorias alvo (kcal)</p>
              <p className="text-lg font-semibold text-white">
                {recomendacao.caloriasMeta ?? "-"}
              </p>
            </div>
          </div>
        )}

        {loadingRecomendacao && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3 text-sm text-zinc-300">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            Calculando recomendação nutricional...
          </div>
        )}

        {recomendacao && recomendacao.missingFields.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-amber-500/40 bg-amber-950/40">
            <p className="text-sm text-white font-medium">
              Alguns dados estão ausentes para recomendação completa:
            </p>
            <p className="text-sm text-zinc-100">
              {recomendacao.missingFields.join(", ")}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label="Nome do plano"
            value={nomePlano}
            onChange={(e) => setNomePlano(e.target.value)}
            placeholder="Plano Alimentar"
          />
          <Input
            label="Fator atividade"
            type="number"
            step="0.01"
            value={fatorAtividadeInput}
            onChange={(e) => setFatorAtividadeInput(e.target.value)}
            placeholder="1.55"
          />
          <Input
            label="Calorias alvo"
            type="number"
            value={caloriasMetaInput}
            onChange={(e) => setCaloriasMetaInput(e.target.value)}
            placeholder="2200"
          />
          <Input
            label="Proteína alvo (g)"
            type="number"
            value={proteinaMetaInput}
            onChange={(e) => setProteinaMetaInput(e.target.value)}
            placeholder="160"
          />
          <Input
            label="Carbo alvo (g)"
            type="number"
            value={carboMetaInput}
            onChange={(e) => setCarboMetaInput(e.target.value)}
            placeholder="220"
          />
          <Input
            label="Gordura alvo (g)"
            type="number"
            value={gorduraMetaInput}
            onChange={(e) => setGorduraMetaInput(e.target.value)}
            placeholder="65"
          />
        </div>
        <Textarea
          label="Observações gerais"
          rows={2}
          value={observacoesPlano}
          onChange={(e) => setObservacoesPlano(e.target.value)}
          placeholder="Notas para o aluno sobre hidratação, substituições etc."
        />
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Plano semanal de refeições</h2>
          <Button variant="secondary" icon={Plus} onClick={addDay} className="hidden md:flex">
            Adicionar dia
          </Button>
        </div>

        <TreinoDayNavigator
          days={dayNavigationItems}
          selectedDayId={selectedDayId}
          onSelectDay={selectDay}
          label="Dias da dieta"
          mobileLabel="Dias da dieta"
          idPrefix="dieta-day"
          actions={[
            {
              label: "Adicionar dia",
              icon: Plus,
              onClick: addDay,
            },
            {
              label: "Duplicar dia atual",
              icon: Copy,
              onClick: duplicateSelectedDay,
            },
            {
              label: "Adicionar refeição ao dia atual",
              icon: UtensilsCrossed,
              onClick: addMealToSelectedDay,
            },
            {
              label: "Adicionar alimento à refeição ativa",
              icon: Search,
              onClick: handleFocusFoodBank,
            },
          ]}
        />

        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-white">Copiar dia montado</h3>
              <p className="text-sm text-zinc-300">
                Copia refeições, itens e observações para os dias-alvo vazios selecionados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Dia de origem
                </label>
                <select
                  value={copySourceDayId}
                  onChange={(e) => {
                    setCopySourceDayId(e.target.value)
                    setCopyTargetDayIds([])
                  }}
                  className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-300 focus:border-transparent"
                >
                  {dias.map((day) => (
                    <option key={day.localId} value={day.localId}>
                      {day.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium text-zinc-200 mb-2">Dias-alvo vazios</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {dias
                    .filter((day) => day.localId !== copySourceDayId)
                    .map((day) => {
                      const isEmpty = day.refeicoes.length === 0
                      return (
                        <label
                          key={day.localId}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                            isEmpty
                              ? "border-zinc-700 bg-zinc-950"
                              : "border-zinc-800 bg-zinc-950/60 opacity-60"
                          }`}
                        >
                          <div>
                            <p className="text-sm text-white">{day.titulo}</p>
                            <p className="text-xs text-zinc-400">
                              {isEmpty ? "Sem refeições cadastradas" : "Já possui refeições"}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={copyTargetDayIds.includes(day.localId)}
                            disabled={!isEmpty}
                            onChange={() => toggleCopyTargetDay(day.localId)}
                          />
                        </label>
                      )
                    })}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleApplyDayCopy}>
                Aplicar cópia
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {visibleDays.map((day) => (
            <div
              key={day.localId}
              id={`dieta-day-panel-${day.localId}`}
              role="tabpanel"
              aria-label={`Dieta: ${day.titulo || "Dia sem título"}`}
              className={`border rounded-lg p-4 ${
                selectedDayId === day.localId
                  ? "border-blue-400 bg-blue-950/30"
                  : "border-zinc-700"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  label="Título"
                  value={day.titulo}
                  onChange={(e) => updateDay(day.localId, { titulo: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Dia da semana
                  </label>
                  <select
                    value={day.diaSemana || ""}
                    onChange={(e) =>
                      updateDay(day.localId, {
                        diaSemana: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-300 focus:border-transparent"
                  >
                    <option value="">Sem dia fixo</option>
                    {diasSemana.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      selectDay(day.localId)
                    }}
                    className="w-full"
                  >
                    {selectedDayId === day.localId ? "Dia ativo" : "Ativar dia"}
                  </Button>
                  <Button
                    variant="danger"
                    className="!px-3"
                    onClick={() => removeDay(day.localId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  label="Observações do dia"
                  rows={2}
                  value={day.observacoes || ""}
                  onChange={(e) => updateDay(day.localId, { observacoes: e.target.value })}
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-200">
                    Refeições de {day.titulo} ({formatDiaSemana(day.diaSemana)})
                  </p>
                  <Button
                    variant="secondary"
                    className="!py-1 !px-3"
                    onClick={() => addMeal(day.localId)}
                  >
                    <Plus className="h-4 w-4" />
                    Refeição
                  </Button>
                </div>

                <div className="space-y-2">
                  {day.refeicoes.map((meal) => {
                    const mealTotals = meal.itens.reduce(
                      (acc, item) => {
                        const macros = calculateFoodMacrosByQuantity({
                          quantidadeGramas: item.quantidadeGramas,
                          calorias100g: item.alimento.calorias100g,
                          proteinas100g: item.alimento.proteinas100g,
                          carboidratos100g: item.alimento.carboidratos100g,
                          gorduras100g: item.alimento.gorduras100g,
                          fibras100g: item.alimento.fibras100g,
                        })
                        acc.calorias += macros.calorias
                        return acc
                      },
                      { calorias: 0 },
                    )

                    return (
                    <div
                      key={meal.localId}
                      className={`border rounded-lg p-3 ${
                        selectedMealId === meal.localId ? "border-blue-300 bg-zinc-900" : "border-zinc-700"
                      }`}
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{meal.nome}</p>
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200">
                          {meal.horario || "Horário livre"}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2 py-1 text-xs text-white">
                          {mealTotals.calorias.toFixed(0)} kcal
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <Input
                          label="Nome"
                          value={meal.nome}
                          onChange={(e) =>
                            updateMeal(day.localId, meal.localId, {
                              nome: e.target.value,
                            })
                          }
                        />
                        <Input
                          label="Horário"
                          value={meal.horario || ""}
                          onChange={(e) =>
                            updateMeal(day.localId, meal.localId, {
                              horario: e.target.value,
                            })
                          }
                          placeholder="08:00"
                        />
                        <Textarea
                          label="Observações"
                          rows={2}
                          value={meal.observacoes || ""}
                          onChange={(e) =>
                            updateMeal(day.localId, meal.localId, {
                              observacoes: e.target.value,
                            })
                          }
                        />
                        <div className="flex items-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedDayId(day.localId)
                              setSelectedMealId(meal.localId)
                              setSelectedMealByDay((prev) => ({
                                ...prev,
                                [day.localId]: meal.localId,
                              }))
                            }}
                            className="w-full"
                          >
                            {selectedMealId === meal.localId
                              ? "Refeição ativa"
                              : "Ativar"}
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-3"
                            onClick={() => removeMeal(day.localId, meal.localId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {meal.itens.map((item) => {
                          const macros = calculateFoodMacrosByQuantity({
                            quantidadeGramas: item.quantidadeGramas,
                            calorias100g: item.alimento.calorias100g,
                            proteinas100g: item.alimento.proteinas100g,
                            carboidratos100g: item.alimento.carboidratos100g,
                            gorduras100g: item.alimento.gorduras100g,
                            fibras100g: item.alimento.fibras100g,
                          })

                          return (
                            <div
                              key={item.localId}
                              className="rounded-lg border border-zinc-700 p-3 bg-zinc-900"
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p className="font-medium text-white">
                                  {item.alimento.nome}
                                </p>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-white">
                                  {item.quantidadeGramas}g
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-950/50 border border-emerald-500/30 text-white">
                                  {macros.calorias} kcal
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <Input
                                  label="Quantidade (g)"
                                  type="number"
                                  min="1"
                                  value={String(item.quantidadeGramas)}
                                  onChange={(e) =>
                                    updateFoodItem(day.localId, meal.localId, item.localId, {
                                      quantidadeGramas: Number(e.target.value) || 0,
                                    })
                                  }
                                />
                                <Input
                                  label="Proteína (g)"
                                  value={String(macros.proteinas)}
                                  readOnly
                                />
                                <Input
                                  label="Carbo (g)"
                                  value={String(macros.carboidratos)}
                                  readOnly
                                />
                                <Input
                                  label="Gordura (g)"
                                  value={String(macros.gorduras)}
                                  readOnly
                                />
                              </div>
                              <Textarea
                                label="Observações do item"
                                rows={2}
                                value={item.observacoes || ""}
                                onChange={(e) =>
                                  updateFoodItem(day.localId, meal.localId, item.localId, {
                                    observacoes: e.target.value,
                                  })
                                }
                              />
                              <Button
                                variant="danger"
                                className="!py-1 !px-3"
                                onClick={() =>
                                  removeFoodItem(day.localId, meal.localId, item.localId)
                                }
                              >
                                Remover alimento
                              </Button>
                            </div>
                          )
                        })}

                        {meal.itens.length === 0 && (
                          <p className="text-sm text-zinc-400">
                            Nenhum alimento nesta refeição.
                          </p>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div
        ref={foodBankRef}
        tabIndex={-1}
        data-onboarding-target="onboarding-foods-area"
      >
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Banco de alimentos
          </h2>
          <p className="text-sm text-zinc-300 mb-3">
            Dia ativo: <strong>{selectedDay?.titulo || "nenhum"}</strong> • Refeição
            ativa: <strong>{selectedMeal?.nome || "nenhuma"}</strong>
          </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-white mb-2">Alimentos cadastrados</h3>
            <Input
              icon={Search}
              value={filtroAlimento}
              onChange={(e) => setFiltroAlimento(e.target.value)}
              placeholder="Buscar alimento"
            />
            <div className="mt-2 max-h-80 overflow-auto border border-zinc-700 rounded-lg">
              {loadingAlimentos && (
                <div className="p-3 flex items-center gap-2 text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando alimentos...
                </div>
              )}
              {!loadingAlimentos &&
                (alimentos || []).map((food) => (
                  <div
                    key={food.id}
                    className="p-3 border-b last:border-b-0 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-white">{food.nome}</p>
                      <p className="text-xs text-white mt-1">
                        {food.calorias100g} kcal/100g • P {food.proteinas100g}g • C{" "}
                        {food.carboidratos100g}g • G {food.gorduras100g}g
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const mealId = ensureSelectedMeal()
                        if (!mealId || !selectedDay) return
                        addFoodToMeal(selectedDay.localId, mealId, food)
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>
                ))}

              {!loadingAlimentos && (alimentos || []).length === 0 && (
                <div className="p-3 text-sm text-zinc-400">
                  Nenhum alimento encontrado com os filtros atuais.
                </div>
              )}
            </div>

            <div className="mt-4 border rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3">
                Criar alimento personalizado
              </h4>
              <Input
                label="Nome"
                value={customFood.nome}
                onChange={(event) =>
                  setCustomFood((prev) => ({
                    ...prev,
                    nome: event.target.value,
                  }))
                }
                placeholder="Ex: Iogurte natural integral"
              />
              <Textarea
                label="Descrição"
                rows={2}
                value={customFood.descricao}
                onChange={(event) =>
                  setCustomFood((prev) => ({
                    ...prev,
                    descricao: event.target.value,
                  }))
                }
                placeholder="Marca, preparo ou observações"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  label="Calorias (100g)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={customFood.calorias100g}
                  onChange={(event) =>
                    setCustomFood((prev) => ({
                      ...prev,
                      calorias100g: event.target.value,
                    }))
                  }
                  placeholder="150"
                />
                <Input
                  label="Proteínas (100g)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={customFood.proteinas100g}
                  onChange={(event) =>
                    setCustomFood((prev) => ({
                      ...prev,
                      proteinas100g: event.target.value,
                    }))
                  }
                  placeholder="12"
                />
                <Input
                  label="Carboidratos (100g)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={customFood.carboidratos100g}
                  onChange={(event) =>
                    setCustomFood((prev) => ({
                      ...prev,
                      carboidratos100g: event.target.value,
                    }))
                  }
                  placeholder="8"
                />
                <Input
                  label="Gorduras (100g)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={customFood.gorduras100g}
                  onChange={(event) =>
                    setCustomFood((prev) => ({
                      ...prev,
                      gorduras100g: event.target.value,
                    }))
                  }
                  placeholder="5"
                />
                <Input
                  label="Fibras (100g) opcional"
                  type="number"
                  step="0.1"
                  min="0"
                  value={customFood.fibras100g}
                  onChange={(event) =>
                    setCustomFood((prev) => ({
                      ...prev,
                      fibras100g: event.target.value,
                    }))
                  }
                  placeholder="2"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-2 mb-3">
                Regra: proteínas + carboidratos + gorduras deve ser até 100g por 100g.
              </p>
              <Button
                onClick={handleCreateCustomFood}
                icon={Plus}
                isLoading={createAlimento.isLoading}
              >
                Criar e adicionar na refeição ativa
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">
              Buscar alimentos externos (USDA/TACO)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input
                icon={Search}
                value={buscaExterna}
                onChange={(e) => setBuscaExterna(e.target.value)}
                placeholder="Buscar alimento"
              />
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Fonte
                </label>
                <select
                  value={fonteExterna}
                  onChange={(e) =>
                    setFonteExterna(e.target.value as "USDA" | "TACO" | "ALL")
                  }
                  className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-300 focus:border-transparent"
                >
                  <option value="ALL">USDA + TACO</option>
                  <option value="USDA">USDA</option>
                  <option value="TACO">TACO</option>
                </select>
              </div>
            </div>

            <div className="max-h-80 overflow-auto border border-zinc-700 rounded-lg">
              {buscaExterna.trim().length < 2 && (
                <p className="p-3 text-sm text-zinc-400">
                  Digite pelo menos 2 letras para pesquisar.
                </p>
              )}

              {loadingExternos && (
                <div className="p-3 flex items-center gap-2 text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando alimentos...
                </div>
              )}

              {!loadingExternos &&
                (externos || []).map((food) => (
                  <div
                    key={`${food.source}-${food.externalId}`}
                    className="p-3 border-b last:border-b-0 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-white">{food.nome}</p>
                      <p className="text-xs text-zinc-300 mt-1">
                        {food.source} • {food.calorias100g} kcal/100g
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      isLoading={importAlimento.isLoading}
                      onClick={() => handleImportExternal(food)}
                    >
                      Importar
                    </Button>
                  </div>
                ))}

              {buscaExterna.trim().length >= 2 &&
                !loadingExternos &&
                externos?.length === 0 && (
                  <p className="p-3 text-sm text-zinc-400">
                    Nenhum resultado externo encontrado. Verifique os filtros ou crie
                    um alimento personalizado.
                  </p>
                )}
            </div>
          </div>
        </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Resumo do plano montado</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-950/40 p-3 rounded-lg">
            <p className="text-xs text-white">Kcal total planejada</p>
            <p className="text-lg font-semibold text-white">
              {macrosResumo.calorias.toFixed(1)}
            </p>
          </div>
          <div className="bg-emerald-950/40 p-3 rounded-lg">
            <p className="text-xs text-white">Proteína total (g)</p>
            <p className="text-lg font-semibold text-white">
              {macrosResumo.proteinas.toFixed(1)}
            </p>
          </div>
          <div className="bg-amber-950/40 p-3 rounded-lg">
            <p className="text-xs text-white">Carbo total (g)</p>
            <p className="text-lg font-semibold text-white">
              {macrosResumo.carboidratos.toFixed(1)}
            </p>
          </div>
          <div className="bg-purple-950/40 p-3 rounded-lg">
            <p className="text-xs text-white">Gordura total (g)</p>
            <p className="text-lg font-semibold text-white">
              {macrosResumo.gorduras.toFixed(1)}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-zinc-200" />
          <h2 className="text-lg font-semibold">
            Check-ins recentes e comentários do professor
          </h2>
        </div>

        {loadingCheckins && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando check-ins...
          </div>
        )}

        {!loadingCheckins && checkinsOrdenados.length === 0 && (
          <p className="text-sm text-zinc-400">
            Ainda não há check-ins de dieta para este aluno.
          </p>
        )}

        <div className="space-y-4">
          {checkinsOrdenados.map((checkin) => {
            const status = mapCheckinStatus(checkin)
            return (
              <div
                key={checkin.id}
                className="border border-zinc-700 rounded-lg p-4 bg-zinc-900"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant={status.variant}>{status.text}</Badge>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-white">
                    {checkin.dietaDia.titulo}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {format(new Date(checkin.iniciadoEm), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>

                <p className="text-sm text-zinc-200">
                  Refeições concluídas: {checkin.refeicoes.filter((ref) => ref.concluida).length}
                  /{checkin.refeicoes.length}
                </p>

                {checkin.observacaoDia && (
                  <p className="text-sm text-zinc-200 mt-2">
                    <strong>Observação do aluno:</strong> {checkin.observacaoDia}
                  </p>
                )}

                <div className="mt-3">
                  <Textarea
                    label="Comentário do professor"
                    rows={2}
                    value={
                      comentariosProfessor[checkin.id] ??
                      checkin.comentarioProfessor ??
                      ""
                    }
                    onChange={(event) =>
                      setComentariosProfessor((prev) => ({
                        ...prev,
                        [checkin.id]: event.target.value,
                      }))
                    }
                    placeholder="Feedback para reforçar consistência e ajustes"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => handleSaveProfessorComment(checkin.id)}
                    isLoading={comentarCheckinProfessor.isLoading}
                  >
                    Salvar comentário
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
