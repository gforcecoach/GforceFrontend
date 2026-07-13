import React, { useEffect, useMemo, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  Ticket,
  Eye,
  EyeOff,
} from "lucide-react"
import { Card, Input, Button } from "../../components/ui"
import { BrandMark } from "../../components/BrandMark"
import { useAuth } from "../../hooks/useAuth"
import { type RegisterDTO } from "../../types"
import { getStoredLeadSlug } from "../../utils/leadTracking"
import { showToast } from "../../utils/toast"
import { legalApi } from "../../services/api"
import { type LegalDocumentVersion } from "../../types"
import { PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_MESSAGE } from "../../utils/passwordPolicy"

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isProfessor, setIsProfessor] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const [documents, setDocuments] = useState<LegalDocumentVersion[]>([])
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [preferences, setPreferences] = useState({
    analyticsConsent: false,
    marketingConsent: false,
    emailConsent: true,
    whatsappConsent: true,
  })

  const [formData, setFormData] = useState<RegisterDTO>({
    nome: "",
    email: "",
    password: "",
    role: "ALUNO",
    inviteCode: "",
    telefone: "",
    especialidade: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    legalApi
      .currentDocuments()
      .then((response) => setDocuments(response.documents))
      .catch(() => {
        setErrors((current) => ({
          ...current,
          legal: "Não foi possível carregar os documentos legais atuais",
        }))
      })
  }, [])

  const acceptedDocuments = useMemo(
    () =>
      documents.map((document) => ({
        documentType: document.documentType,
        version: document.version,
      })),
    [documents],
  )

  const validate = (): boolean => {
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

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória"
    } else if (formData.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = PASSWORD_MIN_LENGTH_MESSAGE
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não correspondem"
    }

    if (isProfessor && !formData.inviteCode?.trim()) {
      newErrors.inviteCode = "Código de convite é obrigatório para professores"
    }

    if (!acceptedLegal || acceptedDocuments.length < 2) {
      newErrors.legal = "Aceite a Política de Privacidade e os Termos de Uso"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setErrors((current) => ({ ...current, general: "" }))
    setIsLoading(true)
    try {
      const dataToSend: RegisterDTO = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: isProfessor ? "PROFESSOR" : "ALUNO",
        acceptedDocuments,
        privacyPreferences: preferences,
      }

      const storedLeadSlug = getStoredLeadSlug()
      if (storedLeadSlug && preferences.analyticsConsent) {
        dataToSend.leadSlug = storedLeadSlug
      }

      if (isProfessor) {
        dataToSend.inviteCode = formData.inviteCode?.trim()
        if (formData.telefone?.trim())
          dataToSend.telefone = formData.telefone.trim()
        if (formData.especialidade?.trim())
          dataToSend.especialidade = formData.especialidade.trim()
      }

      await register(dataToSend)
      navigate("/login")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar conta"
      setErrors((current) => ({ ...current, general: message }))
      showToast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleProfessor = () => {
    setIsProfessor(!isProfessor)
    setFormData({
      ...formData,
      role: !isProfessor ? "PROFESSOR" : "ALUNO",
      inviteCode: "",
      telefone: "",
      especialidade: "",
    })
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <BrandMark size="lg" text="G-FORCE Coach" />
        </div>

        <h1 className="text-3xl font-bold text-center text-white mb-2">
          Criar Conta
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Preencha os dados para se registrar
        </p>

        <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isProfessor}
              onChange={handleToggleProfessor}
              className="w-4 h-4 text-zinc-300 border-zinc-600 rounded focus:ring-zinc-300"
            />
            <span className="ml-2 text-sm font-medium text-gray-200">
              Sou um Professor (preciso de código de convite)
            </span>
          </label>
        </div>

        <div
          className="space-y-4"
          onChange={() =>
            setErrors((current) => ({ ...current, general: "" }))
          }
        >
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
          />

          <div className="relative">
            <Input
              label="Senha *"
              icon={Lock}
              type={isPasswordVisible ? "text" : "password"}
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                setErrors({ ...errors, password: "" })
              }}
              placeholder="Mínimo 10 caracteres"
              error={errors.password}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
              aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
              title={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            >
              {isPasswordVisible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirmar Senha *"
              icon={Lock}
              type={isConfirmPasswordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setErrors({ ...errors, confirmPassword: "" })
              }}
              placeholder="Digite a senha novamente"
              error={errors.confirmPassword}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setIsConfirmPasswordVisible((visible) => !visible)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
              aria-label={isConfirmPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
              title={isConfirmPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
            >
              {isConfirmPasswordVisible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {isProfessor && (
            <>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-200 mb-4">
                  Dados do Professor
                </p>

                <div className="space-y-4">
                  <Input
                    label="Código de Convite *"
                    icon={Ticket}
                    value={formData.inviteCode || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, inviteCode: e.target.value })
                      setErrors({ ...errors, inviteCode: "" })
                    }}
                    placeholder="PROF-2025-ABC123"
                    error={errors.inviteCode}
                  />

                  <Input
                    label="Telefone"
                    icon={Phone}
                    value={formData.telefone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    placeholder="(11) 98765-4321"
                  />

                  <Input
                    label="Especialidade"
                    icon={Briefcase}
                    value={formData.especialidade || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        especialidade: e.target.value,
                      })
                    }
                    placeholder="Ex: Musculação, Crossfit"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm text-gray-200">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(event) => {
                  setAcceptedLegal(event.target.checked)
                  setErrors({ ...errors, legal: "" })
                }}
                className="mt-1 h-4 w-4 rounded border-zinc-600"
              />
              <span>
                Li e aceito a{" "}
                <Link to="/privacidade" className="underline">
                  Política de Privacidade
                </Link>{" "}
                e os{" "}
                <Link to="/termos" className="underline">
                  Termos de Uso
                </Link>{" "}
                vigentes.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.analyticsConsent}
                onChange={(event) =>
                  setPreferences({
                    ...preferences,
                    analyticsConsent: event.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-zinc-600"
              />
              <span>Aceito analytics de leads e melhoria da plataforma.</span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.marketingConsent}
                onChange={(event) =>
                  setPreferences({
                    ...preferences,
                    marketingConsent: event.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-zinc-600"
              />
              <span>Aceito receber comunicações promocionais.</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preferences.emailConsent}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      emailConsent: event.target.checked,
                    })
                  }
                />
                E-mail operacional
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preferences.whatsappConsent}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      whatsappConsent: event.target.checked,
                    })
                  }
                />
                WhatsApp operacional
              </label>
            </div>
            {errors.legal && (
              <p className="text-sm text-red-500">{errors.legal}</p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Criando conta..." : "Criar Conta"}
          </Button>
          {errors.general && (
            <p
              role="alert"
              className="text-center text-sm text-[color:var(--student-danger)]"
            >
              {errors.general}
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="text-white hover:text-gray-300 font-medium underline"
            >
              Faça login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
