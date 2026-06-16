import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Card, Input, Button } from "../components/ui"
import { BrandMark } from "../components/BrandMark"
import { useAuth } from "../hooks/useAuth"
import { type LoginDTO } from "../types"
import { showToast } from "../utils/toast"

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<LoginDTO>({
    email: "",
    password: "",
  })
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string>("")

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="flex justify-center mb-2">
          <BrandMark size="lg" text="G-FORCE Coach" />
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Faça login para continuar
        </p>

        {generalError && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border-2 border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-surface)] p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--app-danger)]" />
            <div>
              <p className="text-sm font-medium text-[color:var(--app-text)]">
                Erro ao fazer login
              </p>
              <p className="mt-1 text-sm text-[color:var(--app-danger)]">{generalError}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
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
            onKeyPress={handleKeyPress}
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
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`mb-0 pr-12 ${errors.password ? "border-red-500" : ""}`}
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
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full mt-6 justify-center"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Não tem uma conta?{" "}
            <Link
              to="/register"
              className="text-white hover:text-gray-300 font-medium underline"
            >
              Registre-se
            </Link>
          </p>
          <p className="mt-3 text-xs text-gray-500">
            <Link to="/privacidade" className="underline">
              Privacidade
            </Link>{" "}
            ·{" "}
            <Link to="/termos" className="underline">
              Termos de Uso
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
