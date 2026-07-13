import React from "react"
import { AlertCircle, Loader2, Minus, TrendingDown, TrendingUp } from "lucide-react"
import { Card } from "../components/ui"
import { useHistorico } from "../hooks/useHistorico"
import type { HistoricoEvolucao, MetricaEvolucao } from "../types/historico"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface GraficoEvolucaoProps {
  alunoId: string
  metrica: MetricaEvolucao
}

type TendenciaPositiva = "maior" | "menor"
type TomGrafico = "success" | "danger" | "info" | "muted"

interface MetricaConfig {
  label: string
  unidade: string
  tendenciaPositiva?: TendenciaPositiva
}

interface PontoGrafico {
  item: HistoricoEvolucao
  valor: number
  x: number
  y: number
}

const metricas: Record<MetricaEvolucao, MetricaConfig> = {
  pesoKg: { label: "Peso (kg)", unidade: "kg" },
  cinturaCm: { label: "Cintura (cm)", unidade: "cm", tendenciaPositiva: "menor" },
  quadrilCm: { label: "Quadril (cm)", unidade: "cm" },
  pescocoCm: { label: "Pescoço (cm)", unidade: "cm" },
  percentualGordura: {
    label: "% Gordura",
    unidade: "%",
    tendenciaPositiva: "menor",
  },
  massaMagraKg: {
    label: "Massa magra estimada (kg)",
    unidade: "kg",
    tendenciaPositiva: "maior",
  },
  bracoEsquerdoCm: { label: "Braço Esquerdo (cm)", unidade: "cm" },
  bracoDireitoCm: { label: "Braço Direito (cm)", unidade: "cm" },
  pernaEsquerdaCm: { label: "Perna Esquerda (cm)", unidade: "cm" },
  pernaDireitaCm: { label: "Perna Direita (cm)", unidade: "cm" },
}

const numeroFormatado = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const percentualFormatado = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const tonsGrafico: Record<
  TomGrafico,
  {
    text: string
    bg: string
    border: string
    stroke: string
    fill: string
    point: string
  }
> = {
  success: {
    text: "text-[color:var(--student-success)]",
    bg: "bg-[color:var(--student-success-surface)]",
    border: "border-[color:rgba(125,224,211,0.45)]",
    stroke: "var(--student-success)",
    fill: "rgba(125, 224, 211, 0.2)",
    point: "border-[color:var(--student-success)] bg-[color:var(--student-success)]",
  },
  danger: {
    text: "text-[color:var(--student-danger)]",
    bg: "bg-[color:var(--student-danger-surface)]",
    border: "border-[color:rgba(239,68,68,0.45)]",
    stroke: "var(--student-danger)",
    fill: "rgba(253, 164, 175, 0.16)",
    point: "border-[color:var(--student-danger)] bg-[color:var(--student-danger)]",
  },
  info: {
    text: "text-[color:var(--student-info)]",
    bg: "bg-[color:var(--student-info-surface)]",
    border: "border-[color:var(--student-border-strong)]",
    stroke: "var(--student-info)",
    fill: "rgba(183, 192, 255, 0.18)",
    point: "border-[color:var(--student-info)] bg-[color:var(--student-info)]",
  },
  muted: {
    text: "text-[color:var(--student-text-muted)]",
    bg: "bg-[color:var(--student-surface)]",
    border: "border-[color:var(--student-border)]",
    stroke: "var(--student-text-muted)",
    fill: "rgba(166, 166, 166, 0.12)",
    point: "border-[color:var(--student-text-muted)] bg-[color:var(--student-text-muted)]",
  },
}

const statCardClasses = {
  info: "bg-[color:var(--student-info-surface)] border-[color:var(--student-border-strong)] text-[color:var(--student-info)]",
  success:
    "bg-[color:var(--student-success-surface)] border-[color:rgba(125,224,211,0.45)] text-[color:var(--student-success)]",
  warning:
    "bg-[color:var(--student-warning-surface)] border-[color:rgba(241,211,139,0.45)] text-[color:var(--student-warning)]",
  neutral:
    "bg-[color:var(--student-surface)] border-[color:var(--student-border)] text-[color:var(--student-text)]",
}

const formatarValor = (valor: number, unidade: string) => {
  const valorFormatado = numeroFormatado.format(valor)
  return unidade === "%" ? `${valorFormatado}%` : `${valorFormatado} ${unidade}`
}

