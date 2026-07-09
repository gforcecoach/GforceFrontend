import React, { useEffect } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom"
import { AuthProvider } from "./context/AuthContext.tsx"
import { AuthGuard } from "./components/AuthGuard"
import { TokenValidator } from "./components/TokkenValidator.tsx"
import { Layout } from "./components/Layout"

// Landing Page
import LandingPage from "./pages/LandingPage"
import PlanosPage from "./pages/PlanosPage"
import CamisasPage from "./pages/CamisasPage"
import { LegalDocumentPage } from "./pages/LegalDocumentPage"
import { LegalAcceptancePage } from "./pages/LegalAcceptancePage"
import { PrivacySettingsPage } from "./pages/PrivacySettingsPage"
import { OnboardingHelpPage } from "./pages/OnboardingHelpPage"

// Auth Pages
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/auth/RegisterPage"

// Admin Pages
import { AdminDashboard } from "./pages/auth/AdminDashboard"
import { InviteCodesPage } from "./pages/admin/InviteCodesPage"
import { LeadLinksPage } from "./pages/admin/LeadLinksPage"
import { ProfessoresPage } from "./pages/admin/ProfessoresPage"
import { ProfessorForm } from "./pages/admin/ProfessorForm"
import { FinanceiroPage } from "./pages/admin/FinanceiroPage"
import { PrivacyRequestsPage } from "./pages/admin/PrivacyRequestsPage"

// Professor Pages
import { ProfessorHomeDashboardPage } from "./pages/professor/ProfessorHomeDashboardPage"
import { ProfessorFinanceiroPage } from "./pages/professor/ProfessorFinanceiroPage"
import { ProfessorAlunoContextPage } from "./pages/professor/ProfessorAlunoContextPage"
import { PlanoTreinoEditorPage } from "./pages/professor/PlanoTreinoEditorPage"
import { PlanoDietaEditorPage } from "./pages/professor/PlanoDietaEditorPage"

// Shared Pages
import { AnswersList } from "./pages/AnswerList"
import { AnswerForm } from "./pages/AnswerForm"
import { EvolucaoPage } from "./pages/EvolucaoPage"
import { useAuth } from "./hooks/useAuth.ts"
import { FotosArquivosPage } from "./pages/FotosArquivosPage.tsx"
import { MeuTreinoPage } from "./pages/aluno/MeuTreinoPage"
import { MinhaDietaPage } from "./pages/aluno/MinhaDietaPage"
import { AlunoDashboardPage } from "./pages/aluno/AlunoDashboardPage"

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "ADMIN":
          navigate("/admin/dashboard", { replace: true })
          break
        case "PROFESSOR":
          navigate("/professor/dashboard", { replace: true })
          break
        case "ALUNO":
          navigate("/aluno/dashboard", { replace: true })
          break
        default:
          navigate("/login", { replace: true })
      }
    } else {
      navigate("/landing", { replace: true })
    }
  }, [user, navigate])

  return null
}

function AppRoutes() {
  return (
    <>
      {/* Verifica token periodicamente */}
      <TokenValidator />

      <Routes>
        {/* Landing pública */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/planos" element={<PlanosPage />} />
        <Route path="/camisas" element={<CamisasPage />} />
        <Route
          path="/privacidade"
          element={<LegalDocumentPage documentType="PRIVACY_POLICY" />}
        />
        <Route
          path="/termos"
          element={<LegalDocumentPage documentType="TERMS_OF_USE" />}
        />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/legal/pendente"
          element={
            <AuthGuard>
              <LegalAcceptancePage />
            </AuthGuard>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* ADMIN */}
        <Route
          path="/admin/*"
          element={
            <AuthGuard allowedRoles={["ADMIN"]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="alunos" element={<AnswersList />} />
                  <Route path="alunos/new" element={<AnswerForm />} />
                  <Route path="alunos/:id/edit" element={<AnswerForm />} />
                  <Route
                    path="alunos/:id/evolucao"
                    element={<EvolucaoPage />}
                  />
                  <Route
                    path="alunos/:id/fotos-arquivos"
                    element={<FotosArquivosPage />}
                  />
                  <Route
                    path="alunos/:id/treino"
                    element={<PlanoTreinoEditorPage />}
                  />
                  <Route
                    path="alunos/:id/dieta"
                    element={<PlanoDietaEditorPage />}
                  />
                  <Route path="invite-codes" element={<InviteCodesPage />} />
                  <Route path="lead-links" element={<LeadLinksPage />} />
                  <Route path="financeiro" element={<FinanceiroPage />} />
                  <Route path="lgpd" element={<PrivacyRequestsPage />} />
                  <Route path="privacidade" element={<PrivacySettingsPage />} />
                  <Route path="professores" element={<ProfessoresPage />} />
                  <Route path="professores/new" element={<ProfessorForm />} />
                  <Route
                    path="professores/:id/edit"
                    element={<ProfessorForm />}
                  />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </Layout>
            </AuthGuard>
          }
        />

        {/* PROFESSOR */}
        <Route
          path="/professor/*"
          element={
            <AuthGuard allowedRoles={["PROFESSOR"]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<ProfessorHomeDashboardPage />} />
                  <Route path="alunos" element={<AnswersList />} />
                  <Route path="alunos/new" element={<AnswerForm />} />
                  <Route path="alunos/:id/*" element={<ProfessorAlunoContextPage />} />
                  <Route path="financeiro" element={<ProfessorFinanceiroPage />} />
                  <Route path="privacidade" element={<PrivacySettingsPage />} />
                  <Route path="ajuda" element={<OnboardingHelpPage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </Layout>
            </AuthGuard>
          }
        />

        {/* ALUNO */}
        <Route
          path="/aluno/*"
          element={
            <AuthGuard allowedRoles={["ALUNO"]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<AlunoDashboardPage />} />
                  <Route path="perfil" element={<AnswerForm />} />
                  <Route path="treino" element={<MeuTreinoPage />} />
                  <Route path="dieta" element={<MinhaDietaPage />} />
                  <Route path="evolucao" element={<EvolucaoPage />} />
                  <Route
                    path="fotos-arquivos"
                    element={<FotosArquivosPage />}
                  />
                  <Route path="privacidade" element={<PrivacySettingsPage />} />
                  <Route path="ajuda" element={<OnboardingHelpPage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </Layout>
            </AuthGuard>
          }
        />

        {/* Unauthorized */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center bg-black">
              <div className="text-center bg-zinc-950 border border-zinc-800 p-8 rounded-lg shadow-lg text-white">
                <h1 className="text-4xl font-bold text-red-600 mb-4">
                  ⛔ Acesso Negado
                </h1>
                <p className="text-gray-300 mb-6">
                  Você não tem permissão para acessar esta página.
                </p>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="bg-white text-black px-6 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          }
        />

        {/* Fallback geral */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
