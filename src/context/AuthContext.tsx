import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { AuthContext } from "./AuthContext"
import {
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_SESSION_REFRESHED_EVENT,
  authApi,
  clearAccessToken,
  setAccessToken,
} from "../services/api"
import { showToast } from "../utils/toast"
import {
  type User,
  type LoginDTO,
  type RegisterDTO,
  type LoginResponse,
} from "../types"

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const sessionExpiredNotifiedRef = useRef(false)

  useEffect(() => {
    let active = true

    authApi
      .refresh()
      .then((session) => {
        if (!active) return
        sessionExpiredNotifiedRef.current = false
        setAccessToken(session.token)
        setToken(session.token)
        setUser(session.user)
      })
      .catch(() => {
        if (!active) return
        clearAccessToken()
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const clearAuthState = useCallback(() => {
    setToken(null)
    setUser(null)
    clearAccessToken()
  }, [])

  useEffect(() => {
    const handleSessionRefreshed = (event: Event) => {
      const session = (event as CustomEvent<LoginResponse>).detail
      if (!session?.token || !session.user) return

      sessionExpiredNotifiedRef.current = false
      setToken(session.token)
      setUser(session.user)
    }

    const handleSessionExpired = () => {
      const hadSession = !!token || !!user

      clearAuthState()

      if (hadSession && !sessionExpiredNotifiedRef.current) {
        sessionExpiredNotifiedRef.current = true
        showToast.warning("Sua sessão expirou. Faça login novamente.")
      }
    }

    window.addEventListener(
      AUTH_SESSION_REFRESHED_EVENT,
      handleSessionRefreshed,
    )
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)

    return () => {
      window.removeEventListener(
        AUTH_SESSION_REFRESHED_EVENT,
        handleSessionRefreshed,
      )
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      )
    }
  }, [clearAuthState, token, user])

  const login = useCallback(async (data: LoginDTO) => {
    try {
      const response: LoginResponse = await authApi.login(data)
      sessionExpiredNotifiedRef.current = false
      setAccessToken(response.token)
      setToken(response.token)
      setUser(response.user)
      showToast.success(`Bem-vindo(a), ${response.user.nome}!`)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Erro ao fazer login")
    }
  }, [])

  const register = useCallback(async (data: RegisterDTO) => {
    try {
      await authApi.register(data)
      showToast.success("Conta criada com sucesso!")
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Erro ao criar conta")
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
      sessionExpiredNotifiedRef.current = false
      clearAuthState()
      showToast.success("Logout realizado")
    } catch (error) {
      showToast.error(
        "Não foi possível confirmar o logout. Tente novamente.",
      )

      if (error instanceof Error) {
        throw error
      }

      throw new Error("Não foi possível confirmar o logout")
    }
  }, [clearAuthState])

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [isLoading, login, logout, register, token, updateUser, user],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
