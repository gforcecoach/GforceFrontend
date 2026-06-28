import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  type LucideIcon,
  LogOut,
  TrendingUp,
  User,
  Camera,
  Dumbbell,
  UtensilsCrossed,
  Home,
  Wallet,
  Users,
  ClipboardList,
  HelpCircle,
  ShieldCheck,
} from "lucide-react"
import { Button } from "./ui/Button"
import { useAuth } from "../hooks/useAuth"
import { BrandMark } from "./BrandMark"
import { OnboardingProvider } from "../features/onboarding/OnboardingProvider"

interface AlunoShortcut {
  label: string
  title: string
  path: string
  icon: LucideIcon
}

const alunoShortcuts: AlunoShortcut[] = [
  {
    label: "Dashboard",
    title: "Abrir Dashboard",
    path: "/aluno/dashboard",
    icon: Home,
  },
  {
    label: "Perfil",
    title: "Ver Perfil",
    path: "/aluno/perfil",
    icon: User,
  },
  {
    label: "Evolução",
    title: "Ver Evolução",
    path: "/aluno/evolucao",
    icon: TrendingUp,
  },
  {
    label: "Treino",
    title: "Ver Treino",
    path: "/aluno/treino",
    icon: Dumbbell,
  },
  {
    label: "Dieta",
    title: "Ver Dieta",
    path: "/aluno/dieta",
    icon: UtensilsCrossed,
  },
  {
    label: "Fotos",
    title: "Enviar Fotos",
    path: "/aluno/fotos-arquivos",
    icon: Camera,
  },
]

