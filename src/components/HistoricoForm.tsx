import React, { useEffect, useMemo, useState } from "react"
import { Activity, Plus, Calendar } from "lucide-react"
import { Card, Input, Button, Textarea, Select } from "../components/ui"
import { useCreateHistorico } from "../hooks/useHistorico"
import { type CreateHistoricoDTO } from "../types/historico"
import { useAluno } from "../hooks/useAlunos"
import {
  calculateLeanMassKg,
  calculateNavyBodyFat,
} from "../utils/bodyComposition"
import { showToast } from "../utils/toast"
import type { SexoBiologico } from "../types"

interface HistoricoFormProps {
  alunoId: string
  onSuccess?: () => void
}

const initialFormState = {
  pesoKg: "",
  alturaCm: "",
  cinturaCm: "",
  quadrilCm: "",
  pescocoCm: "",
  bracoEsquerdoCm: "",
  bracoDireitoCm: "",
  pernaEsquerdaCm: "",
  pernaDireitaCm: "",
  percentualGordura: "",
  massaMuscularKg: "",
  observacoes: "",
  dataRegistro: "",
}

const round2 = (value: number) => Math.round(value * 100) / 100

export const HistoricoForm: React.FC<HistoricoFormProps> = ({
  alunoId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState(initialFormState)
  const [sexoCalculo, setSexoCalculo] = useState<SexoBiologico | "">("")
  const [autoCalcularComposicao, setAutoCalcularComposicao] = useState(true)
  const createHistorico = useCreateHistorico()
  const { data: aluno } = useAluno(alunoId, { enabled: !!alunoId })

  useEffect(() => {
    if (!sexoCalculo && aluno?.sexoBiologico) {
      setSexoCalculo(aluno.sexoBiologico)
    }
  }, [aluno, sexoCalculo])

  const composicaoCalculada = useMemo(() => {
    if (!sexoCalculo) return null

    const alturaCm = Number(formData.alturaCm || aluno?.alturaCm || 0)
    const cinturaCm = Number(formData.cinturaCm || aluno?.cinturaCm || 0)
    const pescocoCm = Number(formData.pescocoCm || aluno?.pescocoCm || 0)
    const quadrilCm = Number(formData.quadrilCm || aluno?.quadrilCm || 0)
    const pesoKg = Number(formData.pesoKg || aluno?.pesoKg || 0)

    const percentual = calculateNavyBodyFat({
      sexoBiologico: sexoCalculo,
      alturaCm,
      cinturaCm,
      pescocoCm,
      quadrilCm,
    })

    const massaMagra = calculateLeanMassKg(pesoKg, percentual)

    return {
      percentual,
      massaMagra,
    }
  }, [
    aluno?.alturaCm,
    aluno?.cinturaCm,
    aluno?.pescocoCm,
    aluno?.quadrilCm,
    aluno?.pesoKg,
    formData.alturaCm,
    formData.cinturaCm,
    formData.pescocoCm,
    formData.quadrilCm,
    formData.pesoKg,
    sexoCalculo,
  ])

  useEffect(() => {
    if (!autoCalcularComposicao || !composicaoCalculada) return

    const percentualString =
      composicaoCalculada.percentual !== null && composicaoCalculada.percentual !== undefined
        ? String(round2(composicaoCalculada.percentual))
        : ""
    const massaString =
      composicaoCalculada.massaMagra !== null && composicaoCalculada.massaMagra !== undefined
        ? String(round2(composicaoCalculada.massaMagra))
        : ""

    setFormData((prev) => {
      if (
        prev.percentualGordura === percentualString &&
        prev.massaMuscularKg === massaString
      ) {
        return prev
      }
      return {
        ...prev,
        percentualGordura: percentualString,
        massaMuscularKg: massaString,
      }
    })
  }, [autoCalcularComposicao, composicaoCalculada])

  const handleSubmit = async () => {
    try {
      const dataToSend: CreateHistoricoDTO = {
        alunoId,
      }

      if (formData.pesoKg) dataToSend.pesoKg = Number(formData.pesoKg)
      if (formData.alturaCm) dataToSend.alturaCm = Number(formData.alturaCm)
      if (formData.cinturaCm) dataToSend.cinturaCm = Number(formData.cinturaCm)
      if (formData.quadrilCm) dataToSend.quadrilCm = Number(formData.quadrilCm)
      if (formData.pescocoCm) dataToSend.pescocoCm = Number(formData.pescocoCm)
      if (formData.bracoEsquerdoCm)
        dataToSend.bracoEsquerdoCm = Number(formData.bracoEsquerdoCm)
      if (formData.bracoDireitoCm)
        dataToSend.bracoDireitoCm = Number(formData.bracoDireitoCm)
      if (formData.pernaEsquerdaCm)
        dataToSend.pernaEsquerdaCm = Number(formData.pernaEsquerdaCm)
      if (formData.pernaDireitaCm)
        dataToSend.pernaDireitaCm = Number(formData.pernaDireitaCm)
      if (formData.percentualGordura)
        dataToSend.percentualGordura = Number(formData.percentualGordura)
      if (formData.massaMuscularKg)
        dataToSend.massaMuscularKg = Number(formData.massaMuscularKg)
      if (formData.observacoes.trim())
        dataToSend.observacoes = formData.observacoes.trim()
      if (formData.dataRegistro)
        dataToSend.dataRegistro = new Date(formData.dataRegistro).toISOString()

      const hasConteudo = Object.keys(dataToSend).some(
        (key) => key !== "alunoId" && key !== "dataRegistro",
      )
      if (!hasConteudo) {
        showToast.error("Informe pelo menos uma medida ou uma observação.")
        return
      }

      await createHistorico.mutateAsync(dataToSend)

      setFormData(initialFormState)
      onSuccess?.()
    } catch (error) {
      console.error("Erro ao adicionar histórico:", error)
    }
  }

  const isLoading = createHistorico.isLoading

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Adicionar Novo Registro de Evolução
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[color:var(--student-text-soft)] mb-1">
            Data do Registro
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-[color:var(--student-text-muted)]" />
            </div>
            <input
              type="datetime-local"
              value={formData.dataRegistro}
              onChange={(e) =>
                setFormData({ ...formData, dataRegistro: e.target.value })
              }
              className="w-full pl-10 pr-3 py-2 bg-[color:var(--student-surface)] text-[color:var(--student-text)] border border-[color:var(--student-border)] rounded-lg focus:ring-2 focus:ring-[color:var(--student-border-strong)] focus:border-transparent"
            />
          </div>
          <p className="text-xs text-[color:var(--student-text-muted)] mt-1">
            Deixe em branco para usar a data/hora atual
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Input
            label="Peso (kg)"
            type="number"
            step="0.1"
            value={formData.pesoKg}
            onChange={(e) =>
              setFormData({ ...formData, pesoKg: e.target.value })
            }
            placeholder="75.5"
            min="30"
            max="300"
          />
          <Input
            label="Altura (cm)"
            type="number"
            value={formData.alturaCm}
            onChange={(e) =>
              setFormData({ ...formData, alturaCm: e.target.value })
            }
            placeholder="175"
            min="100"
            max="250"
          />
          <Input
            label="Cintura (cm)"
            type="number"
            step="0.1"
            value={formData.cinturaCm}
            onChange={(e) =>
              setFormData({ ...formData, cinturaCm: e.target.value })
            }
            placeholder="80"
          />
          <Input
            label="Quadril (cm)"
            type="number"
            step="0.1"
            value={formData.quadrilCm}
            onChange={(e) =>
              setFormData({ ...formData, quadrilCm: e.target.value })
            }
            placeholder="95"
          />
          <Input
            label="Pescoço (cm)"
            type="number"
            step="0.1"
            value={formData.pescocoCm}
            onChange={(e) =>
              setFormData({ ...formData, pescocoCm: e.target.value })
            }
            placeholder="38"
          />
        </div>

        <div className="mt-2 p-3 rounded-lg border border-[color:var(--student-border-strong)] bg-[color:var(--student-info-surface)]">
          <p className="text-sm font-medium text-[color:var(--student-text)]">
            Cálculo automático de composição corporal (Navy)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <Select
              label="Sexo biológico"
              value={sexoCalculo}
              onChange={(e) =>
                setSexoCalculo(e.target.value as SexoBiologico | "")
              }
            >
              <option value="" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                Selecione
              </option>
              <option value="MASCULINO" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                Masculino
              </option>
              <option value="FEMININO" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                Feminino
              </option>
            </Select>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-[color:var(--student-text-soft)]">
                <input
                  type="checkbox"
                  checked={autoCalcularComposicao}
                  onChange={(e) => setAutoCalcularComposicao(e.target.checked)}
                />
                Preencher automaticamente
              </label>
            </div>
            <div className="text-xs text-[color:var(--student-text)] flex items-end">
              Preencha altura, cintura e pescoço. Para mulheres, inclua quadril.
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-[color:var(--student-text-soft)] mb-3">
            Medidas de Membros
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Braço Esquerdo (cm)"
              type="number"
              step="0.1"
              value={formData.bracoEsquerdoCm}
              onChange={(e) =>
                setFormData({ ...formData, bracoEsquerdoCm: e.target.value })
              }
              placeholder="35.5"
            />
            <Input
              label="Braço Direito (cm)"
              type="number"
              step="0.1"
              value={formData.bracoDireitoCm}
              onChange={(e) =>
                setFormData({ ...formData, bracoDireitoCm: e.target.value })
              }
              placeholder="36.0"
            />
            <Input
              label="Perna Esquerda (cm)"
              type="number"
              step="0.1"
              value={formData.pernaEsquerdaCm}
              onChange={(e) =>
                setFormData({ ...formData, pernaEsquerdaCm: e.target.value })
              }
              placeholder="55.0"
            />
            <Input
              label="Perna Direita (cm)"
              type="number"
              step="0.1"
              value={formData.pernaDireitaCm}
              onChange={(e) =>
                setFormData({ ...formData, pernaDireitaCm: e.target.value })
              }
              placeholder="55.5"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-[color:var(--student-text-soft)] mb-3">
            Composição Corporal
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="% Gordura"
              type="number"
              step="0.1"
              value={formData.percentualGordura}
              onChange={(e) =>
                setFormData({ ...formData, percentualGordura: e.target.value })
              }
              placeholder="15.5"
              min="0"
              max="100"
              readOnly={autoCalcularComposicao}
            />
            <Input
              label="Massa Muscular (kg)"
              type="number"
              step="0.1"
              value={formData.massaMuscularKg}
              onChange={(e) =>
                setFormData({ ...formData, massaMuscularKg: e.target.value })
              }
              placeholder="60.0"
              readOnly={autoCalcularComposicao}
            />
          </div>
        </div>

        <Textarea
          label="Observações"
          rows={3}
          value={formData.observacoes}
          onChange={(e) =>
            setFormData({ ...formData, observacoes: e.target.value })
          }
          placeholder="Ex: Boa evolução, aumento de massa muscular visível..."
        />
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleSubmit}
          icon={Plus}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Adicionar Registro
        </Button>
      </div>
    </Card>
  )
}
