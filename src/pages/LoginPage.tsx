import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react"
import { Card, Input, Button } from "../components/ui"
import { BrandMark } from "../components/BrandMark"
import { useAuth } from "../hooks/useAuth"
import { authApi } from "../services/api"
import { type LoginDTO } from "../types"
import { showToast } from "../utils/toast"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordResetSuccessMessage =
  "Se esse email estiver cadastrado, enviaremos as instruções de redefinição em instantes."
const secondaryActionClass =
  "flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[color:var(--student-border)] bg-[color:var(--student-surface)] px-3 py-2 text-sm font-medium text-[color:var(--student-text)] transition-colors hover:border-[color:var(--student-border-strong)] hover:bg-[color:var(--student-surface-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--student-border-strong)]"

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false)

  const [formData, setFormData] = useState<LoginDTO>({
    email: "",
    password: "",
  })
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [recoveryErrors, setRecoveryErrors] = useState<Record<string, string>>(
    {},
  )
  const [generalError, setGeneralError] = useState<string>("")
  const [recoveryError, setRecoveryError] = useState<string>("")
  const [recoverySuccess, setRecoverySuccess] = useState<string>("")

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    const email = formData.email.trim()

    if (!email) {
      newErrors.email = "Email é obrigatório"
    } else if (!emailPattern.test(email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRecovery = (): boolean => {
    const newErrors: Record<string, string> = {}
    const email = recoveryEmail.trim()

    if (!email) {
      newErrors.email = "Email é obrigatório"
    } else if (!emailPattern.test(email)) {
      newErrors.email = "Email inválido"
    }

    setRecoveryErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setGeneralError("")

    if (!validate()) return

    setIsLoading(true)
    try {
      await login(formData)
      navigate("/")
    } catch (error) {
      if (error instanceof Error) {
        setGeneralError(error.message)
        showToast.error(error.message)
      } else {
        setGeneralError("Erro ao fazer login. Tente novamente.")
        showToast.error("Erro ao fazer login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordResetRequest = async (
    event?: React.FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault()
    setRecoveryError("")
    setRecoverySuccess("")

    if (!validateRecovery()) return

    setIsRecoveryLoading(true)
    try {
      await authApi.requestPasswordReset({ email: recoveryEmail })
      setRecoverySuccess(passwordResetSuccessMessage)
      showToast.success(passwordResetSuccessMessage)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar as instruções agora. Tente novamente."
      setRecoveryError(message)
      showToast.error(message)
    } finally {
      setIsRecoveryLoading(false)
    }
  }

  const handleOpenRecovery = () => {
    setIsRecoveryMode(true)
    setRecoveryEmail(formData.email.trim())
    setErrors({})
    setRecoveryErrors({})
    setGeneralError("")
    setRecoveryError("")
    setRecoverySuccess("")
  }

  const handleBackToLogin = () => {
    setIsRecoveryMode(false)
    setRecoveryErrors({})
    setRecoveryError("")
    setRecoverySuccess("")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="flex justify-center mb-2">
          <BrandMark size="lg" text="G-FORCE Coach" />
        </h1>
        <p className="text-center text-gray-300 mb-8">
          {isRecoveryMode
            ? "Receba instruções para redefinir sua senha"
            : "Faça login para continuar"}
        </p>

        {isRecoveryMode ? (
          <>
            {recoveryError && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border-2 border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-surface)] p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--app-danger)]" />
                <div>
                  <p className="text-sm font-medium text-[color:var(--app-text)]">
                    Não conseguimos enviar
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--app-danger)]">
                    {recoveryError}
                  </p>
                </div>
              </div>
            )}

            {recoverySuccess && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border-2 border-[color:var(--app-success-border)] bg-[color:var(--student-success-surface)] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--student-success)]" />
                <div>
                  <p className="text-sm font-medium text-[color:var(--student-text)]">
                    Solicitação enviada
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--student-text-muted)]">
                    {recoverySuccess}
                  </p>
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handlePasswordResetRequest}>
              <Input
                label="Email"
                icon={Mail}
                type="email"
                value={recoveryEmail}
                onChange={(e) => {
                  setRecoveryEmail(e.target.value)
                  setRecoveryErrors({ ...recoveryErrors, email: "" })
                  setRecoveryError("")
                  setRecoverySuccess("")
                }}
                placeholder="seu@email.com"
                error={recoveryErrors.email}
                autoComplete="email"
              />

              <Button
                type="submit"
                isLoading={isRecoveryLoading}
                disabled={isRecoveryLoading}
                icon={KeyRound}
                className="w-full justify-center"
              >
                {isRecoveryLoading ? "Enviando..." : "Enviar instruções"}
              </Button>
            </form>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="mx-auto mt-4 flex items-center gap-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </button>
          </>
        ) : (
          <>
            {generalError && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border-2 border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-surface)] p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--app-danger)]" />
                <div>
                  <p className="text-sm font-medium text-[color:var(--app-text)]">
                    Erro ao fazer login
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--app-danger)]">
                    {generalError}
                  </p>
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setErrors({ ...errors, email: "" })
                  setGeneralError("")
                }}
                placeholder="seu@email.com"
                error={errors.email}
                autoComplete="email"
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    icon={Lock}
                    type={isPasswordVisible ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      setErrors({ ...errors, password: "" })
                      setGeneralError("")
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={[
                      "mb-0 pr-12",
                      errors.password ? "border-red-500" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
                    aria-label={
                      isPasswordVisible ? "Ocultar senha" : "Mostrar senha"
                    }
                    title={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full mt-6 justify-center"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link to="/register" className={secondaryActionClass}>
                <UserPlus className="h-4 w-4" />
                Registre-se
              </Link>
              <button
                type="button"
                onClick={handleOpenRecovery}
                className={secondaryActionClass}
              >
                <KeyRound className="h-4 w-4" />
                Esqueci a senha
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              <Link to="/privacidade" className="underline">
                Privacidade
              </Link>{" "}
              ·{" "}
              <Link to="/termos" className="underline">
                Termos de Uso
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
