import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Users,
  UserPlus,
  Ticket,
  Plus,
  UserCheck,
  Link2,
  MousePointerClick,
  Wallet,
  ShieldCheck,
} from "lucide-react"
import { Card, Button } from "../../components/ui"
import { useAlunos } from "../../hooks/useAlunos"
import { useInviteCodes } from "../../hooks/useInviteCodes"
import { useProfessores } from "../../hooks/useProfessores"
import { useLeadAnalytics } from "../../hooks/useLeadLinks"

const ranges = [7, 30, 90] as const

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [leadRange, setLeadRange] = useState<(typeof ranges)[number]>(30)

  const { data: alunos, isLoading: loadingAlunos } = useAlunos()
  const { data: inviteCodes, isLoading: loadingCodes } = useInviteCodes()
  const { data: professores, isLoading: loadingProfessores } = useProfessores()
  const { data: leadAnalytics, isLoading: loadingLeads } = useLeadAnalytics(leadRange)

  const stats = [
    {
      title: "Professores",
      value: professores?.length || 0,
      icon: UserCheck,
      color: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/30",
      onClick: () => navigate("/admin/professores"),
    },
    {
      title: "Total de Alunos",
      value: alunos?.length || 0,
      icon: Users,
      color: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/30",
      onClick: () => navigate("/admin/alunos"),
    },
    {
      title: "Códigos Ativos",
      value: inviteCodes?.filter((c) => !c.usedBy).length || 0,
      icon: Ticket,
      color: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
      onClick: () => navigate("/admin/invite-codes"),
    },
    {
      title: "Leads Únicos",
      value: leadAnalytics?.cards.clicksUnique || 0,
      icon: MousePointerClick,
      color: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/30",
      onClick: () => navigate("/admin/lead-links"),
    },
  ]

  const maxSeriesValue = useMemo(() => {
    if (!leadAnalytics?.series?.length) {
      return 1
    }

    return Math.max(...leadAnalytics.series.map((item) => item.clicksUnique), 1)
  }, [leadAnalytics?.series])

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">
            Dashboard Administrativo
          </h1>
          <p className="text-zinc-400 mt-1">Visão geral do sistema</p>
        </div>

        <div className="flex gap-3">
          <Button
            icon={UserCheck}
            onClick={() => navigate("/admin/professores/new")}
          >
            Novo Professor
          </Button>
          <Button icon={Plus} onClick={() => navigate("/admin/alunos/new")}>
            Novo Aluno
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-zinc-100">
                  {loadingAlunos || loadingCodes || loadingProfessores || loadingLeads
                    ? "..."
                    : stat.value}
                </p>
              </div>
              <div className={`p-4 rounded-full ${stat.color}`}>
                <stat.icon className="h-8 w-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Aquisição de Leads</h2>
            <p className="text-sm text-zinc-400">
              Cliques rastreados, conversão e ranking de links
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
              value={leadRange}
              onChange={(event) =>
                setLeadRange(Number(event.target.value) as (typeof ranges)[number])
              }
            >
              {ranges.map((range) => (
                <option key={range} value={range}>
                  {range} dias
                </option>
              ))}
            </select>
            <Button icon={Link2} onClick={() => navigate("/admin/lead-links")}>
              Gerenciar Links
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-zinc-100">Cliques totais</p>
            <p className="text-2xl font-bold text-white">
              {loadingLeads ? "..." : leadAnalytics?.cards.clicksTotal || 0}
            </p>
          </div>
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-zinc-100">Cliques únicos</p>
            <p className="text-2xl font-bold text-white">
              {loadingLeads ? "..." : leadAnalytics?.cards.clicksUnique || 0}
            </p>
          </div>
          <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-zinc-100">Novos cadastros</p>
            <p className="text-2xl font-bold text-white">
              {loadingLeads ? "..." : leadAnalytics?.cards.novosCadastros || 0}
            </p>
          </div>
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-lg">
            <p className="text-sm text-zinc-100">Taxa de conversão</p>
            <p className="text-2xl font-bold text-white">
              {loadingLeads
                ? "..."
                : `${leadAnalytics?.cards.conversao?.toFixed(2) || "0.00"}%`}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-zinc-100 mb-3">
            Evolução diária de cliques únicos
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[640px] flex items-end gap-2 h-44 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
              {(leadAnalytics?.series || []).map((point) => {
                const height = Math.max(
                  8,
                  Math.round((point.clicksUnique / maxSeriesValue) * 120),
                )

                return (
                  <div key={point.date} className="flex flex-col items-center gap-2 w-10">
                    <span className="text-[11px] text-zinc-200">{point.clicksUnique}</span>
                    <div
                      className="w-8 rounded-t bg-indigo-500"
                      style={{ height: `${height}px` }}
                      title={`${point.date}: ${point.clicksUnique} cliques únicos`}
                    />
                    <span className="text-[11px] text-zinc-400">{point.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-zinc-100 mb-3">Top links</h3>
          <div className="space-y-2">
            {(leadAnalytics?.topLinks || []).slice(0, 5).map((item) => (
              <div
                key={item.leadLinkId}
                className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <div>
                  <p className="font-medium text-zinc-100">{item.nome}</p>
                  <p className="text-sm text-zinc-400">{item.slug}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-zinc-300">
                  <span>Total: {item.clicksTotal}</span>
                  <span>Únicos: {item.clicksUnique}</span>
                  <span>Cadastros: {item.novosCadastros}</span>
                  <span>Conv.: {item.conversao.toFixed(2)}%</span>
                </div>
              </div>
            ))}

            {!loadingLeads && (!leadAnalytics?.topLinks || leadAnalytics.topLinks.length === 0) && (
              <p className="text-sm text-zinc-400">Nenhum dado de lead no período.</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/professores")}
            className="p-4 border-2 border-zinc-700 bg-zinc-900 rounded-lg hover:border-purple-400 hover:bg-purple-500/10 transition-colors text-left"
          >
            <UserCheck className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-semibold text-zinc-100">Gerenciar Professores</h3>
            <p className="text-sm text-zinc-400">Ver, editar e criar professores</p>
          </button>

          <button
            onClick={() => navigate("/admin/alunos")}
            className="p-4 border-2 border-zinc-700 bg-zinc-900 rounded-lg hover:border-blue-400 hover:bg-blue-500/10 transition-colors text-left"
          >
            <Users className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-semibold text-zinc-100">Gerenciar Alunos</h3>
            <p className="text-sm text-zinc-400">Ver e editar todos os alunos do sistema</p>
          </button>

          <button
            onClick={() => navigate("/admin/invite-codes")}
            className="p-4 border-2 border-zinc-700 bg-zinc-900 rounded-lg hover:border-emerald-400 hover:bg-emerald-500/10 transition-colors text-left"
          >
            <Ticket className="h-6 w-6 text-emerald-400 mb-2" />
            <h3 className="font-semibold text-zinc-100">Códigos de Convite</h3>
            <p className="text-sm text-zinc-400">Gerenciar códigos para professores</p>
          </button>

          <button
            onClick={() => navigate("/admin/lead-links")}
            className="p-4 border-2 border-zinc-700 bg-zinc-900 rounded-lg hover:border-indigo-400 hover:bg-indigo-500/10 transition-colors text-left"
          >
            <Link2 className="h-6 w-6 text-indigo-600 mb-2" />
            <h3 className="font-semibold text-zinc-100">Links de Lead</h3>
            <p className="text-sm text-zinc-400">Criar links rastreáveis e acompanhar conversão</p>
          </button>

          <button
            onClick={() => navigate("/admin/financeiro")}
            className="p-4 border-2 border-zinc-700 bg-zinc-900 rounded-lg hover:border-amber-400 hover:bg-amber-500/10 transition-colors text-left"
          >
            <Wallet className="h-6 w-6 text-amber-300 mb-2" />
            <h3 className="font-semibold text-zinc-100">Controle Financeiro</h3>
            <p className="text-sm text-zinc-400">
              Caixa mensal, projeção 3/6 meses e lançamentos
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/lgpd")}
            className="p-4 border-2 border-zinc-700 bg-zinc-900 rounded-lg hover:border-sky-400 hover:bg-sky-500/10 transition-colors text-left"
          >
            <ShieldCheck className="h-6 w-6 text-sky-300 mb-2" />
            <h3 className="font-semibold text-zinc-100">Solicitações LGPD</h3>
            <p className="text-sm text-zinc-400">
              Processar pedidos de titulares e registrar respostas
            </p>
          </button>
        </div>
      </Card>

      {alunos && alunos.length > 0 && (
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-zinc-100">
              Últimos Alunos Cadastrados
            </h2>
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/alunos")}
            >
              Ver Todos
            </Button>
          </div>

          <div className="space-y-3">
            {alunos.slice(0, 5).map((aluno) => (
              <div
                key={aluno.id}
                className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/alunos/${aluno.id}/edit`)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/15 p-2 rounded-full">
                    <UserPlus className="h-4 w-4 text-blue-300" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">
                      {aluno.user?.nome || `Aluno #${aluno.id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {new Date(aluno.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {aluno.pesoKg && (
                    <p className="text-sm font-medium text-zinc-200">{aluno.pesoKg} kg</p>
                  )}
                  {aluno.dias_treino_semana && (
                    <p className="text-xs text-zinc-400">
                      {aluno.dias_treino_semana}x/semana
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
