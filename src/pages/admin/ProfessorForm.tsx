import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  ArrowLeft,
  Loader2,
  Save,
  Plus,
} from "lucide-react"
import { Card, Input, Button } from "../../components/ui"
import {
  useCreateProfessor,
  useUpdateProfessor,
  useProfessor,
} from "../../hooks/useProfessores"
import type { CreateProfessorDTO, UpdateProfessorDTO } from "../../types"
import { showToast } from "../../utils/toast"
import { PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE } from "../../utils/passwordPolicy"

const initialFormState = {
  nome: "",
  email: "",
  password: "",
  telefone: "",
  especialidade: "",
}

export const ProfessorForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const createProfessor = useCreateProfessor()
  const updateProfessor = useUpdateProfessor()
  const { data: existingProfessor, isLoading: loadingProfessor } = useProfessor(
    id || ""
  )

  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isEdit && existingProfessor) {
      setFormData({
        nome: existingProfessor.user?.nome || "",
        email: existingProfessor.user?.email || "",
        password: "",
        telefone: existingProfessor.telefone || "",
        especialidade: existingProfessor.especialidade || "",
      })
    }
  }, [isEdit, existingProfessor])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

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

    if (!isEdit && !formData.password) {
      newErrors.password = "Senha é obrigatória"
    } else if (formData.password && formData.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = PASSWORD_MIN_LENGTH_MESSAGE
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast.error("Por favor, corrija os erros no formulário")
      return
    }

    try {
      if (isEdit) {
        const dataToSend: UpdateProfessorDTO = {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
        }

        if (formData.password) dataToSend.password = formData.password
        if (formData.telefone.trim())
          dataToSend.telefone = formData.telefone.trim()
        if (formData.especialidade.trim())
          dataToSend.especialidade = formData.especialidade.trim()

        await updateProfessor.mutateAsync({ id: id!, data: dataToSend })
        showToast.success("✅ Professor atualizado com sucesso!")
        navigate("/admin/professores")
      } else {
        const dataToSend: CreateProfessorDTO = {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }

        if (formData.telefone.trim())
          dataToSend.telefone = formData.telefone.trim()
        if (formData.especialidade.trim())
          dataToSend.especialidade = formData.especialidade.trim()

        await createProfessor.mutateAsync(dataToSend)
        showToast.success("✅ Professor cadastrado com sucesso!")
        navigate("/admin/professores")
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast.error(error.message)
      } else {
        showToast.error("Erro ao salvar professor")
      }
    }
  }

  if (isEdit && loadingProfessor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-zinc-200">Carregando dados...</p>
      </div>
    )
  }

  const isLoading = createProfessor.isLoading || updateProfessor.isLoading

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/professores")}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-white">
            {isEdit ? "Editar Professor" : "Novo Professor"}
          </h1>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          {isEdit ? "Dados do Professor e Acesso" : "Dados de Acesso"}
        </h2>

        <p className="text-sm text-zinc-200 mb-4">
          {isEdit
            ? "Atualize nome, email e senha quando necessário. Deixe a senha em branco para manter a atual."
            : "O professor usará essas credenciais para fazer login no sistema."}
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
            placeholder="Carlos Silva"
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
            placeholder="carlos@gym.com"
            error={errors.email}
            required
          />
          <Input
            label={isEdit ? "Nova Senha" : "Senha *"}
            icon={Lock}
            type="password"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value })
              setErrors({ ...errors, password: "" })
            }}
            placeholder={
              isEdit ? "Deixe em branco para manter a atual" : "Mínimo 6 caracteres"
            }
            error={errors.password}
            required={!isEdit}
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

          <Input
            label="Especialidade"
            icon={Briefcase}
            value={formData.especialidade}
            onChange={(e) =>
              setFormData({ ...formData, especialidade: e.target.value })
            }
            placeholder="Ex: Musculação, Crossfit, Funcional"
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
          {isEdit ? "Salvar Alterações" : "Cadastrar Professor"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/admin/professores")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>

      {!isEdit && (
        <p className="text-sm text-zinc-300 mt-4">* Campos obrigatórios</p>
      )}
    </div>
  )
}
