import { createContext } from "react"
import { type User, type LoginDTO, type RegisterDTO } from "../types"

export interface AuthContextData {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginDTO) => Promise<void>
  register: (data: RegisterDTO) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData)
