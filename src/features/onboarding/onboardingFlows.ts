import type { UserRole, OnboardingResponse } from "../../types"

export interface OnboardingStep {
  key: string
  title: string
  body: string
  target: string
  route: (context: OnboardingResponse["context"]) => string
}

const professorAlunoRoute = (
  context: OnboardingResponse["context"],
  suffix: string,
) =>
  context.firstAlunoId
    ? `/professor/alunos/${context.firstAlunoId}/${suffix}`
    : "/professor/alunos"

export const onboardingFlows: Partial<Record<UserRole, OnboardingStep[]>> = {
  PROFESSOR: [
    {
      key: "welcome",
      title: "Bem-vindo à rotina do professor",
      body: "A plataforma centraliza alunos, treino, dieta, evolução, fotos, feedbacks e financeiro para reduzir trabalho operacional.",
      target: "onboarding-professor-dashboard-title",
      route: () => "/professor/dashboard",
    },
    {
      key: "dashboard_metrics",
      title: "Comece pelos indicadores",
      body: "Aqui você enxerga alunos ativos, pendências, feedbacks aguardando resposta e reavaliações próximas.",
      target: "onboarding-professor-dashboard-metrics",
      route: () => "/professor/dashboard",
    },
    {
      key: "dashboard_feedbacks",
      title: "Feedbacks viram ação",
      body: "Use esta área para priorizar alunos que precisam de resposta sobre treino ou dieta.",
      target: "onboarding-professor-feedbacks",
      route: () => "/professor/dashboard",
    },
    {
      key: "students_list",
      title: "Sua base de alunos",
      body: "A lista de alunos é o ponto de partida para cadastro, edição, prescrição e acompanhamento.",
      target: "onboarding-nav-students",
      route: () => "/professor/alunos",
    },
    {
      key: "student_create",
      title: "Crie o primeiro aluno",
      body: "Cadastre o aluno e use o acesso criado para que ele consiga preencher dados, treino e dieta.",
      target: "onboarding-student-create",
      route: () => "/professor/alunos",
    },
    {
      key: "student_form",
      title: "Entenda o formulário",
      body: "O formulário reúne dados físicos, preferências, restrições e informações úteis para personalizar o acompanhamento.",
      target: "onboarding-student-form",
      route: () => "/professor/alunos/new",
    },
    {
      key: "evolution",
      title: "Evolução merece atenção",
      body: "Registre avaliações físicas, acompanhe histórico e use os gráficos para explicar progresso com clareza.",
      target: "onboarding-evolution-main",
      route: (context) => professorAlunoRoute(context, "evolucao"),
    },
    {
      key: "workouts",
      title: "Prescrição de treino",
      body: "Crie dias de treino, organize exercícios e ajuste a rotina conforme o progresso do aluno.",
      target: "onboarding-workout-editor",
      route: (context) => professorAlunoRoute(context, "treino"),
    },
    {
      key: "exercises",
      title: "Exercícios reutilizáveis",
      body: "Exercícios cadastrados com boa descrição ajudam a manter qualidade e reaproveitamento nas prescrições.",
      target: "onboarding-exercises-area",
      route: (context) => professorAlunoRoute(context, "treino"),
    },
    {
      key: "diet",
      title: "Plano alimentar",
      body: "Monte refeições, copie estruturas e ajuste metas nutricionais sem perder o histórico do aluno.",
      target: "onboarding-diet-editor",
      route: (context) => professorAlunoRoute(context, "dieta"),
    },
    {
      key: "foods",
      title: "Alimentos e base futura",
      body: "Alimentos bem cadastrados aceleram próximas dietas e reduzem retrabalho.",
      target: "onboarding-foods-area",
      route: (context) => professorAlunoRoute(context, "dieta"),
    },
    {
      key: "photos",
      title: "Fotos de evolução",
      body: "Use fotos para comparação temporal e para complementar as métricas de avaliação física.",
      target: "onboarding-photos-main",
      route: (context) => professorAlunoRoute(context, "fotos"),
    },
    {
      key: "finance",
      title: "Controle financeiro",
      body: "Acompanhe recebimentos, renovações e métricas financeiras sem misturar com o atendimento técnico.",
      target: "onboarding-finance-main",
      route: () => "/professor/financeiro",
    },
    {
      key: "finish",
      title: "Você está pronto para começar",
      body: "Use Ajuda para rever este tour e siga o checklist para completar os primeiros marcos de retenção.",
      target: "onboarding-help-nav",
      route: () => "/professor/ajuda",
    },
  ],
  ALUNO: [
    {
      key: "welcome",
      title: "Bem-vindo ao seu acompanhamento",
      body: "Aqui ficam treino, dieta, feedback, fotos e evolução em uma rotina simples de seguir.",
      target: "onboarding-aluno-dashboard-title",
      route: () => "/aluno/dashboard",
    },
    {
      key: "dashboard",
      title: "Sua semana em resumo",
      body: "O dashboard mostra próximos treinos, refeições, histórico recente e sinais importantes da semana.",
      target: "onboarding-aluno-dashboard-main",
      route: () => "/aluno/dashboard",
    },
    {
      key: "workout",
      title: "Abra seu treino",
      body: "No treino você troca o dia, consulta exercícios e registra a execução.",
      target: "onboarding-nav-workout",
      route: () => "/aluno/treino",
    },
    {
      key: "exercise_execution",
      title: "Marque cada exercício",
      body: "Concluir exercícios ajuda seu professor a acompanhar carga, consistência e ajustes necessários.",
      target: "onboarding-exercise-checkin",
      route: () => "/aluno/treino",
    },
    {
      key: "diet",
      title: "Acesse suas refeições",
      body: "A dieta organiza o dia por refeições para facilitar adesão e feedback.",
      target: "onboarding-nav-diet",
      route: () => "/aluno/dieta",
    },
    {
      key: "meal_checkin",
      title: "Registre refeições",
      body: "Marcar refeições realizadas cria histórico e mostra onde a rotina está fluindo ou travando.",
      target: "onboarding-meal-checkin",
      route: () => "/aluno/dieta",
    },
    {
      key: "feedback",
      title: "Envie feedback",
      body: "Feedbacks objetivos ajudam seu professor a ajustar treino e dieta com mais precisão.",
      target: "onboarding-feedback-area",
      route: () => "/aluno/treino",
    },
    {
      key: "profile_form",
      title: "Mantenha seu formulário atualizado",
      body: "Atualize dados, preferências e restrições quando algo mudar na sua rotina.",
      target: "onboarding-student-form",
      route: () => "/aluno/perfil",
    },
    {
      key: "photos",
      title: "Envie fotos de evolução",
      body: "Fotos complementam números e ajudam a visualizar progresso ao longo do tempo.",
      target: "onboarding-photos-main",
      route: () => "/aluno/fotos-arquivos",
    },
    {
      key: "evolution",
      title: "Acompanhe suas métricas",
      body: "Gráficos e histórico mostram evolução de peso, medidas e composição corporal.",
      target: "onboarding-evolution-main",
      route: () => "/aluno/evolucao",
    },
    {
      key: "finish",
      title: "Próximo passo: consistência",
      body: "Siga o checklist inicial e use Ajuda quando quiser rever o guia rápido.",
      target: "onboarding-help-nav",
      route: () => "/aluno/ajuda",
    },
  ],
}
