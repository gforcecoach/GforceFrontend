import { useState, type FormEvent } from "react"
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Lock } from "lucide-react"
import { authApi } from "../services/api"
import { showToast } from "../utils/toast"
import { Button, Input } from "./ui"
import {
  NEW_PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../utils/passwordPolicy"

interface PasswordResetFormProps {
  token: string
  onBack: () => void
}

export function PasswordResetForm({ token, onBack }: PasswordResetFormProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(NEW_PASSWORD_MIN_LENGTH_MESSAGE)
      return
    }

    if (newPassword !== confirmation) {
      setError("As senhas não correspondem.")
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.resetPassword({ token, newPassword })
      showToast.success("Senha redefinida. Faça login com a nova senha.")
      onBack()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível redefinir a senha. Solicite um novo link.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border-2 border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-surface)] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--app-danger)]" />
          <div>
            <p className="text-sm font-medium text-[color:var(--app-text)]">
              Não foi possível redefinir
            </p>
            <p className="mt-1 text-sm text-[color:var(--app-danger)]">
              {error}
            </p>
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            label="Nova senha"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value)
              setError("")
            }}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-0 top-7 flex h-10 items-center pr-3 text-zinc-400 hover:text-white"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirmar nova senha"
            icon={Lock}
            type={showConfirmation ? "text" : "password"}
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value)
              setError("")
            }}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirmation((visible) => !visible)}
            className="absolute right-0 top-7 flex h-10 items-center pr-3 text-zinc-400 hover:text-white"
            aria-label={
              showConfirmation ? "Ocultar confirmação" : "Mostrar confirmação"
            }
          >
            {showConfirmation ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          icon={KeyRound}
          className="w-full justify-center"
        >
          {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
        </Button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mx-auto mt-4 flex items-center gap-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao login
      </button>
    </>
  )
}
