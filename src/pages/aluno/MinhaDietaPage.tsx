import React, { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  PlayCircle,
  Save,
  UtensilsCrossed,
} from "lucide-react"
import { Badge, Button, Card, Textarea } from "../../components/ui"
import {
  ActivityProgressSummary,
  CompletionToggle,
} from "../../components/aluno/ActivityCompletionUX"
import { useMyAluno } from "../../hooks/useMyAluno"
import {
  useDietaCheckins,
  useFinalizeDietaCheckin,
  usePlanoDietaAtivo,
  useStartDietaCheckin,
  useUpdateDietaRefeicaoCheckin,
} from "../../hooks/useDieta"
import { formatDiaSemana } from "../../utils/treino"
import { showToast } from "../../utils/toast"
import { TreinoDayNavigator } from "../../components/treino/TreinoDayNavigator"
import type { DietaCheckin } from "../../types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface RefeicaoDraft {
  concluida: boolean
  observacaoAluno: string
}

const sortCheckinRefeicoes = (refeicoes: DietaCheckin["refeicoes"]) => {
  return [...refeicoes].sort(
    (a, b) =>
      (a.dietaRefeicao?.ordem ?? Number.MAX_SAFE_INTEGER) -
      (b.dietaRefeicao?.ordem ?? Number.MAX_SAFE_INTEGER),
  )
}

const normalizeDietaCheckin = (checkin: DietaCheckin): DietaCheckin => ({
  ...checkin,
  refeicoes: sortCheckinRefeicoes(checkin.refeicoes).map((refeicao) => ({
    ...refeicao,
    dietaRefeicao: {
      ...refeicao.dietaRefeicao,
      itens: [...refeicao.dietaRefeicao.itens].sort((a, b) => a.ordem - b.ordem),
    },
  })),
})

const buildDrafts = (checkin: DietaCheckin) => {
  const next: Record<string, RefeicaoDraft> = {}
  for (const item of sortCheckinRefeicoes(checkin.refeicoes)) {
    next[item.dietaRefeicaoId] = {
      concluida: item.concluida,
      observacaoAluno: item.observacaoAluno || "",
    }
  }
  return next
}

const getCompletedMealCount = (
  checkin: DietaCheckin | null,
  drafts: Record<string, RefeicaoDraft>,
) => {
  if (!checkin) {
    return 0
  }

  return checkin.refeicoes.filter((item) => {
    const draft = drafts[item.dietaRefeicaoId]
    return draft ? draft.concluida : item.concluida
  }).length
}

const isMealDraftDirty = (
  refeicao: DietaCheckin["refeicoes"][number],
  draft: RefeicaoDraft,
) =>
  draft.concluida !== refeicao.concluida ||
  draft.observacaoAluno.trim() !== (refeicao.observacaoAluno || "")

