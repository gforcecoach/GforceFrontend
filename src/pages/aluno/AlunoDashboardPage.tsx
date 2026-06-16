import React, { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  ClipboardList,
  Dumbbell,
  ExternalLink,
  Flame,
  Loader2,
  MessageSquareText,
  PlayCircle,
  Target,
  UtensilsCrossed,
  Youtube,
} from "lucide-react"
import { format, addDays, endOfWeek, isWithinInterval, set, startOfDay, startOfWeek, subDays, subWeeks } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge, Button, Card } from "../../components/ui"
import { useMyAluno } from "../../hooks/useMyAluno"
import { useHistorico } from "../../hooks/useHistorico"
import { usePlanoDietaAtivo, useDietaCheckins } from "../../hooks/useDieta"
import { usePlanoTreinoAtivo, useTreinoCheckins, useTreinoTimeline } from "../../hooks/useTreino"
import { useLatestYoutubeContent } from "../../hooks/useYoutubeContent"
import { formatDiaSemana } from "../../utils/treino"
import type { TimelineEventoTreino } from "../../types"

type BadgeVariant = "default" | "success" | "warning" | "danger"

interface NextMeal {
  dataHora: Date
  diaTitulo: string
  refeicaoNome: string
}

interface NextWorkout {
  dataHora: Date
  diaTitulo: string
}

interface WorkoutScheduleItem {
  id: string
  diaTitulo: string
  diaSemanaLabel: string
  exerciciosCount: number
  isNext: boolean
}

interface FeedEvent {
  id: string
  dataHora: string
  origem: "TREINO" | "DIETA"
  titulo: string
  descricao: string
  variant: BadgeVariant
}

