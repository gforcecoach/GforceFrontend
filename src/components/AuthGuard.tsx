import React, { type ReactNode } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { type UserRole } from "../types"
import { Loader2, LogOut, Home } from "lucide-react"
import { Button, Card } from "./ui"

interface AuthGuardProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedRoles,
  redirectTo = "/landing",
}) => {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-zinc-300">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  if (user?.requiresLegalAcceptance && location.pathname !== "/legal/pendente") {
    return <Navigate to="/legal/pendente" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⛔</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Acesso Negado
            </h1>
            <p className="text-zinc-300 mb-6">
              Você não tem permissão para acessar esta página.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                icon={Home}
                onClick={() => navigate("/")}
                className="w-full"
              >
                Voltar ao Início
              </Button>
              <Button
                variant="secondary"
                icon={LogOut}
                onClick={() => {
                  logout()
                  navigate("/login")
                }}
                className="w-full"
              >
                Sair da Conta
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