export const MinhaDietaPage: React.FC = () => {
  const { data: aluno, isLoading: loadingAluno } = useMyAluno()
  const alunoId = aluno?.id || ""

  const {
    data: planoAtivo,
    isLoading: loadingPlano,
    error: erroPlano,
  } = usePlanoDietaAtivo(alunoId, !!alunoId)
  const {
    data: checkins,
    isLoading: loadingCheckins,
  } = useDietaCheckins(alunoId, 30, !!alunoId)

  const startCheckin = useStartDietaCheckin()
  const updateRefeicao = useUpdateDietaRefeicaoCheckin()
  const finalizeCheckin = useFinalizeDietaCheckin()

  const [selectedDiaId, setSelectedDiaId] = useState("")
  const [checkinAtual, setCheckinAtual] = useState<DietaCheckin | null>(null)
  const [refeicaoDrafts, setRefeicaoDrafts] = useState<Record<string, RefeicaoDraft>>({})
  const [observacaoDia, setObservacaoDia] = useState("")

  const erroPlanoNaoEncontrado =
    erroPlano?.message?.toLowerCase().includes("não encontrado") ||
    erroPlano?.message?.toLowerCase().includes("recurso não encontrado")

  useEffect(() => {
    if (!selectedDiaId && planoAtivo?.dias?.length) {
      setSelectedDiaId(planoAtivo.dias[0].id)
    }
  }, [planoAtivo, selectedDiaId])

  useEffect(() => {
    if (!checkins || checkins.length === 0) {
      return
    }

    const aberto = checkins.find((item) => item.status === "INICIADO")
    if (aberto) {
      setCheckinAtual(normalizeDietaCheckin(aberto))
    }
  }, [checkins])

  useEffect(() => {
    if (!checkinAtual) {
      setRefeicaoDrafts({})
      setObservacaoDia("")
      return
    }
    setRefeicaoDrafts(buildDrafts(checkinAtual))
    setObservacaoDia(checkinAtual.observacaoDia || "")
  }, [checkinAtual])

  const historicoOrdenado = useMemo(() => {
    return [...(checkins || [])].sort(
      (a, b) =>
        new Date(b.iniciadoEm).getTime() - new Date(a.iniciadoEm).getTime(),
    )
  }, [checkins])

  const handleStart = async () => {
    if (!selectedDiaId || !alunoId) {
      showToast.error("Selecione um dia")
      return
    }
    const checkin = await startCheckin.mutateAsync({ dietaDiaId: selectedDiaId, alunoId })
    setCheckinAtual(normalizeDietaCheckin(checkin))
    showToast.success("Dia de dieta iniciado")
  }

  const handleDraftChange = (refeicaoId: string, patch: Partial<RefeicaoDraft>) => {
    setRefeicaoDrafts((prev) => ({
      ...prev,
      [refeicaoId]: {
        ...prev[refeicaoId],
        ...patch,
      },
    }))
  }

  const handleSaveRefeicao = async (dietaRefeicaoId: string) => {
    if (!checkinAtual || !alunoId) return
    const draft = refeicaoDrafts[dietaRefeicaoId]
    if (!draft) return

    const updated = await updateRefeicao.mutateAsync({
      checkinId: checkinAtual.id,
      dietaRefeicaoId,
      alunoId,
      data: {
        concluida: draft.concluida,
        observacaoAluno: draft.observacaoAluno.trim() || undefined,
      },
    })

    setCheckinAtual((prev) => {
      if (!prev) return prev
      return normalizeDietaCheckin({
        ...prev,
        refeicoes: prev.refeicoes.map((ref) => {
          if (ref.dietaRefeicaoId === dietaRefeicaoId) {
            return updated as DietaCheckin["refeicoes"][number]
          }
          return ref
        }),
      })
    })
    showToast.success("Refeição atualizada")
  }

  const handleFinalize = async () => {
    if (!checkinAtual || !alunoId) return
    const done = await finalizeCheckin.mutateAsync({
      checkinId: checkinAtual.id,
      alunoId,
      observacaoDia: observacaoDia.trim() || undefined,
    })
    setCheckinAtual(normalizeDietaCheckin(done))
  }

  const selectedDia = useMemo(() => {
    if (!planoAtivo) {
      return undefined
    }
    return planoAtivo.dias.find((dia) => dia.id === selectedDiaId)
  }, [planoAtivo, selectedDiaId])

  const dayNavigationItems = useMemo(
    () =>
      (planoAtivo?.dias || []).map((dia) => ({
        id: dia.id,
        title: dia.titulo,
        subtitle: formatDiaSemana(dia.diaSemana),
        countLabel: `${dia.refeicoes.length} refeição(ões)`,
      })),
    [planoAtivo],
  )

  const refeicoesOrdenadas = useMemo(() => {
    if (!checkinAtual) {
      return []
    }

    return sortCheckinRefeicoes(checkinAtual.refeicoes)
  }, [checkinAtual])

  const completedMeals = useMemo(
    () => getCompletedMealCount(checkinAtual, refeicaoDrafts),
    [checkinAtual, refeicaoDrafts],
  )

  if (loadingAluno || loadingPlano) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[color:var(--student-info)]" />
        <p className="text-[color:var(--student-text-soft)]">Carregando sua dieta...</p>
      </div>
    )
  }

  if (!aluno) {
    return (
      <Card className="bg-[color:var(--student-warning-surface)] border-2 border-[color:var(--app-warning-border)]">
        <p className="text-[color:var(--student-text)]">
          Não foi possível localizar seu perfil de aluno para carregar a dieta.
        </p>
      </Card>
    )
  }

  if (erroPlano && !erroPlanoNaoEncontrado) {
    return (
      <Card className="bg-[color:var(--student-danger-surface)] border-2 border-[color:var(--app-danger-border)]">
        <p className="text-[color:var(--student-danger)]">{erroPlano.message}</p>
      </Card>
    )
  }

  if (!planoAtivo) {
    return (
      <Card>
        <div className="text-center py-8">
          <UtensilsCrossed className="h-12 w-12 text-[color:var(--student-text-muted)] mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-[color:var(--student-text)] mb-2">
            Dieta ainda não configurada
          </h2>
          <p className="text-[color:var(--student-text-soft)]">
            Seu professor ainda não montou o plano alimentar nesta área.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--student-text)]">Minha Dieta</h1>
        <p className="text-[color:var(--student-text-soft)]">
          {planoAtivo.nome} • {planoAtivo.objetivo.toLowerCase()}
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Metas diárias</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[color:var(--student-info-surface)] rounded-lg p-3">
            <p className="text-xs text-[color:var(--student-text)]">Calorias</p>
            <p className="text-lg font-semibold text-[color:var(--student-text)]">
              {planoAtivo.caloriasMeta.toFixed(0)} kcal
            </p>
          </div>
          <div className="bg-[color:var(--student-success-surface)] rounded-lg p-3">
            <p className="text-xs text-[color:var(--student-text)]">Proteína</p>
            <p className="text-lg font-semibold text-[color:var(--student-text)]">
              {planoAtivo.proteinasMetaG.toFixed(0)} g
            </p>
          </div>
          <div className="bg-[color:var(--student-warning-surface)] rounded-lg p-3">
            <p className="text-xs text-[color:var(--student-text)]">Carboidrato</p>
            <p className="text-lg font-semibold text-[color:var(--student-text)]">
              {planoAtivo.carboidratosMetaG.toFixed(0)} g
            </p>
          </div>
          <div className="bg-[color:var(--student-info-surface)] rounded-lg p-3">
            <p className="text-xs text-[color:var(--student-text)]">Gordura</p>
            <p className="text-lg font-semibold text-[color:var(--student-text)]">
              {planoAtivo.gordurasMetaG.toFixed(0)} g
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Selecionar dia alimentar</h2>
        <TreinoDayNavigator
          days={dayNavigationItems}
          selectedDayId={selectedDiaId}
          onSelectDay={setSelectedDiaId}
          label="Dias da minha dieta"
          mobileLabel="Dias da dieta"
          idPrefix="dieta-day"
        />
        <div className="mt-4">
          <Button
            icon={PlayCircle}
            onClick={handleStart}
            isLoading={startCheckin.isLoading}
            disabled={!!checkinAtual && checkinAtual.status !== "CONCLUIDO"}
          >
            {checkinAtual && checkinAtual.status !== "CONCLUIDO"
              ? "Dia em andamento"
              : "Iniciar dia da dieta"}
          </Button>
        </div>
      </Card>

      {selectedDia && (
        <div
          id={`dieta-day-panel-${selectedDia.id}`}
          role="tabpanel"
          aria-labelledby={`dieta-day-tab-${selectedDia.id}`}
          className="space-y-6"
        >
          <Card>
            <h2 className="text-lg font-semibold mb-2">
              Refeições planejadas: {selectedDia.titulo}
            </h2>
            {selectedDia.observacoes && (
              <p className="mb-3 text-sm text-[color:var(--student-text-soft)]">
                {selectedDia.observacoes}
              </p>
            )}
            <div className="space-y-3">
              {selectedDia.refeicoes.map((refeicao) => {
                const totalKcal = refeicao.itens.reduce(
                  (acc, item) => acc + item.calorias,
                  0,
                )

                return (
                  <div
                    key={refeicao.id}
                    className="rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[color:var(--student-text)]">
                        {refeicao.nome}
                      </p>
                      <Badge>{refeicao.horario || "Horário livre"}</Badge>
                      <Badge variant="success">{totalKcal.toFixed(0)} kcal</Badge>
                    </div>
                    {refeicao.observacoes && (
                      <p className="mb-3 text-sm text-[color:var(--student-text-soft)]">
                        {refeicao.observacoes}
                      </p>
                    )}
                    <div className="space-y-2">
                      {refeicao.itens.map((item) => (
                        <div
                          key={item.id}
                          className="rounded border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-2 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <strong>{item.alimento.nome}</strong>
                            <Badge>{item.quantidadeGramas}g</Badge>
                            <Badge variant="success">{item.calorias} kcal</Badge>
                          </div>
                          <p className="mt-1 text-xs text-[color:var(--student-text-soft)]">
                            P {item.proteinas}g • C {item.carboidratos}g • G {item.gorduras}g
                          </p>
                          {item.observacoes && (
                            <p className="mt-1 text-xs text-[color:var(--student-text-soft)]">
                              {item.observacoes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {checkinAtual && (
        <div data-onboarding-target="onboarding-meal-checkin">
          <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-semibold">
              Check-in atual: {checkinAtual.dietaDia.titulo}
            </h2>
            <Badge variant={checkinAtual.status === "CONCLUIDO" ? "success" : "warning"}>
              {checkinAtual.status === "CONCLUIDO" ? "Concluído" : "Em andamento"}
            </Badge>
          </div>

          <ActivityProgressSummary
            completed={completedMeals}
            total={checkinAtual.refeicoes.length}
            label="Progresso da dieta"
            completedLabel="refeição(ões) concluída(s)"
            remainingLabel="refeição(ões) restante(s)"
          />

          <div className="space-y-4">
            {refeicoesOrdenadas.map((refeicao) => {
              const draft = refeicaoDrafts[refeicao.dietaRefeicaoId] || {
                concluida: false,
                observacaoAluno: "",
              }
              const totalKcal = refeicao.dietaRefeicao.itens.reduce(
                (acc, item) => acc + item.calorias,
                0,
              )
              const isCompleted = draft.concluida
              const hasPendingChange = isMealDraftDirty(refeicao, draft)

              return (
                <div
                  key={refeicao.id}
                  className={`rounded-lg border p-4 transition-colors duration-200 motion-reduce:transition-none ${
                    isCompleted
                      ? "border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)]"
                      : "border-[color:var(--student-border)] bg-[color:var(--student-surface)]"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 mb-3 lg:flex-row lg:items-start">
                    <div>
                      <h3 className="font-semibold text-[color:var(--student-text)]">
                        {refeicao.dietaRefeicao.nome}
                      </h3>
                      <p className="text-xs text-[color:var(--student-text-soft)]">
                        {refeicao.dietaRefeicao.horario || "Horário livre"} •{" "}
                        {totalKcal.toFixed(0)} kcal
                      </p>
                    </div>
                    <CompletionToggle
                      checked={draft.concluida}
                      pendingChange={hasPendingChange}
                      title={refeicao.dietaRefeicao.nome}
                      description={
                        draft.concluida
                          ? "Registrada no progresso da dieta"
                          : "Toque para marcar como feita"
                      }
                      checkedLabel="Refeição concluída"
                      uncheckedLabel="Refeição pendente"
                      icon={UtensilsCrossed}
                      onChange={(checked) =>
                        handleDraftChange(refeicao.dietaRefeicaoId, {
                          concluida: checked,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2 mb-3">
                    {refeicao.dietaRefeicao.itens.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded border border-[color:var(--student-border)] bg-[color:var(--student-surface)] text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <strong>{item.alimento.nome}</strong>
                          <Badge>{item.quantidadeGramas}g</Badge>
                          <Badge variant="success">{item.calorias} kcal</Badge>
                        </div>
                        <p className="text-xs text-[color:var(--student-text-soft)] mt-1">
                          P {item.proteinas}g • C {item.carboidratos}g • G {item.gorduras}g
                        </p>
                      </div>
                    ))}
                  </div>

                  <Textarea
                    label="Observação na refeição"
                    rows={2}
                    value={draft.observacaoAluno}
                    onChange={(e) =>
                      handleDraftChange(refeicao.dietaRefeicaoId, {
                        observacaoAluno: e.target.value,
                      })
                    }
                    placeholder="Ex: troquei arroz por batata"
                  />

                  <Button
                    variant="secondary"
                    icon={Save}
                    onClick={() => handleSaveRefeicao(refeicao.dietaRefeicaoId)}
                    isLoading={updateRefeicao.isLoading}
                  >
                    Salvar refeição
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="mt-4">
            <Textarea
              label="Observação geral do dia"
              rows={3}
              value={observacaoDia}
              onChange={(e) => setObservacaoDia(e.target.value)}
              placeholder="Como foi o dia alimentar? Fome, saciedade, trocas etc."
            />
            <Button
              icon={CheckCircle2}
              onClick={handleFinalize}
              isLoading={finalizeCheckin.isLoading}
              disabled={checkinAtual.status === "CONCLUIDO"}
            >
              {checkinAtual.status === "CONCLUIDO"
                ? "Dia já finalizado"
                : "Marcar dia como concluído"}
            </Button>
          </div>
          </Card>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Histórico de dias alimentares</h2>
        </div>

        {loadingCheckins && (
          <div className="flex items-center gap-2 text-[color:var(--student-text-soft)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando histórico...
          </div>
        )}

        {!loadingCheckins && historicoOrdenado.length === 0 && (
          <p className="text-sm text-[color:var(--student-text-muted)]">Nenhum dia registrado ainda.</p>
        )}

        <div className="space-y-3">
          {historicoOrdenado.map((item) => (
            <div key={item.id} className="border border-[color:var(--student-border)] rounded-lg p-3 bg-[color:var(--student-surface)]">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant={item.status === "CONCLUIDO" ? "success" : "warning"}>
                  {item.status === "CONCLUIDO" ? "Concluído" : "Em andamento"}
                </Badge>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[color:var(--student-surface-soft)] border border-[color:var(--student-border)] text-[color:var(--student-text)]">
                  {item.dietaDia.titulo}
                </span>
                <span className="text-xs text-[color:var(--student-text-muted)]">
                  {format(new Date(item.iniciadoEm), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <p className="text-sm text-[color:var(--student-text-soft)]">
                Refeições feitas: {item.refeicoes.filter((ref) => ref.concluida).length}/
                {item.refeicoes.length}
              </p>
              {item.observacaoDia && (
                <p className="text-sm text-[color:var(--student-text-soft)] mt-1">
                  <strong>Observação:</strong> {item.observacaoDia}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