const formatarDelta = (valor: number, unidade: string) => {
  const sinal = valor > 0 ? "+" : ""
  return unidade === "%"
    ? `${sinal}${percentualFormatado.format(valor)}%`
    : `${sinal}${numeroFormatado.format(valor)} ${unidade}`
}

const normalizarValor = (item: HistoricoEvolucao, metrica: MetricaEvolucao) => {
  const valor = Number(item[metrica])
  return Number.isFinite(valor) ? valor : null
}

const calcularTomGrafico = (
  diferenca: number,
  tendenciaPositiva?: TendenciaPositiva,
): TomGrafico => {
  if (Math.abs(diferenca) < 0.05) return "muted"

  if (!tendenciaPositiva) return "info"

  const subiu = diferenca > 0
  const favoravel =
    (subiu && tendenciaPositiva === "maior") ||
    (!subiu && tendenciaPositiva === "menor")

  return favoravel ? "success" : "danger"
}

export const GraficoEvolucao: React.FC<GraficoEvolucaoProps> = ({
  alunoId,
  metrica,
}) => {
  const chartId = React.useId().replace(/:/g, "")
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const { data: historico, isLoading, error } = useHistorico(alunoId)

  if (isLoading) {
    return (
      <Card>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[color:var(--student-info)]" />
          <p className="text-[color:var(--student-text-soft)]">Carregando evolução...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2 border-[color:rgba(239,68,68,0.45)] bg-[color:var(--student-danger-surface)]">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-[color:var(--student-danger)]" />
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-[color:var(--student-text)]">
              Erro ao carregar gráfico
            </h3>
            <p className="text-[color:var(--student-text)]">{error.message}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!historico || historico.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-[color:var(--student-text-muted)]" />
          <h3 className="mb-2 text-lg font-medium text-[color:var(--student-text)]">
            Nenhum histórico disponível
          </h3>
          <p className="text-[color:var(--student-text-muted)]">
            Adicione o primeiro registro para visualizar a evolução
          </p>
        </div>
      </Card>
    )
  }

  const configMetrica = metricas[metrica]
  const dadosFiltrados = [...historico]
    .map((item) => ({
      item,
      valor: normalizarValor(item, metrica),
    }))
    .filter(
      (registro): registro is { item: HistoricoEvolucao; valor: number } =>
        registro.valor !== null,
    )
    .sort(
      (a, b) =>
        new Date(a.item.dataRegistro).getTime() -
        new Date(b.item.dataRegistro).getTime(),
    )

  if (dadosFiltrados.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-[color:var(--student-text-muted)]" />
          <h3 className="mb-2 text-lg font-medium text-[color:var(--student-text)]">
            Sem dados para {configMetrica.label}
          </h3>
          <p className="text-[color:var(--student-text-muted)]">
            Nenhum registro contém esta medida
          </p>
        </div>
      </Card>
    )
  }

  const valores = dadosFiltrados.map((registro) => registro.valor)
  const valorInicial = valores[0]
  const valorAtual = valores[valores.length - 1]
  const valorMinimo = Math.min(...valores)
  const valorMaximo = Math.max(...valores)
  const valorMedio = valores.reduce((a, b) => a + b, 0) / valores.length
  const diferencaTotal = valorAtual - valorInicial
  const percentualMudanca =
    valorInicial !== 0 ? (diferencaTotal / Math.abs(valorInicial)) * 100 : null
  const amplitude = valorMaximo - valorMinimo
  const margemEscala =
    amplitude > 0
      ? Math.max(amplitude * 0.18, Math.abs(valorMedio) * 0.015, 0.5)
      : Math.max(Math.abs(valorMedio) * 0.05, 1)
  const escalaMin = Math.max(0, valorMinimo - margemEscala)
  const escalaMax = valorMaximo + margemEscala
  const escalaRange = escalaMax - escalaMin || 1
  const mediaY = ((escalaMax - valorMedio) / escalaRange) * 100
  const tomGrafico = calcularTomGrafico(
    diferencaTotal,
    configMetrica.tendenciaPositiva,
  )
  const estiloTom = tonsGrafico[tomGrafico]
  const TrendIcon =
    Math.abs(diferencaTotal) < 0.05
      ? Minus
      : diferencaTotal > 0
        ? TrendingUp
        : TrendingDown
  const tendenciaLabel =
    Math.abs(diferencaTotal) < 0.05
      ? "Estável"
      : diferencaTotal > 0
        ? "Alta"
        : "Queda"

  const pontosGrafico: PontoGrafico[] = dadosFiltrados.map((registro, index) => {
    const x =
      dadosFiltrados.length === 1
        ? 50
        : (index / (dadosFiltrados.length - 1)) * 100
    const y = ((escalaMax - registro.valor) / escalaRange) * 100

    return {
      ...registro,
      x,
      y,
    }
  })

  const pontoAtivo =
    pontosGrafico[
      activeIndex !== null && activeIndex < pontosGrafico.length
        ? activeIndex
        : pontosGrafico.length - 1
    ]
  const linePoints = pontosGrafico
    .map((ponto) => `${ponto.x},${ponto.y}`)
    .join(" ")
  const areaPath =
    pontosGrafico.length > 1
      ? `M ${pontosGrafico[0].x} 100 L ${linePoints.replace(/,/g, " ")} L ${
          pontosGrafico[pontosGrafico.length - 1].x
        } 100 Z`
      : ""
  const tickValues = Array.from({ length: 5 }, (_, index) => {
    const valor = escalaMax - (escalaRange / 4) * index
    return {
      valor,
      y: ((escalaMax - valor) / escalaRange) * 100,
    }
  })
  const xTickIndexes = Array.from(
    new Set(
      dadosFiltrados.length <= 6
        ? dadosFiltrados.map((_, index) => index)
        : Array.from({ length: 5 }, (_, index) =>
            Math.round(((dadosFiltrados.length - 1) / 4) * index),
          ),
    ),
  )
  const tooltipTranslateX =
    pontoAtivo.x < 18
      ? "translateX(0)"
      : pontoAtivo.x > 82
        ? "translateX(-100%)"
        : "translateX(-50%)"
  const tooltipTranslateY =
    pontoAtivo.y < 24
      ? "translateY(0.75rem)"
      : "translateY(calc(-100% - 0.75rem))"
  const cardsResumo: Array<{
    label: string
    value: string
    tone: keyof typeof statCardClasses
  }> = [
    {
      label: "Valor atual",
      value: formatarValor(valorAtual, configMetrica.unidade),
      tone: "info",
    },
    {
      label: "Média",
      value: formatarValor(valorMedio, configMetrica.unidade),
      tone: "success",
    },
    {
      label: "Mínimo",
      value: formatarValor(valorMinimo, configMetrica.unidade),
      tone: "neutral",
    },
    {
      label: "Máximo",
      value: formatarValor(valorMaximo, configMetrica.unidade),
      tone: "warning",
    },
  ]

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-[color:var(--student-text)]">
            <TrendingUp className="h-5 w-5 text-[color:var(--student-info)]" />
            Evolução de {configMetrica.label}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--student-text-muted)]">
            {format(new Date(dadosFiltrados[0].item.dataRegistro), "dd/MM/yyyy", {
              locale: ptBR,
            })}{" "}
            até{" "}
            {format(
              new Date(
                dadosFiltrados[dadosFiltrados.length - 1].item.dataRegistro,
              ),
              "dd/MM/yyyy",
              { locale: ptBR },
            )}
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 ${estiloTom.bg} ${estiloTom.border}`}
        >
          <TrendIcon className={`h-4 w-4 ${estiloTom.text}`} />
          <div className="leading-tight">
            <p className={`text-sm font-semibold ${estiloTom.text}`}>
              {tendenciaLabel} de{" "}
              {formatarDelta(diferencaTotal, configMetrica.unidade)}
            </p>
            {percentualMudanca !== null && (
              <p className="text-xs text-[color:var(--student-text-muted)]">
                {formatarDelta(percentualMudanca, "%")} no período
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] p-3 sm:p-4"
        aria-label={`Gráfico de evolução de ${configMetrica.label}`}
      >
        <div className="relative h-[20rem] md:h-[24rem]">
          <div className="absolute bottom-10 left-0 top-5 w-14">
            {tickValues.map((tick) => (
              <span
                key={tick.valor}
                className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-[color:var(--student-text-muted)]"
                style={{ top: `${tick.y}%` }}
              >
                {formatarValor(tick.valor, configMetrica.unidade)}
              </span>
            ))}
          </div>

          <div
            className="absolute bottom-10 left-14 right-2 top-5 overflow-visible rounded-lg border border-[color:var(--student-border)] bg-[linear-gradient(180deg,rgba(242,242,242,0.045),rgba(242,242,242,0.015))]"
            onMouseLeave={() => setActiveIndex(null)}
          >
            {tickValues.map((tick) => (
              <div
                key={tick.valor}
                className="pointer-events-none absolute left-0 right-0 border-t border-[color:rgba(166,166,166,0.16)]"
                style={{ top: `${tick.y}%` }}
              />
            ))}

            <div
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[color:rgba(125,224,211,0.72)]"
              style={{ top: `${mediaY}%` }}
            >
              <span className="absolute right-2 -top-5 rounded border border-[color:rgba(125,224,211,0.45)] bg-[color:var(--student-surface-strong)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--student-success)]">
                Média
              </span>
            </div>

            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              preserveAspectRatio="none"
              role="img"
              viewBox="0 0 100 100"
            >
              <title>Evolução de {configMetrica.label}</title>
              <defs>
                <linearGradient
                  id={`grafico-evolucao-${chartId}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={estiloTom.fill} />
                  <stop offset="100%" stopColor="rgba(242, 242, 242, 0)" />
                </linearGradient>
              </defs>

              {pontosGrafico.length > 1 ? (
                <>
                  <path
                    d={areaPath}
                    fill={`url(#grafico-evolucao-${chartId})`}
                  />
                  <polyline
                    fill="none"
                    points={linePoints}
                    stroke={estiloTom.stroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              ) : (
                <line
                  stroke={estiloTom.stroke}
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  strokeWidth="1.4"
                  vectorEffect="non-scaling-stroke"
                  x1="0"
                  x2="100"
                  y1={pontosGrafico[0].y}
                  y2={pontosGrafico[0].y}
                />
              )}
            </svg>

            {pontosGrafico.map((ponto, index) => {
              const isActive =
                ponto.item.id === pontoAtivo.item.id &&
                ponto.item.dataRegistro === pontoAtivo.item.dataRegistro

              return (
                <button
                  key={ponto.item.id}
                  type="button"
                  aria-label={`${format(
                    new Date(ponto.item.dataRegistro),
                    "dd/MM/yyyy",
                    { locale: ptBR },
                  )}: ${formatarValor(ponto.valor, configMetrica.unidade)}`}
                  className={`absolute z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--student-surface-strong)] shadow-[0_0_0_2px_rgba(242,242,242,0.12)] transition-transform focus:outline-none focus:ring-2 focus:ring-[color:var(--student-info)] ${
                    isActive ? "scale-125" : "scale-100 hover:scale-125"
                  } ${estiloTom.point}`}
                  style={{ left: `${ponto.x}%`, top: `${ponto.y}%` }}
                  title={`${format(
                    new Date(ponto.item.dataRegistro),
                    "dd/MM/yyyy",
                    { locale: ptBR },
                  )}: ${formatarValor(ponto.valor, configMetrica.unidade)}`}
                  onFocus={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                />
              )
            })}

            <div
              className="pointer-events-none absolute z-30 min-w-36 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] px-3 py-2 text-xs shadow-[var(--student-shadow)]"
              style={{
                left: `${pontoAtivo.x}%`,
                top: `${pontoAtivo.y}%`,
                transform: `${tooltipTranslateX} ${tooltipTranslateY}`,
              }}
            >
              <p className="font-semibold text-[color:var(--student-text)]">
                {formatarValor(pontoAtivo.valor, configMetrica.unidade)}
              </p>
              <p className="mt-1 text-[color:var(--student-text-muted)]">
                {format(new Date(pontoAtivo.item.dataRegistro), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-14 right-2 h-8">
            {xTickIndexes.map((index) => {
              const ponto = pontosGrafico[index]
              const alinhamento =
                ponto.x < 12
                  ? "translateX(0)"
                  : ponto.x > 88
                    ? "translateX(-100%)"
                    : "translateX(-50%)"

              return (
                <span
                  key={`${ponto.item.id}-${index}`}
                  className="absolute top-2 whitespace-nowrap text-[10px] font-medium text-[color:var(--student-text-muted)]"
                  style={{
                    left: `${ponto.x}%`,
                    transform: alinhamento,
                  }}
                >
                  {format(new Date(ponto.item.dataRegistro), "dd/MM", {
                    locale: ptBR,
                  })}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cardsResumo.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border p-3 ${statCardClasses[card.tone]}`}
          >
            <p className="mb-1 text-xs text-[color:var(--student-text-soft)]">
              {card.label}
            </p>
            <p className="text-lg font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-[color:var(--student-text-muted)]">
        Total de registros: {dadosFiltrados.length}
      </p>
    </Card>
  )
}
