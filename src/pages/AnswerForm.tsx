import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Activity,
  Heart,
  Plus,
  ArrowLeft,
  Loader2,
  Save,
  RotateCcw,
  UserCheck,
  AlertCircle,
} from "lucide-react"
import { Card, Input, Button, Textarea } from "../components/ui"
import { useCreateAluno, useUpdateAluno, useAluno } from "../hooks/useAlunos"
import { useMyAluno } from "../hooks/useMyAluno"
import { useProfessores } from "../hooks/useProfessores"
import { type CreateAlunoDTO, type UpdateAlunoDTO } from "../types"
import { showToast } from "../utils/toast"
import { logError } from "../utils/logError"
import { useAuth } from "../hooks/useAuth"

const initialFormState = {
  nome: "",
  email: "",
  password: "",
  sexoBiologico: "",
  telefone: "",
  professorId: "",
  alturaCm: "",
  pesoKg: "",
  idade: "",
  cinturaCm: "",
  quadrilCm: "",
  pescocoCm: "",
  dias_treino_semana: "",
  dores_articulares: "",
  frequencia_horarios_refeicoes: "",
  objetivos_atuais: "",
}

const measurementInstructionLinks = [
  {
    label: "Video 1: como tirar medidas",
    href: "https://www.youtube.com/watch?v=jGgLl9kifA0",
  },
  {
    label: "Video 2: postura e pontos de referência",
    href: "https://www.youtube.com/watch?v=qHCtSaETaXc",
  },
]

interface AnswerFormProps {
  embeddedInStudentContext?: boolean
}

