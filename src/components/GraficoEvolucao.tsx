import React from "react"
import { Loader2, AlertCircle, TrendingUp } from "lucide-react"
import { Card } from "../components/ui"
import { useHistorico } from "../hooks/useHistorico"
import type { MetricaEvolucao } from "../types/historico"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface GraficoEvolucaoProps {
  alunoId: string
  metrica: MetricaEvolucao
}

const nomesMetricas: Record<MetricaEvolucao, string> = {
  pesoKg: "Peso (kg)",
  cinturaCm: "Cintura (cm)",
  quadrilCm: "Quadril (cm)",
  pescocoCm: "Pescoço (cm)",
  percentualGordura: "% Gordura",
  massaMuscularKg: "Massa Muscular (kg)",
  bracoEsquerdoCm: "Braço Esquerdo (cm)",
  bracoDireitoCm: "Braço Direito (cm)",
  pernaEsquerdaCm: "Perna Esquerda (cm)",
  pernaDireitaCm: "Perna Direita (cm)",
}

export const GraficoEvolucao: React.FC<GraficoEvolucaoProps> = ({
  alunoId,
  metrica,
}) => {
  const { data: historico, isLoading, error } = useHistorico(alunoId)

  if (isLoading) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[color:var(--student-info)]" />
          <p className="text-[color:var(--student-text-soft)]">Carregando evolução...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-[color:var(--student-danger-surface)] border-2 border-[color:var(--app-danger-border)]">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-[color:var(--student-danger)] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[color:var(--student-text)] mb-2">
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
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-[color:var(--student-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[color:var(--student-text)] mb-2">
            Nenhum histórico disponível
          </h3>
          <p className="text-[color:var(--student-text-muted)]">
            Adicione o primeiro registro para visualizar a evolução
          </p>
        </div>
      </Card>
    )
  }

  const dadosFiltrados = [...historico]
    .filter((item) => item[metrica] !== null && item[metrica] !== undefined)
    .sort(
      (a, b) =>
        new Date(a.dataRegistro).getTime() - new Date(b.dataRegistro).getTime(),
    )

  if (dadosFiltrados.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-[color:var(--student-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[color:var(--student-text)] mb-2">
            Sem dados para {nomesMetricas[metrica]}
          </h3>
          <p className="text-[color:var(--student-text-muted)]">Nenhum registro contém esta medida</p>
        </div>
      </Card>
    )
  }

  const valores = dadosFiltrados.map((item) => item[metrica] as number)
  const valorMinimo = Math.min(...valores)
  const valorMaximo = Math.max(...valores)
  const valorMedio = valores.reduce((a, b) => a + b, 0) / valores.length
  const diferencaTotal = valores[valores.length - 1] - valores[0]

  const calcularAltura = (valor: number) => {
    if (valorMinimo === valorMaximo) return 50
    const range = valorMaximo - valorMinimo
    const minHeight = 15
    const maxHeight = 85
    return minHeight + ((valor - valorMinimo) / range) * (maxHeight - minHeight)
  }

  const shouldScrollTimeline = dadosFiltrados.length > 5
  const chartTrackStyle = shouldScrollTimeline
    ? { minWidth: `${dadosFiltrados.length * 56}px` }
    : undefined

  return (
    <Card className="min-w-0 !p-4 sm:!p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução de {nomesMetricas[metrica]}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-[color:var(--student-info-surface)] border border-[color:var(--student-border-strong)] p-3 rounded-lg">
            <p className="text-xs text-[color:var(--student-text-soft)] mb-1">Valor Atual</p>
            <p className="text-lg font-bold text-[color:var(--student-info)]">
              {valores[valores.length - 1].toFixed(1)}
            </p>
          </div>
          <div className="bg-[color:var(--student-success-surface)] border border-[color:var(--app-success-border)] p-3 rounded-lg">
            <p className="text-xs text-[color:var(--student-text-soft)] mb-1">Média</p>
            <p className="text-lg font-bold text-[color:var(--student-success)]">
              {valorMedio.toFixed(1)}
            </p>
          </div>
          <div className="bg-[color:var(--student-info-surface)] border border-[color:var(--student-border-strong)] p-3 rounded-lg">
            <p className="text-xs text-[color:var(--student-text-soft)] mb-1">Mínimo</p>
            <p className="text-lg font-bold text-[color:var(--student-info)]">
              {valorMinimo.toFixed(1)}
            </p>
          </div>
          <div className="bg-[color:var(--student-warning-surface)] border border-[color:var(--app-warning-border)] p-3 rounded-lg">
            <p className="text-xs text-[color:var(--student-text-soft)] mb-1">Máximo</p>
            <p className="text-lg font-bold text-[color:var(--student-warning)]">
              {valorMaximo.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[color:var(--student-surface)] border border-[color:var(--student-border)] rounded-lg">
          <p className="text-sm text-[color:var(--student-text-soft)]">
            <span className="font-medium text-[color:var(--student-text)]">Evolução total:</span>{" "}
            <span
              className={`font-bold ${
                diferencaTotal > 0 ? "text-[color:var(--student-success)]" : "text-[color:var(--student-danger)]"
              }`}
            >
              {diferencaTotal > 0 ? "+" : ""}
              {diferencaTotal.toFixed(1)}
            </span>
          </p>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto pb-2">
        <div
          className="relative h-80 min-w-full border-l-2 border-b-2 border-[color:var(--student-border)] pl-2 pr-3 md:h-[32rem]"
          style={chartTrackStyle}
        >
          <div
            className={`flex h-full items-end justify-start pb-2 ${
              shouldScrollTimeline ? "gap-3" : "gap-2 sm:gap-4"
            }`}
          >
            {dadosFiltrados.map((item, index) => {
              const altura = calcularAltura(item[metrica] as number)
              const valor = item[metrica] as number
              const barItemStyle = shouldScrollTimeline
                ? { width: "44px", minWidth: "44px" }
                : { flex: "1 1 0", minWidth: "36px" }

              return (
                <div
                  key={item.id}
                  className="group relative flex h-full flex-col items-center justify-end"
                  style={barItemStyle}
                >
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className="relative w-full max-w-20 cursor-pointer rounded-t bg-[color:var(--student-border-strong)] transition-colors hover:bg-[color:var(--student-info)]"
                      style={{ height: `${altura}%`, minHeight: "18px" }}
                      title={`${format(new Date(item.dataRegistro), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}: ${valor.toFixed(1)}`}
                    >
                      <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-[color:var(--student-surface-strong)] text-[color:var(--student-text)] border border-[color:var(--student-border)] text-xs px-2 py-1 rounded whitespace-nowrap">
                          {valor.toFixed(1)}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[color:var(--student-surface-strong)]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {(dadosFiltrados.length <= 10 ||
                    index % Math.ceil(dadosFiltrados.length / 10) === 0) && (
                    <p className="text-[10px] text-[color:var(--student-text-muted)] mt-1 whitespace-nowrap">
                      {format(new Date(item.dataRegistro), "dd/MM", {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div
            className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-[color:var(--student-success)]"
            style={{
              bottom: `calc(${calcularAltura(valorMedio)}% + 0.5rem)`,
            }}
          >
            <span className="absolute left-2 -top-5 text-xs font-medium text-[color:var(--student-success)] bg-[color:var(--student-surface-strong)] border border-[color:var(--student-border)] px-2 sm:left-auto sm:right-2">
              Média: {valorMedio.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-[color:var(--student-text-muted)]">
        <p>
          📊 Total de registros: {dadosFiltrados.length} | Período:{" "}
          {format(new Date(dadosFiltrados[0].dataRegistro), "dd/MM/yyyy", {
            locale: ptBR,
          })}{" "}
          -{" "}
          {format(
            new Date(dadosFiltrados[dadosFiltrados.length - 1].dataRegistro),
            "dd/MM/yyyy",
            { locale: ptBR },
          )}
        </p>
      </div>
    </Card>
  )
}