const getIsoDay = (date: Date): number => {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

const parseTime = (horario: string | null | undefined, ordem: number) => {
  if (horario) {
    const match = horario.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
    if (match) {
      return { hour: Number(match[1]), minute: Number(match[2]) }
    }
  }

  const hourFallback = Math.min(22, 7 + ordem * 3)
  return { hour: hourFallback, minute: 0 }
}

const treinoTimelineLabel = (
  evento: TimelineEventoTreino,
): { titulo: string; variant: BadgeVariant } => {
  switch (evento.tipo) {
    case "TREINO_INICIADO":
      return { titulo: "Treino iniciado", variant: "warning" }
    case "EXERCICIO_CONCLUIDO":
      return { titulo: "Exercício concluído", variant: "success" }
    case "TREINO_FINALIZADO":
      return { titulo: "Treino finalizado", variant: "success" }
    case "COMENTARIO_PROFESSOR":
      return { titulo: "Comentário do professor", variant: "default" }
    default:
      return { titulo: "Treino", variant: "default" }
  }
}

export const AlunoDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: aluno, isLoading: loadingAluno } = useMyAluno()
  const { data: youtubeContent, isLoading: loadingYoutubeContent } = useLatestYoutubeContent()
  const alunoId = aluno?.id || ""

  const {
    data: planoTreino,
    error: treinoError,
    isLoading: loadingTreino,
  } = usePlanoTreinoAtivo(alunoId, !!alunoId)
  const { data: treinoCheckins, isLoading: loadingTreinoCheckins } = useTreinoCheckins(
    alunoId,
    40,
    !!alunoId,
  )
  const { data: treinoTimeline, isLoading: loadingTreinoTimeline } = useTreinoTimeline(
    alunoId,
    60,
    !!alunoId,
  )

  const {
    data: planoDieta,
    error: dietaError,
    isLoading: loadingDieta,
  } = usePlanoDietaAtivo(alunoId, !!alunoId)
  const { data: dietaCheckins, isLoading: loadingDietaCheckins } = useDietaCheckins(
    alunoId,
    40,
    !!alunoId,
  )

  const { data: historico, isLoading: loadingHistorico } = useHistorico(
    alunoId,
    { limite: 30 },
    { enabled: !!alunoId },
  )

  const treinoNaoEncontrado =
    treinoError?.message?.toLowerCase().includes("não encontrado") ||
    treinoError?.message?.toLowerCase().includes("recurso não encontrado")
  const dietaNaoEncontrada =
    dietaError?.message?.toLowerCase().includes("não encontrado") ||
    dietaError?.message?.toLowerCase().includes("recurso não encontrado")

  const proximoTreino = useMemo<NextWorkout | null>(() => {
    if (!planoTreino?.dias?.length) {
      return null
    }

    const now = new Date()
    const hojeInicio = startOfDay(now)
    const concluidosHoje = new Set(
      (treinoCheckins || [])
        .filter((checkin) => {
          if (checkin.status !== "CONCLUIDO") return false
          const data = new Date(checkin.iniciadoEm)
          return data >= hojeInicio
        })
        .map((checkin) => checkin.treinoDiaId),
    )

    const candidates: NextWorkout[] = []

    for (let offset = 0; offset <= 14; offset += 1) {
      const dayBase = addDays(hojeInicio, offset)
      const isoDay = getIsoDay(dayBase)

      for (const dia of planoTreino.dias) {
        if (dia.diaSemana && dia.diaSemana !== isoDay) {
          continue
        }

        if (offset === 0 && concluidosHoje.has(dia.id)) {
          continue
        }

        const dateCandidate = set(dayBase, {
          hours: 6 + (dia.ordem - 1),
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        })

        if (dateCandidate < now) {
          continue
        }

        candidates.push({
          dataHora: dateCandidate,
          diaTitulo: dia.titulo,
        })
      }

      if (candidates.length > 0) {
        break
      }
    }

    if (candidates.length === 0) {
      const first = [...planoTreino.dias].sort((a, b) => a.ordem - b.ordem)[0]
      return first
        ? {
            dataHora: now,
            diaTitulo: first.titulo,
          }
        : null
    }

    candidates.sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
    return candidates[0]
  }, [planoTreino, treinoCheckins])

  const cronogramaTreino = useMemo<WorkoutScheduleItem[]>(() => {
    if (!planoTreino?.dias?.length) {
      return []
    }

    return [...planoTreino.dias]
      .sort((a, b) => a.ordem - b.ordem)
      .map((dia) => ({
        id: dia.id,
        diaTitulo: dia.titulo,
        diaSemanaLabel: dia.diaSemana ? formatDiaSemana(dia.diaSemana) : "Agenda flexível",
        exerciciosCount: dia.exercicios.length,
        isNext: proximoTreino?.diaTitulo === dia.titulo,
      }))
  }, [planoTreino, proximoTreino])

  const proximaRefeicao = useMemo<NextMeal | null>(() => {
    if (!planoDieta?.dias?.length) {
      return null
    }

    const now = new Date()
    const hojeInicio = startOfDay(now)
    const candidates: NextMeal[] = []

    for (let offset = 0; offset <= 7; offset += 1) {
      const dayBase = addDays(hojeInicio, offset)
      const isoDay = getIsoDay(dayBase)

      for (const dia of planoDieta.dias) {
        if (dia.diaSemana && dia.diaSemana !== isoDay) {
          continue
        }

        const refeicoesOrdenadas = [...dia.refeicoes].sort((a, b) => a.ordem - b.ordem)
        for (const refeicao of refeicoesOrdenadas) {
          const { hour, minute } = parseTime(refeicao.horario, refeicao.ordem)
          const dateCandidate = set(dayBase, {
            hours: hour,
            minutes: minute,
            seconds: 0,
            milliseconds: 0,
          })

          if (dateCandidate < now) {
            continue
          }

          candidates.push({
            dataHora: dateCandidate,
            diaTitulo: dia.titulo,
            refeicaoNome: refeicao.nome,
          })
        }
      }

      if (candidates.length > 0) {
        break
      }
    }

    if (candidates.length === 0) {
      const firstDay = [...planoDieta.dias].sort((a, b) => a.ordem - b.ordem)[0]
      const firstMeal = firstDay?.refeicoes?.sort((a, b) => a.ordem - b.ordem)[0]

      if (!firstDay || !firstMeal) {
        return null
      }

      return {
        dataHora: now,
        diaTitulo: firstDay.titulo,
        refeicaoNome: firstMeal.nome,
      }
    }

    candidates.sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
    return candidates[0]
  }, [planoDieta])

  const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 })
  const fimSemana = endOfWeek(new Date(), { weekStartsOn: 1 })

  const checkinsTreinoSemana = useMemo(() => {
    return (treinoCheckins || []).filter((item) =>
      isWithinInterval(new Date(item.iniciadoEm), {
        start: inicioSemana,
        end: fimSemana,
      }),
    ).length
  }, [fimSemana, inicioSemana, treinoCheckins])

  const checkinsDietaSemana = useMemo(() => {
    return (dietaCheckins || []).filter((item) =>
      isWithinInterval(new Date(item.iniciadoEm), {
        start: inicioSemana,
        end: fimSemana,
      }),
    ).length
  }, [dietaCheckins, fimSemana, inicioSemana])

  const progressoSemanaDieta = useMemo(() => {
    const checkinsSemana = (dietaCheckins || []).filter((item) =>
      isWithinInterval(new Date(item.iniciadoEm), {
        start: inicioSemana,
        end: fimSemana,
      }),
    )

    const totalRefeicoes = checkinsSemana.reduce(
      (acc, checkin) => acc + checkin.refeicoes.length,
      0,
    )
    if (totalRefeicoes === 0) {
      return 0
    }

    const refeicoesConcluidas = checkinsSemana.reduce(
      (acc, checkin) => acc + checkin.refeicoes.filter((ref) => ref.concluida).length,
      0,
    )

    return Math.round((refeicoesConcluidas / totalRefeicoes) * 100)
  }, [dietaCheckins, fimSemana, inicioSemana])

  const frequenciaTreino28Dias = useMemo(() => {
    const limite = subDays(new Date(), 28)
    return (treinoCheckins || []).filter(
      (item) => new Date(item.iniciadoEm) >= limite && item.status === "CONCLUIDO",
    ).length
  }, [treinoCheckins])

  const comentariosProfessor = useMemo(() => {
    const commentsFromTreino = (treinoCheckins || [])
      .filter((item) => !!item.comentarioProfessor)
      .map((item) => ({
        id: `treino-${item.id}`,
        origem: "Treino",
        texto: item.comentarioProfessor as string,
        dataHora: item.updatedAt,
      }))

    const commentsFromDieta = (dietaCheckins || [])
      .filter((item) => !!item.comentarioProfessor)
      .map((item) => ({
        id: `dieta-${item.id}`,
        origem: "Dieta",
        texto: item.comentarioProfessor as string,
        dataHora: item.updatedAt,
      }))

    return [...commentsFromTreino, ...commentsFromDieta]
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
      .slice(0, 4)
  }, [dietaCheckins, treinoCheckins])

  const feed = useMemo<FeedEvent[]>(() => {
    const treinoEvents = (treinoTimeline || []).map((evento) => {
      const meta = treinoTimelineLabel(evento)
      return {
        id: `treino-${evento.id}`,
        dataHora: evento.dataHora,
        origem: "TREINO" as const,
        titulo: meta.titulo,
        descricao: `${evento.descricao} • ${evento.treinoDiaTitulo}`,
        variant: meta.variant,
      }
    })

    const dietaEvents = (dietaCheckins || []).flatMap((checkin) => {
      const events: FeedEvent[] = [
        {
          id: `dieta-start-${checkin.id}`,
          dataHora: checkin.iniciadoEm,
          origem: "DIETA",
          titulo: "Dia de dieta iniciado",
          descricao: checkin.dietaDia.titulo,
          variant: "warning",
        },
      ]

      for (const refeicao of checkin.refeicoes.filter((item) => item.concluida)) {
        events.push({
          id: `dieta-refeicao-${refeicao.id}`,
          dataHora: refeicao.updatedAt,
          origem: "DIETA",
          titulo: "Refeição concluída",
          descricao: `${checkin.dietaDia.titulo} • ${refeicao.dietaRefeicao.nome}`,
          variant: "success",
        })
      }

      if (checkin.finalizadoEm) {
        events.push({
          id: `dieta-end-${checkin.id}`,
          dataHora: checkin.finalizadoEm,
          origem: "DIETA",
          titulo: "Dia alimentar finalizado",
          descricao: checkin.dietaDia.titulo,
          variant: "success",
        })
      }

      if (checkin.comentarioProfessor) {
        events.push({
          id: `dieta-prof-${checkin.id}`,
          dataHora: checkin.updatedAt,
          origem: "DIETA",
          titulo: "Comentário do professor",
          descricao: checkin.comentarioProfessor,
          variant: "default",
        })
      }

      return events
    })

    return [...treinoEvents, ...dietaEvents]
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
      .slice(0, 24)
  }, [dietaCheckins, treinoTimeline])

  const serieSemanal = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 8 }).map((_, index) => {
      const shift = 7 - index
      const inicio = startOfWeek(subWeeks(now, shift), { weekStartsOn: 1 })
      const fim = endOfWeek(subWeeks(now, shift), { weekStartsOn: 1 })

      const treino = (treinoCheckins || []).filter((item) =>
        isWithinInterval(new Date(item.iniciadoEm), {
          start: inicio,
          end: fim,
        }),
      ).length

      const dieta = (dietaCheckins || []).filter((item) =>
        isWithinInterval(new Date(item.iniciadoEm), {
          start: inicio,
          end: fim,
        }),
      ).length

      return {
        key: format(inicio, "dd/MM"),
        treino,
        dieta,
      }
    })
  }, [dietaCheckins, treinoCheckins])

  const seriePeso = useMemo(() => {
    return [...(historico || [])]
      .filter((item) => item.pesoKg !== null && item.pesoKg !== undefined)
      .sort(
        (a, b) =>
          new Date(a.dataRegistro).getTime() - new Date(b.dataRegistro).getTime(),
      )
      .slice(-8)
  }, [historico])

  const youtubePublishedLabel = useMemo(() => {
    if (!youtubeContent?.video?.publishedAt) {
      return null
    }

    return format(new Date(youtubeContent.video.publishedAt), "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    })
  }, [youtubeContent?.video?.publishedAt])

  const loadingBase = loadingAluno || loadingHistorico

  if (loadingBase) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[color:var(--student-info)]" />
        <p className="text-[color:var(--student-text-soft)]">Carregando dashboard...</p>
      </div>
    )
  }

  if (!aluno) {
    return (
      <Card className="bg-[color:var(--student-danger-surface)] border-2 border-[color:var(--app-danger-border)]">
        <p className="text-[color:var(--student-danger)]">
          Não foi possível carregar seu perfil de aluno para montar o dashboard.
        </p>
      </Card>
    )
  }

  const maxCheckinSemana = Math.max(
    1,
    ...serieSemanal.flatMap((item) => [item.treino, item.dieta]),
  )
  const fallbackYoutubeChannelUrl = "https://www.youtube.com/@gforce.oficialbr"
  const youtubeChannelUrl = youtubeContent?.channelUrl || fallbackYoutubeChannelUrl
  const valoresPeso = seriePeso.map((item) => item.pesoKg as number)
  const minPeso = valoresPeso.length > 0 ? Math.min(...valoresPeso) : 0
  const maxPeso = valoresPeso.length > 0 ? Math.max(...valoresPeso) : 0
  const mobileDashboardButtonClass = "w-full justify-center text-center sm:w-auto"

  return (
    <div className="min-w-0 space-y-6" data-onboarding-target="onboarding-aluno-dashboard-main">
      <Card
        className="relative overflow-hidden border border-[color:var(--student-border-strong)] bg-[linear-gradient(120deg,_var(--student-warning-surface),_var(--app-surface-strong)_40%,_var(--student-info-surface))] text-[color:var(--student-text)]"
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div data-onboarding-target="onboarding-aluno-dashboard-title">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Dashboard do Aluno
            </h1>
            <p className="text-[color:var(--student-text-soft)] mt-1">
              Bem-vindo, {aluno.user?.nome}. Seu resumo semanal está aqui.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning">
              Semana: {format(inicioSemana, "dd/MM")} - {format(fimSemana, "dd/MM")}
            </Badge>
            <Badge variant="success">
              {checkinsTreinoSemana} treino(s) / {checkinsDietaSemana} dieta(s)
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <Card className="border border-[color:var(--app-success-border)] bg-[color:var(--student-surface-strong)]">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquareText className="h-5 w-5 text-[color:var(--student-success)]" />
            <h2 className="text-lg font-semibold">Recados do professor</h2>
          </div>

          {comentariosProfessor.length === 0 && (
            <div className="rounded-2xl border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-4">
              <p className="text-sm text-[color:var(--student-text-soft)]">
                Quando houver feedback no treino ou na dieta, ele aparece aqui com prioridade.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {comentariosProfessor.map((comment, index) => (
              <div
                key={comment.id}
                className={`rounded-2xl border p-4 ${
                  index === 0
                    ? "border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)]"
                    : "border-[color:var(--student-border)] bg-[color:var(--student-surface)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge>{comment.origem}</Badge>
                  <span className="text-xs text-[color:var(--student-text-soft)]">
                    {format(new Date(comment.dataHora), "dd/MM HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="text-sm text-[color:var(--student-text)] mt-3 leading-7">{comment.texto}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-[color:var(--app-warning-border)] bg-[color:var(--student-surface-strong)]">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-[color:var(--student-warning)]" />
            <h2 className="text-lg font-semibold">Cronograma de treino</h2>
          </div>

          {loadingTreino && (
            <p className="text-sm text-[color:var(--student-text-soft)]">Carregando agenda de treino...</p>
          )}

          {!loadingTreino && proximoTreino && (
            <div className="mb-4 rounded-2xl border border-[color:var(--app-warning-border)] bg-[color:var(--student-warning-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--student-warning)]">
                Próximo treino
              </p>
              <p className="mt-3 text-2xl font-bold text-[color:var(--student-text)]">{proximoTreino.diaTitulo}</p>
              <p className="mt-2 text-sm text-[color:var(--student-text-soft)]">
                {format(proximoTreino.dataHora, "dd/MM/yyyy", { locale: ptBR })} •{" "}
                {formatDiaSemana(getIsoDay(proximoTreino.dataHora))}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  icon={Dumbbell}
                  onClick={() => navigate("/aluno/treino")}
                  className={mobileDashboardButtonClass}
                >
                  Abrir treino dinâmico
                </Button>
                <p className="text-sm text-[color:var(--student-text-soft)]">
                  Seu acesso rápido ao treino do momento está aqui no topo.
                </p>
              </div>
            </div>
          )}

          {!loadingTreino && !proximoTreino && (
            <div className="space-y-3">
              <p className="text-sm text-[color:var(--student-text-soft)]">
                Nenhum plano de treino dinâmico ativo no momento.
              </p>
            </div>
          )}

          {!!cronogramaTreino.length && (
            <div className="grid gap-3 md:grid-cols-2 mt-2">
              {cronogramaTreino.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    item.isNext
                      ? "border-[color:var(--app-warning-border)] bg-[color:var(--student-warning-surface)]"
                      : "border-[color:var(--student-border)] bg-[color:var(--student-surface)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[color:var(--student-text)]">{item.diaTitulo}</p>
                    {item.isNext && <Badge variant="warning">Próximo</Badge>}
                  </div>
                  <p className="text-sm text-[color:var(--student-text-soft)] mt-2">{item.diaSemanaLabel}</p>
                  <p className="text-xs text-[color:var(--student-text-muted)] mt-1">
                    {item.exerciciosCount} exercício(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="relative overflow-hidden border border-[color:var(--student-border-strong)] bg-[linear-gradient(120deg,_var(--app-warning-surface)_0%,_var(--app-surface-strong)_45%,_var(--app-info-surface)_100%)]">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="danger">
                <span className="inline-flex items-center gap-1">
                  <Youtube className="h-3.5 w-3.5" />
                  Canal da G-Force
                </span>
              </Badge>
              {youtubeContent?.stale && <Badge variant="warning">Conteúdo em cache</Badge>}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[color:var(--student-text)]">Vídeo novo da semana</h2>
              {loadingYoutubeContent && (
                <p className="mt-2 text-sm text-[color:var(--student-text-soft)]">Buscando último vídeo...</p>
              )}

              {!loadingYoutubeContent && youtubeContent?.video && (
                <div className="space-y-2 mt-2">
                  <p className="text-xl font-bold text-[color:var(--student-text)] leading-tight">
                    {youtubeContent.video.title}
                  </p>
                  <p className="text-sm text-[color:var(--student-text-soft)]">
                    {youtubeContent.video.channelTitle}
                    {youtubePublishedLabel ? ` • Publicado em ${youtubePublishedLabel}` : ""}
                  </p>
                </div>
              )}

              {!loadingYoutubeContent && !youtubeContent?.video && (
                <p className="mt-2 text-sm text-[color:var(--student-text-soft)]">
                  Não conseguimos carregar o vídeo mais novo agora. Acesse o canal para assistir
                  os conteúdos recentes.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {youtubeContent?.video ? (
                <a
                  href={youtubeContent.video.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full sm:inline-flex sm:w-auto"
                >
                  <Button icon={PlayCircle} className={mobileDashboardButtonClass}>
                    Assistir no YouTube
                  </Button>
                </a>
              ) : null}
              <a
                href={youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full sm:inline-flex sm:w-auto"
              >
                <Button
                  variant="secondary"
                  icon={ExternalLink}
                  className={mobileDashboardButtonClass}
                >
                  Acessar canal da G-Force
                </Button>
              </a>
            </div>
          </div>

          {!loadingYoutubeContent && youtubeContent?.video && (
            <a
              href={youtubeContent.video.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              aria-label={`Abrir vídeo ${youtubeContent.video.title} no YouTube`}
            >
              <div className="relative overflow-hidden rounded-lg border border-[color:var(--student-border)]">
                <img
                  src={youtubeContent.video.thumbnailUrl}
                  alt={`Thumbnail do vídeo ${youtubeContent.video.title}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <PlayCircle className="h-14 w-14 text-[color:var(--student-text)] drop-shadow-xl" />
                </div>
              </div>
            </a>
          )}

          {loadingYoutubeContent && (
            <div className="h-44 animate-pulse rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface-soft)]" />
          )}
        </div>
      </Card>

      {(treinoError && !treinoNaoEncontrado) || (dietaError && !dietaNaoEncontrada) ? (
        <Card className="bg-[color:var(--student-danger-surface)] border-2 border-[color:var(--app-danger-border)]">
          <p className="text-[color:var(--student-danger)]">
            Erro ao carregar parte dos dados do dashboard. Treino:{" "}
            {treinoError?.message || "ok"} | Dieta: {dietaError?.message || "ok"}
          </p>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <UtensilsCrossed className="h-5 w-5 text-[color:var(--student-info)]" />
            <h2 className="text-lg font-semibold">Próxima refeição</h2>
          </div>

          {loadingDieta && (
            <p className="text-sm text-[color:var(--student-text-soft)]">Carregando agenda de dieta...</p>
          )}

          {!loadingDieta && proximaRefeicao && (
            <div className="space-y-2">
              <p className="text-xl font-bold text-[color:var(--student-text)]">{proximaRefeicao.refeicaoNome}</p>
              <p className="text-sm text-[color:var(--student-text-soft)]">
                {proximaRefeicao.diaTitulo} •{" "}
                {format(proximaRefeicao.dataHora, "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </p>
              <Button
                icon={UtensilsCrossed}
                onClick={() => navigate("/aluno/dieta")}
                className={mobileDashboardButtonClass}
              >
                Abrir dieta dinâmica
              </Button>
            </div>
          )}

          {!loadingDieta && !proximaRefeicao && (
            <div className="space-y-3">
              <p className="text-sm text-[color:var(--student-text-soft)]">
                Nenhum plano de dieta dinâmico ativo no momento.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Resumo semanal</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-[color:var(--student-info-surface)] p-3">
              <p className="text-xs text-[color:var(--student-text-soft)]">Treinos na semana</p>
              <p className="text-2xl font-bold text-[color:var(--student-text)]">{checkinsTreinoSemana}</p>
            </div>
            <div className="rounded-lg bg-[color:var(--student-success-surface)] p-3">
              <p className="text-xs text-[color:var(--student-text-soft)]">Check-ins dieta</p>
              <p className="text-2xl font-bold text-[color:var(--student-text)]">{checkinsDietaSemana}</p>
            </div>
            <div className="rounded-lg bg-[color:var(--student-warning-surface)] p-3">
              <p className="text-xs text-[color:var(--student-text-soft)]">Aderência dieta</p>
              <p className="text-2xl font-bold text-[color:var(--student-text)]">{progressoSemanaDieta}%</p>
            </div>
          </div>
          <p className="text-sm text-[color:var(--student-text-soft)]">
            Frequência de treino nos últimos 28 dias:{" "}
            <strong>{frequenciaTreino28Dias} sessão(ões) concluída(s)</strong>.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Check-ins por semana</h2>
          </div>
          <div className="space-y-3">
            {serieSemanal.map((item) => {
              const treinoWidth = (item.treino / maxCheckinSemana) * 100
              const dietaWidth = (item.dieta / maxCheckinSemana) * 100
              return (
                <div key={item.key}>
                  <p className="text-xs text-[color:var(--student-text-soft)] mb-1">Semana {item.key}</p>
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-[color:var(--student-surface-soft)] overflow-hidden">
                      <div className="h-full bg-[color:var(--student-info)] rounded-full" style={{ width: `${treinoWidth}%` }} />
                    </div>
                    <div className="h-2 rounded-full bg-[color:var(--student-surface-soft)] overflow-hidden">
                      <div className="h-full bg-[color:var(--student-success)] rounded-full" style={{ width: `${dietaWidth}%` }} />
                    </div>
                    <p className="text-[11px] text-[color:var(--student-text-muted)]">
                      Treino: {item.treino} | Dieta: {item.dieta}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Evolução de peso</h2>
          </div>

          {seriePeso.length === 0 && (
            <p className="text-sm text-[color:var(--student-text-muted)]">
              Sem registros de evolução com peso para montar o gráfico.
            </p>
          )}

          {seriePeso.length > 0 && (
            <div className="space-y-3">
              <div className="h-44 border-l border-b border-[color:var(--student-border)] px-2 flex items-end gap-2">
                {seriePeso.map((item) => {
                  const peso = item.pesoKg as number
                  const heightPercent =
                    maxPeso === minPeso ? 65 : 20 + ((peso - minPeso) / (maxPeso - minPeso)) * 70
                  return (
                    <div key={item.id} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <div
                        className="w-full rounded-t bg-[color:var(--student-border-strong)]"
                        style={{ height: `${heightPercent}%` }}
                        title={`${peso} kg`}
                      />
                      <span className="text-[10px] text-[color:var(--student-text-muted)]">
                        {format(new Date(item.dataRegistro), "dd/MM")}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-sm text-[color:var(--student-text-soft)]">
                Atual: <strong>{seriePeso[seriePeso.length - 1].pesoKg} kg</strong> | Inicial:{" "}
                <strong>{seriePeso[0].pesoKg} kg</strong>
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Timeline de atividades</h2>
        </div>

        {(loadingTreinoTimeline || loadingTreinoCheckins || loadingDietaCheckins) && (
          <div className="flex items-center gap-2 text-[color:var(--student-text-soft)] mb-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Atualizando feed...
          </div>
        )}

        {feed.length === 0 && (
          <p className="text-sm text-[color:var(--student-text-muted)]">
            Sem atividades ainda. Comece o treino ou dieta para alimentar sua timeline.
          </p>
        )}

        <div className="space-y-3">
          {feed.map((event) => (
            <div key={event.id} className="border border-[color:var(--student-border)] rounded-lg p-3 bg-[color:var(--student-surface)]">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant={event.variant}>{event.titulo}</Badge>
                <Badge>{event.origem}</Badge>
                <span className="text-xs text-[color:var(--student-text-muted)]">
                  {format(new Date(event.dataHora), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <p className="text-sm text-[color:var(--student-text-soft)]">{event.descricao}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