export const AnswerForm: React.FC<AnswerFormProps> = ({
  embeddedInStudentContext = false,
}) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const isAluno = user?.role === "ALUNO"
  const isAdmin = user?.role === "ADMIN"
  const isProfessor = user?.role === "PROFESSOR"
  const isEdit = Boolean(id) || isAluno
  const isCreating = !id && !isAluno
  const isAdminEditing = isEdit && isAdmin && !isAluno

  const createAluno = useCreateAluno()
  const updateAluno = useUpdateAluno()

  const { data: professores, isLoading: loadingProfessores } = useProfessores({
    enabled: isAdmin,
  })

  const shouldFetchById = Boolean(id) && !isAluno
  const { data: editingAluno, isLoading: loadingEditAluno } = useAluno(
    shouldFetchById ? id! : "",
    { enabled: shouldFetchById }
  )

  const { data: myAluno, isLoading: loadingMyAluno } = useMyAluno()
  const existingAluno = isAluno ? myAluno : editingAluno
  const loadingAluno = isAluno ? loadingMyAluno : loadingEditAluno
  const alunoSemRegistro = isAluno && !loadingMyAluno && !myAluno

  const [formData, setFormData] = useState(initialFormState)
  const [alimentosDiario, setAlimentosDiario] = useState("")
  const [alimentosNaoCome, setAlimentosNaoCome] = useState("")
  const [alergias, setAlergias] = useState("")
  const [suplementos, setSuplementos] = useState("")
  const [tomaRemedio, setTomaRemedio] = useState<boolean | null>(null)
  const [remediosUso, setRemediosUso] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getBackRoute = () => {
    if (isAdmin) return "/admin/alunos"
    if (isProfessor) return "/professor/dashboard"
    return "/aluno/dashboard"
  }

  useEffect(() => {
    if (isEdit && existingAluno) {
      setFormData({
        nome: existingAluno.user?.nome || "",
        email: existingAluno.user?.email || "",
        password: "",
        professorId: existingAluno.professorId || "",
        sexoBiologico: existingAluno.sexoBiologico || "",
        telefone: existingAluno.telefone || "",
        alturaCm: existingAluno.alturaCm?.toString() || "",
        pesoKg: existingAluno.pesoKg?.toString() || "",
        idade: existingAluno.idade?.toString() || "",
        cinturaCm: existingAluno.cinturaCm?.toString() || "",
        quadrilCm: existingAluno.quadrilCm?.toString() || "",
        pescocoCm: existingAluno.pescocoCm?.toString() || "",
        dias_treino_semana: existingAluno.dias_treino_semana?.toString() || "",
        dores_articulares: existingAluno.dores_articulares || "",
        frequencia_horarios_refeicoes:
          existingAluno.frequencia_horarios_refeicoes || "",
        objetivos_atuais: existingAluno.objetivos_atuais || "",
      })

      setAlimentosDiario(existingAluno.alimentos_quer_diario?.join(", ") || "")
      setAlimentosNaoCome(existingAluno.alimentos_nao_comem?.join(", ") || "")
      setAlergias(existingAluno.alergias_alimentares?.join(", ") || "")
      setSuplementos(existingAluno.suplementos_consumidos?.join(", ") || "")
      setTomaRemedio(existingAluno.toma_remedio ?? null)
      setRemediosUso(existingAluno.remedios_uso || "")
    }
  }, [isEdit, existingAluno])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (isCreating || isAdminEditing) {
      if (!formData.nome.trim()) {
        newErrors.nome = "Nome é obrigatório"
      } else if (formData.nome.trim().length < 2) {
        newErrors.nome = "Nome deve ter pelo menos 2 caracteres"
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email é obrigatório"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email inválido"
      }

      if (isCreating && !formData.password) {
        newErrors.password = "Senha é obrigatória"
      } else if (formData.password && formData.password.length < 6) {
        newErrors.password = "Senha deve ter pelo menos 6 caracteres"
      }

      if (isCreating && isAdmin && !formData.professorId) {
        newErrors.professorId = "Selecione um professor"
      }
    }

    if (formData.dias_treino_semana) {
      const dias = Number(formData.dias_treino_semana)
      if (dias < 0 || dias > 7) {
        newErrors.dias_treino_semana = "Dias de treino deve estar entre 0 e 7"
      }
    }

    if (tomaRemedio === true && !remediosUso.trim()) {
      newErrors.remedios_uso =
        "Informe quais remédios utiliza quando esta opção estiver ativa"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setAlimentosDiario("")
    setAlimentosNaoCome("")
    setAlergias("")
    setSuplementos("")
    setTomaRemedio(null)
    setRemediosUso("")
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast.error("Por favor, corrija os erros no formulário")
      return
    }
    if (isEdit && loadingAluno) {
      showToast.warning("Aguarde o carregamento dos dados...")
      return
    }
    try {
      if (isEdit) {
        if (isAluno && !existingAluno) {
          showToast.error("Erro ao carregar dados do aluno")
          return
        }

        const dataToSend: UpdateAlunoDTO = {}

        if (isAdminEditing) {
          dataToSend.nome = formData.nome.trim()
          dataToSend.email = formData.email.trim()
          if (formData.password) dataToSend.password = formData.password
        }

        if (formData.telefone.trim())
          dataToSend.telefone = formData.telefone.trim()
        if (formData.sexoBiologico)
          dataToSend.sexoBiologico = formData.sexoBiologico as
            | "MASCULINO"
            | "FEMININO"
        if (formData.alturaCm) dataToSend.alturaCm = Number(formData.alturaCm)
        if (formData.pesoKg) dataToSend.pesoKg = Number(formData.pesoKg)
        if (formData.idade) dataToSend.idade = Number(formData.idade)
        if (formData.cinturaCm)
          dataToSend.cinturaCm = Number(formData.cinturaCm)
        if (formData.quadrilCm)
          dataToSend.quadrilCm = Number(formData.quadrilCm)
        if (formData.pescocoCm)
          dataToSend.pescocoCm = Number(formData.pescocoCm)
        if (formData.dias_treino_semana)
          dataToSend.dias_treino_semana = Number(formData.dias_treino_semana)
        if (formData.dores_articulares.trim())
          dataToSend.dores_articulares = formData.dores_articulares.trim()
        if (formData.frequencia_horarios_refeicoes.trim())
          dataToSend.frequencia_horarios_refeicoes =
            formData.frequencia_horarios_refeicoes.trim()
        if (formData.objetivos_atuais.trim())
          dataToSend.objetivos_atuais = formData.objetivos_atuais.trim()
        if (tomaRemedio !== null) dataToSend.toma_remedio = tomaRemedio
        if (tomaRemedio === true && remediosUso.trim())
          dataToSend.remedios_uso = remediosUso.trim()

        const alimentosDiarioArray = alimentosDiario
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (alimentosDiarioArray.length > 0)
          dataToSend.alimentos_quer_diario = alimentosDiarioArray

        const alimentosNaoComeArray = alimentosNaoCome
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (alimentosNaoComeArray.length > 0)
          dataToSend.alimentos_nao_comem = alimentosNaoComeArray

        const alergiasArray = alergias
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (alergiasArray.length > 0)
          dataToSend.alergias_alimentares = alergiasArray

        const suplementosArray = suplementos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (suplementosArray.length > 0)
          dataToSend.suplementos_consumidos = suplementosArray

        const alunoId = isAluno ? existingAluno?.id : id

        if (!alunoId) {
          showToast.error("ID do aluno não encontrado")
          return
        }

        await updateAluno.mutateAsync({ id: alunoId, data: dataToSend })
        showToast.success("✅ Dados atualizados com sucesso!")

        if (!isAluno && !embeddedInStudentContext) {
          setTimeout(() => {
            navigate(getBackRoute())
          }, 300)
        }
      } else {
        const dataToSend: CreateAlunoDTO = {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }

        if (isAdmin && formData.professorId) {
          dataToSend.professorId = formData.professorId
        }

        if (formData.telefone.trim())
          dataToSend.telefone = formData.telefone.trim()
        if (formData.sexoBiologico)
          dataToSend.sexoBiologico = formData.sexoBiologico as
            | "MASCULINO"
            | "FEMININO"
        if (formData.alturaCm) dataToSend.alturaCm = Number(formData.alturaCm)
        if (formData.pesoKg) dataToSend.pesoKg = Number(formData.pesoKg)
        if (formData.idade) dataToSend.idade = Number(formData.idade)
        if (formData.cinturaCm)
          dataToSend.cinturaCm = Number(formData.cinturaCm)
        if (formData.quadrilCm)
          dataToSend.quadrilCm = Number(formData.quadrilCm)
        if (formData.pescocoCm)
          dataToSend.pescocoCm = Number(formData.pescocoCm)
        if (formData.dias_treino_semana)
          dataToSend.dias_treino_semana = Number(formData.dias_treino_semana)
        if (formData.dores_articulares.trim())
          dataToSend.dores_articulares = formData.dores_articulares.trim()
        if (formData.frequencia_horarios_refeicoes.trim())
          dataToSend.frequencia_horarios_refeicoes =
            formData.frequencia_horarios_refeicoes.trim()
        if (formData.objetivos_atuais.trim())
          dataToSend.objetivos_atuais = formData.objetivos_atuais.trim()
        if (tomaRemedio !== null) dataToSend.toma_remedio = tomaRemedio
        if (tomaRemedio === true && remediosUso.trim())
          dataToSend.remedios_uso = remediosUso.trim()

        const alimentosDiarioArray = alimentosDiario
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (alimentosDiarioArray.length > 0)
          dataToSend.alimentos_quer_diario = alimentosDiarioArray

        const alimentosNaoComeArray = alimentosNaoCome
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (alimentosNaoComeArray.length > 0)
          dataToSend.alimentos_nao_comem = alimentosNaoComeArray

        const alergiasArray = alergias
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (alergiasArray.length > 0)
          dataToSend.alergias_alimentares = alergiasArray

        const suplementosArray = suplementos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        if (suplementosArray.length > 0)
          dataToSend.suplementos_consumidos = suplementosArray

        await createAluno.mutateAsync(dataToSend)
        showToast.success("✅ Aluno cadastrado com sucesso!")
        resetForm()
        navigate(getBackRoute())
      }
    } catch (error: unknown) {
      logError("AnswerForm.saveAluno", error)
      if (error instanceof Error) {
        showToast.error(error.message || "Erro ao salvar aluno")
      } else {
        showToast.error("Erro ao salvar aluno")
      }
    }
  }

  if (isCreating && isAdmin && loadingProfessores) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[color:var(--student-info)]" />
        <p className="text-[color:var(--student-text-soft)]">Carregando professores...</p>
      </div>
    )
  }

  if (isEdit && loadingAluno) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[color:var(--student-info)]" />
        <p className="text-[color:var(--student-text-soft)]">Carregando dados...</p>
      </div>
    )
  }

  const isLoading = createAluno.isLoading || updateAluno.isLoading

  if (alunoSemRegistro) {
    return (
      <div>
        <Card className="bg-[color:var(--student-warning-surface)] border-2 border-[color:var(--app-warning-border)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-[color:var(--student-warning)] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[color:var(--student-text)] mb-2">
                Perfil Incompleto
              </h3>
              <p className="text-[color:var(--student-text)] mb-4">
                Seu cadastro de aluno ainda não foi completado. Entre em contato
                com seu professor ou administrador para finalizar seu registro.
              </p>
              <p className="text-sm text-[color:var(--student-warning)]">
                <strong>Usuário:</strong> {user?.nome} ({user?.email})
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  return (
    <div data-onboarding-target="onboarding-student-form">
      {!embeddedInStudentContext && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {!isAluno && (
              <button
                onClick={() => navigate(getBackRoute())}
                className="p-2 hover:bg-[color:var(--student-surface-soft)] rounded-lg transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-[color:var(--student-text)]">
              {isAluno ? "Meu Perfil" : isEdit ? "Editar Aluno" : "Novo Aluno"}
            </h1>
          </div>

          {isCreating && (
            <Button
              variant="secondary"
              icon={RotateCcw}
              onClick={resetForm}
              disabled={isLoading}
            >
              Limpar Formulário
            </Button>
          )}
        </div>
      )}

      {isCreating && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados de Acesso
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome Completo *"
              icon={User}
              value={formData.nome}
              onChange={(e) => {
                setFormData({ ...formData, nome: e.target.value })
                setErrors({ ...errors, nome: "" })
              }}
              placeholder="João Silva"
              error={errors.nome}
              required
            />
            <Input
              label="Email *"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setErrors({ ...errors, email: "" })
              }}
              placeholder="joao@email.com"
              error={errors.email}
              required
            />
            <Input
              label="Senha Temporária *"
              icon={Lock}
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                setErrors({ ...errors, password: "" })
              }}
              placeholder="Mínimo 6 caracteres"
              error={errors.password}
              required
            />
            <Input
              label="Telefone"
              icon={Phone}
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
              placeholder="(11) 98765-4321"
            />
            <div>
              <label className="block text-sm font-medium text-[color:var(--student-text)] mb-1">
                Sexo biológico (para cálculos)
              </label>
              <select
                value={formData.sexoBiologico}
                onChange={(e) =>
                  setFormData({ ...formData, sexoBiologico: e.target.value })
                }
                className="w-full px-3 py-2 bg-[color:var(--student-surface)] text-[color:var(--student-text)] border border-[color:var(--student-border)] rounded-lg focus:ring-2 focus:ring-[color:var(--student-border-strong)] focus:border-transparent transition-colors"
              >
                <option value="" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                  Não informado
                </option>
                <option value="MASCULINO" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                  Masculino
                </option>
                <option value="FEMININO" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                  Feminino
                </option>
              </select>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-[color:var(--student-text)] mb-1">
                Professor Responsável (opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-[color:var(--student-text-muted)]" />
                </div>
                <select
                  value={formData.professorId}
                  onChange={(e) => {
                    setFormData({ ...formData, professorId: e.target.value })
                    setErrors({ ...errors, professorId: "" })
                  }}
                  className={`w-full pl-10 pr-3 py-2 bg-[color:var(--student-surface)] text-[color:var(--student-text)] border rounded-lg focus:ring-2 focus:ring-[color:var(--student-border-strong)] focus:border-transparent transition-colors ${
                    errors.professorId ? "border-[color:var(--student-danger)]" : "border-[color:var(--student-border)]"
                  }`}
                >
                  <option value="" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                    Usar professor padrão
                  </option>
                  {professores?.map((prof) => (
                    <option
                      key={prof.id}
                      value={prof.id}
                      className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]"
                    >
                      {prof.user?.nome || `Professor ${prof.id.slice(0, 8)}`}
                      {prof.especialidade && ` - ${prof.especialidade}`}
                    </option>
                  ))}
                </select>
              </div>
              {errors.professorId && (
                <p className="mt-1 text-sm text-[color:var(--student-danger)]">
                  {errors.professorId}
                </p>
              )}
              <p className="mt-1 text-xs text-[color:var(--student-text-soft)]">
                Se não selecionar, será usado o professor padrão
              </p>
            </div>
          )}

          {isProfessor && (
            <div className="mt-4 p-3 bg-[color:var(--student-info-surface)] border border-[color:var(--student-border-strong)] rounded-lg">
              <p className="text-sm text-[color:var(--student-text)]">
                ℹ️ O aluno será automaticamente vinculado a você
              </p>
            </div>
          )}
        </Card>
      )}

      {isAdminEditing && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Dados de Acesso
          </h2>

          <p className="text-sm text-[color:var(--student-text-soft)] mb-4">
            Atualize nome, email e senha quando necessário. Deixe a senha em
            branco para manter a atual.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome Completo *"
              icon={User}
              value={formData.nome}
              onChange={(e) => {
                setFormData({ ...formData, nome: e.target.value })
                setErrors({ ...errors, nome: "" })
              }}
              placeholder="João Silva"
              error={errors.nome}
              required
            />
            <Input
              label="Email *"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setErrors({ ...errors, email: "" })
              }}
              placeholder="joao@email.com"
              error={errors.email}
              required
            />
            <Input
              label="Nova Senha"
              icon={Lock}
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                setErrors({ ...errors, password: "" })
              }}
              placeholder="Deixe em branco para manter a atual"
              error={errors.password}
            />
          </div>
        </Card>
      )}

      {isEdit && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados Pessoais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              icon={Phone}
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
              placeholder="(11) 98765-4321"
            />
            <Input
              label="Idade"
              icon={Calendar}
              type="number"
              value={formData.idade}
              onChange={(e) =>
                setFormData({ ...formData, idade: e.target.value })
              }
              placeholder="28"
              min="1"
              max="120"
            />
            <div>
              <label className="block text-sm font-medium text-[color:var(--student-text)] mb-1">
                Sexo biológico (para cálculos)
              </label>
              <select
                value={formData.sexoBiologico}
                onChange={(e) =>
                  setFormData({ ...formData, sexoBiologico: e.target.value })
                }
                className="w-full px-3 py-2 bg-[color:var(--student-surface)] text-[color:var(--student-text)] border border-[color:var(--student-border)] rounded-lg focus:ring-2 focus:ring-[color:var(--student-border-strong)] focus:border-transparent transition-colors"
              >
                <option value="" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                  Não informado
                </option>
                <option value="MASCULINO" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                  Masculino
                </option>
                <option value="FEMININO" className="bg-[color:var(--student-surface)] text-[color:var(--student-text)]">
                  Feminino
                </option>
              </select>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Medidas Corporais
        </h2>

        <div className="mb-4 p-4 rounded-lg border border-[color:var(--student-border-strong)] bg-[color:var(--student-info-surface)]">
          <p className="text-sm font-medium text-[color:var(--student-text)]">
            Instruções para tirar medidas
          </p>
          <p className="text-sm text-[color:var(--student-text)] mt-1">
            Assista os vídeos antes de enviar suas medidas. Você pode trocar os
            links pelos vídeos finais depois.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {measurementInstructionLinks.map((video) => (
              <a
                key={video.href}
                href={video.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[color:var(--student-text)] hover:text-[color:var(--student-text-soft)] underline"
              >
                {video.label}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            label="Peso (kg)"
            type="number"
            step="0.1"
            value={formData.pesoKg}
            onChange={(e) =>
              setFormData({ ...formData, pesoKg: e.target.value })
            }
            placeholder="80.5"
            min="30"
            max="300"
          />
          <Input
            label="Cintura (cm)"
            type="number"
            value={formData.cinturaCm}
            onChange={(e) =>
              setFormData({ ...formData, cinturaCm: e.target.value })
            }
            placeholder="85"
          />
          <Input
            label="Quadril (cm)"
            type="number"
            value={formData.quadrilCm}
            onChange={(e) =>
              setFormData({ ...formData, quadrilCm: e.target.value })
            }
            placeholder="95"
          />
          <Input
            label="Pescoço (cm)"
            type="number"
            value={formData.pescocoCm}
            onChange={(e) =>
              setFormData({ ...formData, pescocoCm: e.target.value })
            }
            placeholder="38"
          />
          <Input
            label="Dias de treino/semana"
            type="number"
            value={formData.dias_treino_semana}
            onChange={(e) => {
              setFormData({ ...formData, dias_treino_semana: e.target.value })
              setErrors({ ...errors, dias_treino_semana: "" })
            }}
            placeholder="5"
            min="0"
            max="7"
            error={errors.dias_treino_semana}
          />
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Informações Nutricionais e Saúde
        </h2>

        <div className="space-y-4">
          <Textarea
            label="Alimentos que quer consumir diariamente"
            rows={2}
            value={alimentosDiario}
            onChange={(e) => setAlimentosDiario(e.target.value)}
            placeholder="Ex: frango, arroz, brócolis (separados por vírgula)"
          />

          <Textarea
            label="Alimentos que não come"
            rows={2}
            value={alimentosNaoCome}
            onChange={(e) => setAlimentosNaoCome(e.target.value)}
            placeholder="Ex: carne vermelha, laticínios (separados por vírgula)"
          />

          <Textarea
            label="Alergias alimentares"
            rows={2}
            value={alergias}
            onChange={(e) => setAlergias(e.target.value)}
            placeholder="Ex: amendoim, frutos do mar (separados por vírgula)"
          />

          <Textarea
            label="Suplementos consumidos"
            rows={2}
            value={suplementos}
            onChange={(e) => setSuplementos(e.target.value)}
            placeholder="Ex: whey protein, creatina (separados por vírgula)"
          />

          <Textarea
            label="Objetivos atuais"
            rows={2}
            value={formData.objetivos_atuais}
            onChange={(e) =>
              setFormData({ ...formData, objetivos_atuais: e.target.value })
            }
            placeholder="Ex: ganhar massa magra, melhorar condicionamento"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-[color:var(--student-text)] mb-2">
              Toma remédio atualmente?
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 text-sm text-[color:var(--student-text)]">
                <input
                  type="radio"
                  name="toma-remedio"
                  checked={tomaRemedio === true}
                  onChange={() => {
                    setTomaRemedio(true)
                    setErrors({ ...errors, remedios_uso: "" })
                  }}
                />
                Sim
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--student-text)]">
                <input
                  type="radio"
                  name="toma-remedio"
                  checked={tomaRemedio === false}
                  onChange={() => {
                    setTomaRemedio(false)
                    setRemediosUso("")
                    setErrors({ ...errors, remedios_uso: "" })
                  }}
                />
                Não
              </label>
              <label className="flex items-center gap-2 text-sm text-[color:var(--student-text)]">
                <input
                  type="radio"
                  name="toma-remedio"
                  checked={tomaRemedio === null}
                  onChange={() => {
                    setTomaRemedio(null)
                    setRemediosUso("")
                    setErrors({ ...errors, remedios_uso: "" })
                  }}
                />
                Prefiro não informar
              </label>
            </div>
            <p className="mt-2 text-xs text-[color:var(--student-text-soft)]">
              Esta informação é visível para o professor responsável.
            </p>
          </div>

          {tomaRemedio === true && (
            <Textarea
              label="Se sim, quais remédios?"
              rows={2}
              value={remediosUso}
              onChange={(e) => {
                setRemediosUso(e.target.value)
                setErrors({ ...errors, remedios_uso: "" })
              }}
              error={errors.remedios_uso}
              placeholder="Descreva os remédios de uso atual"
            />
          )}

          <Textarea
            label="Dores articulares"
            rows={2}
            value={formData.dores_articulares}
            onChange={(e) =>
              setFormData({ ...formData, dores_articulares: e.target.value })
            }
            placeholder="Descreva suas dores articulares, se houver"
          />

          <Textarea
            label="Frequência e horários das refeições"
            rows={2}
            value={formData.frequencia_horarios_refeicoes}
            onChange={(e) =>
              setFormData({
                ...formData,
                frequencia_horarios_refeicoes: e.target.value,
              })
            }
            placeholder="Ex: 5 refeições - 7h, 10h, 13h, 16h, 20h"
          />
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleSubmit}
          icon={isEdit ? Save : Plus}
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isEdit ? "Salvar Alterações" : "Cadastrar Aluno"}
        </Button>
        {!isAluno && !embeddedInStudentContext && (
          <Button
            variant="secondary"
            onClick={() => navigate(getBackRoute())}
            disabled={isLoading}
          >
            Voltar
          </Button>
        )}
      </div>

      {isCreating && (
        <p className="text-sm text-[color:var(--student-text-soft)] mt-4">* Campos obrigatórios</p>
      )}
    </div>
  )
}