const professorShortcuts: AlunoShortcut[] = [
  {
    label: "Dashboard",
    title: "Abrir Dashboard",
    path: "/professor/dashboard",
    icon: Home,
  },
  {
    label: "Alunos",
    title: "Ver Alunos",
    path: "/professor/alunos",
    icon: Users,
  },
  {
    label: "Treino",
    title: "Prescrição de Treino",
    path: "/professor/alunos",
    icon: Dumbbell,
  },
  {
    label: "Dieta",
    title: "Prescrição Alimentar",
    path: "/professor/alunos",
    icon: UtensilsCrossed,
  },
  {
    label: "Pendências",
    title: "Ver Pendências",
    path: "/professor/dashboard#pendencias",
    icon: ClipboardList,
  },
  {
    label: "Financeiro",
    title: "Abrir Financeiro",
    path: "/professor/financeiro",
    icon: Wallet,
  },
]

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const isAluno = user?.role === "ALUNO"
  const isProfessor = user?.role === "PROFESSOR"
  const mobileTopbarButtonClass =
    "!h-9 !w-9 !justify-center !gap-0 !rounded-md !p-0 sm:!h-auto sm:!w-auto sm:!rounded-lg sm:!p-2"
  const activeShortcutClass =
    "!border-[color:var(--student-border-strong)] !bg-[color:var(--student-surface-soft)] shadow-[inset_0_0_0_1px_var(--app-accent-surface)]"

  const getShortcutTarget = (label: string) => {
    if (isProfessor && label === "Alunos") return "onboarding-nav-students"
    if (isAluno && label === "Treino") return "onboarding-nav-workout"
    if (isAluno && label === "Dieta") return "onboarding-nav-diet"
    return undefined
  }

  const getHelpRoute = () => {
    if (user?.role === "PROFESSOR") return "/professor/ajuda"
    if (user?.role === "ALUNO") return "/aluno/ajuda"
    return "/admin/dashboard"
  }

  const isProfessorShortcutActive = (label: string) => {
    const { pathname, hash } = location

    if (label === "Dashboard") {
      return pathname === "/professor/dashboard" && hash !== "#pendencias"
    }
    if (label === "Pendências") {
      return pathname === "/professor/dashboard" && hash === "#pendencias"
    }
    const isTreinoRoute =
      pathname.endsWith("/treino") || pathname.endsWith("/treino/")
    const isDietaRoute =
      pathname.endsWith("/dieta") || pathname.endsWith("/dieta/")

    if (label === "Treino") {
      return isTreinoRoute
    }
    if (label === "Dieta") {
      return isDietaRoute
    }
    if (label === "Alunos") {
      return (
        pathname.startsWith("/professor/alunos") &&
        !isTreinoRoute &&
        !isDietaRoute
      )
    }

    return (
      pathname ===
      professorShortcuts.find((item) => item.label === label)?.path
    )
  }

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-[linear-gradient(160deg,var(--student-bg)_0%,var(--student-bg-alt)_42%,var(--student-bg)_100%)] text-[color:var(--student-text)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] shadow-[var(--student-shadow)] backdrop-blur">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
            <div className="flex flex-wrap items-center gap-3">
              <BrandMark size="sm" text="G-Force Coach" />
              {user && (
                <span className="px-3 py-1 rounded-full border border-[color:var(--student-border-strong)] bg-[color:var(--student-accent-surface)] text-sm text-[color:var(--student-text)]">
                  {user.role === "ADMIN" && "Administrador"}
                  {user.role === "PROFESSOR" && "Professor"}
                  {user.role === "ALUNO" && "Aluno"}
                </span>
              )}
            </div>

            <nav
              aria-label={
                isProfessor
                  ? "Atalhos do professor"
                  : isAluno
                    ? "Atalhos do aluno"
                    : "Ações da conta"
              }
              className="flex w-full items-center gap-1 overflow-x-auto pb-1 sm:w-auto sm:justify-end sm:gap-2 sm:overflow-visible sm:pb-0"
            >
              {isAluno &&
                alunoShortcuts.map((shortcut) => {
                  const isActive = location.pathname === shortcut.path

                  return (
                    <Button
                      key={shortcut.path}
                      variant="secondary"
                      icon={shortcut.icon}
                      onClick={() => navigate(shortcut.path)}
                      className={`${mobileTopbarButtonClass} ${isActive ? activeShortcutClass : ""}`}
                      title={shortcut.title}
                      aria-label={shortcut.label}
                      aria-current={isActive ? "page" : undefined}
                      data-onboarding-target={getShortcutTarget(shortcut.label)}
                    >
                      <span className="hidden sm:inline">{shortcut.label}</span>
                    </Button>
                  )
                })}

              {isProfessor &&
                professorShortcuts.map((shortcut) => {
                  const isActive = isProfessorShortcutActive(shortcut.label)

                  return (
                    <Button
                      key={`${shortcut.path}-${shortcut.label}`}
                      variant="secondary"
                      icon={shortcut.icon}
                      onClick={() => navigate(shortcut.path)}
                      className={`${mobileTopbarButtonClass} ${isActive ? activeShortcutClass : ""}`}
                      title={shortcut.title}
                      aria-label={shortcut.label}
                      aria-current={isActive ? "page" : undefined}
                      data-onboarding-target={getShortcutTarget(shortcut.label)}
                    >
                      <span className="hidden sm:inline">{shortcut.label}</span>
                    </Button>
                  )
                })}

              <Button
                variant="secondary"
                icon={ShieldCheck}
                onClick={() => {
                  if (user?.role === "ADMIN") navigate("/admin/privacidade")
                  if (user?.role === "PROFESSOR") navigate("/professor/privacidade")
                  if (user?.role === "ALUNO") navigate("/aluno/privacidade")
                }}
                className={mobileTopbarButtonClass}
                title="Privacidade"
                aria-label="Privacidade"
              >
                <span className="hidden sm:inline">Privacidade</span>
              </Button>

              {(isProfessor || isAluno) && (
                <Button
                  variant="secondary"
                  icon={HelpCircle}
                  onClick={() => navigate(getHelpRoute())}
                  className={mobileTopbarButtonClass}
                  title="Ajuda"
                  aria-label="Ajuda"
                  data-onboarding-target="onboarding-help-nav"
                >
                  <span className="hidden sm:inline">Ajuda</span>
                </Button>
              )}

              <Button
                variant="secondary"
                icon={LogOut}
                onClick={handleLogout}
                className={mobileTopbarButtonClass}
                title="Sair"
                aria-label="Sair"
              >
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="mt-auto border-t border-[color:var(--student-border)] bg-[color:var(--student-surface-strong)] backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-[color:var(--student-text-muted)]">
            © 2026 G-Force Coach. Todos os direitos reservados.{" "}
            <button onClick={() => navigate("/privacidade")} className="underline">
              Privacidade
            </button>{" "}
            ·{" "}
            <button onClick={() => navigate("/termos")} className="underline">
              Termos
            </button>
          </p>
        </div>
      </footer>
      </div>
    </OnboardingProvider>
  )
}
