import { useEffect } from "react"
import {
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  LogIn,
  MessageCircle,
  ShieldCheck,
  Shirt,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { leadLinksApi } from "../../../services/api"
import {
  normalizeLeadSlug,
  saveLeadSlug,
  shouldTrackLeadOnThisLoad,
} from "../../../utils/leadTracking"
import { getAnalyticsConsent } from "../../../utils/privacyConsent"
import {
  experienceValues,
  frictionPoints,
  platformCards,
  serviceHighlights,
  WHATSAPP_NUMBER,
  whoWeArePillars,
} from "../content"
import { PublicSiteLayout } from "../components/PublicSiteLayout"
import { openWhatsApp, scrollToPublicSection } from "../utils"

const accentCardClass =
  "rounded-[28px] border border-[color:var(--public-border)] bg-[linear-gradient(165deg,var(--public-surface-strong),var(--public-surface))] p-6 shadow-[0_18px_48px_rgba(2,2,2,0.42)]"

export const PublicLandingPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const trackLeadIfAllowed = () => {
      if (getAnalyticsConsent() !== true) {
        return
      }

      const params = new URLSearchParams(window.location.search)
      const leadParam = params.get("lead")

      if (!leadParam) {
        return
      }

      const leadSlug = normalizeLeadSlug(leadParam)
      if (!leadSlug) {
        return
      }

      saveLeadSlug(leadSlug)

      if (!shouldTrackLeadOnThisLoad(leadSlug)) {
        return
      }

      leadLinksApi
        .trackClick({
          leadSlug,
          analyticsConsent: true,
          referrer: document.referrer || undefined,
          path: window.location.pathname,
          utmSource: params.get("utm_source") || undefined,
          utmMedium: params.get("utm_medium") || undefined,
          utmCampaign: params.get("utm_campaign") || undefined,
          utmContent: params.get("utm_content") || undefined,
          utmTerm: params.get("utm_term") || undefined,
        })
        .catch((error) => {
          console.error("[lead] Falha ao rastrear clique:", error)
        })
    }

    trackLeadIfAllowed()
    window.addEventListener(
      "privacy:analytics-consent-changed",
      trackLeadIfAllowed,
    )

    return () => {
      window.removeEventListener(
        "privacy:analytics-consent-changed",
        trackLeadIfAllowed,
      )
    }
  }, [])

  useEffect(() => {
    if (!location.hash) {
      return
    }

    const sectionId = location.hash.replace("#", "")
    const timeout = window.setTimeout(() => {
      scrollToPublicSection(sectionId)
    }, 80)

    return () => window.clearTimeout(timeout)
  }, [location.hash])

  const handleContactClick = () => {
    openWhatsApp(
      WHATSAPP_NUMBER,
      "Olá! Quero entender como funciona o acompanhamento da G-Force.",
    )
  }

  const handleShirtClick = () => {
    openWhatsApp(
      WHATSAPP_NUMBER,
      "Olá! Quero saber mais sobre as camisas oficiais da G-Force.",
    )
  }

  return (
    <PublicSiteLayout>
      <section className="relative overflow-hidden border-b border-[color:var(--public-border)] px-5 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_6%,_var(--public-hero-glow-primary),_transparent_26%),radial-gradient(circle_at_78%_34%,_var(--public-hero-glow-secondary),_transparent_44%),linear-gradient(102deg,_var(--public-bg)_0%,_var(--public-bg-alt)_46%,_var(--public-bg)_100%)]" />
        <div className="relative mx-auto max-w-8xl space-y-10">
          <div className="grid gap-20 lg:grid-cols-[0.96fr_1.04fr] lg:items-center xl:gap-20">
            <div className="space-y-5">
              <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[color:var(--public-border-strong)] bg-[linear-gradient(140deg,var(--public-accent-surface),var(--public-teal-surface))] px-4 py-2 text-center text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--public-accent)] shadow-[0_10px_28px_rgba(2,2,2,0.3)] sm:justify-start sm:text-left sm:text-[0.78rem] sm:tracking-[0.16em]">
                <Sparkles className="h-3.5 w-3.5" />
                Clareza comercial + experiência real do aluno
              </div>

              <div className="space-y-4">
                <h1 className="max-w-[20ch] text-[2.05rem] font-semibold leading-[1.1] text-[color:var(--public-text)] sm:max-w-[18ch] sm:text-[2.45rem] lg:max-w-none lg:text-[3rem]">
                  Acompanhamento não deveria depender de bagunça, improviso e mensagem perdida.
                </h1>
                <p className="max-w-[40rem] text-[1rem] leading-7 text-[color:var(--public-text-soft)] sm:text-[1.05rem] sm:leading-8 lg:max-w-[36rem]">
                  A G-Force combina comunidade, acompanhamento e plataforma própria para
                  organizar treino, dieta, feedback e evolução em uma rotina mais clara,
                  forte e sustentável.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleContactClick}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--public-accent)] bg-[image:var(--public-accent-gradient)] px-6 py-4 text-sm font-semibold text-[color:var(--public-accent-contrast)] transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-7 sm:text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  Quero entender meu melhor caminho
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--public-border)] px-6 py-4 text-sm font-semibold text-[color:var(--public-text)] transition-colors hover:border-[color:var(--public-border-strong)] hover:bg-[color:var(--public-surface)] sm:w-auto sm:px-7 sm:text-base"
                >
                  <LogIn className="h-5 w-5" />
                  Já sou aluno
                </button>
              </div>

            </div>

            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-[32px] border border-[color:var(--public-border-strong)] bg-[color:var(--public-surface-strong)] shadow-[var(--public-shadow)]">
                <img
                  src="/logo.jpg"
                  alt="Identidade visual da comunidade G-Force"
                  className="aspect-[4/4.1] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(242,242,242,0.16),transparent_50%)]" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {serviceHighlights.map((item, index) => (
              <div
                key={item.title}
                className={`min-h-full rounded-[24px] border p-4 ${
                  index % 2 === 0
                    ? "border-[color:var(--public-border-strong)] bg-[linear-gradient(155deg,var(--public-accent-surface),var(--public-surface-soft))]"
                    : "border-[color:var(--public-border)] bg-[linear-gradient(155deg,var(--public-teal-surface),var(--public-surface))]"
                }`}
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--public-text-muted)]">
                  Destaque
                </p>
                <p className="mt-2.5 text-[0.98rem] font-semibold leading-6 text-[color:var(--public-text)]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[0.84rem] leading-[1.55] text-[color:var(--public-text-soft)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="servico"
        className="bg-[linear-gradient(180deg,var(--public-bg),var(--public-bg-alt)_45%,var(--public-bg))] px-5 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--public-accent)]">
              Onde a evolução costuma travar
            </p>
            <h2 className="text-3xl font-semibold leading-[1.14] text-[color:var(--public-text)] sm:text-[2.55rem] lg:text-[3.2rem]">
              Não é falta de suor. É a falta de um método que torne esse suor sustentável.
            </h2>
            <p className="mx-auto max-w-[40rem] text-[1rem] leading-8 text-[color:var(--public-text-soft)] sm:text-[1.06rem]">
              Quando treino, dieta, feedback e histórico ficam espalhados, até a boa vontade
              perde força. A proposta da G-Force é reduzir esse atrito e deixar o processo
              mais utilizável no mundo real.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.94fr_1.06fr] lg:items-stretch">
            <div className="grid gap-4">
              {frictionPoints.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-[color:var(--public-border)] bg-[linear-gradient(160deg,var(--public-danger-surface),var(--public-surface))] p-6"
                >
                  <p className="text-lg font-semibold text-[color:var(--public-text)]">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--public-text-soft)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--public-border-strong)] bg-[linear-gradient(140deg,var(--public-surface-strong),var(--public-surface),var(--public-teal-surface))] p-6 shadow-[0_18px_52px_rgba(2,2,2,0.42)] sm:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--public-teal)]">
                  O que muda com a G-Force
                </p>
                <h3 className="mt-4 max-w-xl text-[1.7rem] font-semibold leading-[1.2] tracking-[-0.01em] text-[color:var(--public-text)]">
                  O serviço principal vem antes de qualquer acessório: primeiro clareza, depois complemento.
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--public-text-soft)]">
                  A estrutura do serviço foi pensada para eliminar ruído, organizar a comunicação e
                  deixar o acompanhamento mais legível para o aluno no dia a dia.
                </p>
                              <div className="mt-6 space-y-4">
                {serviceHighlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-[linear-gradient(140deg,var(--public-teal-surface),var(--public-accent-surface))] p-1.5 text-[color:var(--public-teal)]">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[color:var(--public-text)]">{item.title}</p>
                      <p className="text-sm leading-6 text-[color:var(--public-text-soft)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
              </div>
      </section>

      <section
        id="plataforma"
        className="border-y border-[color:var(--public-border)] bg-[linear-gradient(180deg,var(--public-bg-alt),var(--public-bg)_60%)] px-5 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--public-teal)]">
              Plataforma própria
            </p>
            <h2 className="text-3xl font-semibold leading-[1.14] text-[color:var(--public-text)] sm:text-[2.55rem] lg:text-[3.2rem]">
              O acompanhamento fica mais forte quando o aluno enxerga o processo com clareza.
            </h2>
            <p className="mx-auto max-w-[41rem] text-[1rem] leading-8 text-[color:var(--public-text-soft)] sm:text-[1.06rem]">
              A plataforma própria centraliza o que mais importa para manter consistência:
              treino, dieta, materiais, histórico, recados e sinais concretos de progresso.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {platformCards.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-[28px] border p-6 sm:p-7 ${
                  index % 2 === 0
                    ? "border-[color:var(--public-border-strong)] bg-[linear-gradient(160deg,var(--public-accent-surface),var(--public-surface-soft))]"
                    : "border-[color:var(--public-border)] bg-[linear-gradient(160deg,var(--public-teal-surface),var(--public-surface))]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--public-text-muted)]">
                  {item.eyebrow}
                </p>
                <h3 className="mt-4 text-[1.45rem] font-semibold leading-[1.22] tracking-[-0.01em] text-[color:var(--public-text)] sm:text-[1.55rem]">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[color:var(--public-text-soft)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className={accentCardClass}>
              <CalendarDays className="h-7 w-7 text-[color:var(--public-accent)]" />
              <p className="mt-4 text-[1.05rem] font-semibold leading-6 text-[color:var(--public-text)]">Cronograma útil</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--public-text-soft)]">
                O aluno abre a rotina e identifica rapidamente o próximo treino e o próximo passo.
              </p>
            </div>
            <div className={accentCardClass}>
              <Target className="h-7 w-7 text-[color:var(--public-teal)]" />
              <p className="mt-4 text-[1.05rem] font-semibold leading-6 text-[color:var(--public-text)]">Execução com contexto</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--public-text-soft)]">
                Histórico de carga, observações e mídia ajudam a transformar orientação em ação.
              </p>
            </div>
            <div className={accentCardClass}>
              <TrendingUp className="h-7 w-7 text-[color:var(--public-accent)]" />
              <p className="mt-4 text-[1.05rem] font-semibold leading-6 text-[color:var(--public-text)]">Progressão real</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--public-text-soft)]">
                Fica mais fácil perceber o que evoluiu, o que estagnou e onde ajustar.
              </p>
            </div>
            <div className={accentCardClass}>
              <ShieldCheck className="h-7 w-7 text-[color:var(--public-teal)]" />
              <p className="mt-4 text-[1.05rem] font-semibold leading-6 text-[color:var(--public-text)]">Menos ruído</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--public-text-soft)]">
                A experiência reduz dependência de conversa solta para algo que exige método.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,var(--public-bg),var(--public-bg-alt)_55%,var(--public-bg))] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-[color:var(--public-border-strong)] bg-[linear-gradient(160deg,var(--public-accent-surface),var(--public-surface-strong)_62%)] p-6 shadow-[0_18px_50px_rgba(2,2,2,0.4)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--public-accent)]">
              Planos
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-[color:var(--public-text)]">
              O valor do plano está na experiência organizada que ele sustenta.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[color:var(--public-text-soft)]">
              A página de planos mostra como avaliar o nível de acompanhamento ideal sem cair
              em conversa rasa de preço solto. Primeiro você entende o valor. Depois escolhe
              o caminho mais coerente para a sua rotina.
            </p>
            <button
              onClick={() => navigate("/planos")}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--public-border-strong)] px-6 py-3 text-sm font-semibold text-[color:var(--public-text)] transition-colors hover:bg-[color:var(--public-surface)]"
            >
              Ver página de planos
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-[32px] border border-[color:var(--public-border)] bg-[linear-gradient(160deg,var(--public-surface),var(--public-surface-soft))] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--public-teal)]">
              Acesso rápido
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[color:var(--public-border)] bg-[color:var(--public-surface-soft)] p-4">
                <p className="font-semibold text-[color:var(--public-text)]">Treino do dia</p>
                <p className="mt-2 text-sm text-[color:var(--public-text-soft)]">
                  Rotina organizada para facilitar aderência e execução.
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--public-border)] bg-[color:var(--public-surface-soft)] p-4">
                <p className="font-semibold text-[color:var(--public-text)]">Feedback do professor</p>
                <p className="mt-2 text-sm text-[color:var(--public-text-soft)]">
                  Comentários aparecem com mais visibilidade para orientar a próxima sessão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="quem-somos" className="border-y border-[color:var(--public-border)] bg-[linear-gradient(180deg,var(--public-bg-alt),var(--public-bg)_72%)] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--public-accent)]">
              Quem somos
            </p>
            <h2 className="text-3xl font-semibold text-[color:var(--public-text)] sm:text-4xl">
              A G-Force nasce da ideia de que evolução séria precisa de acompanhamento utilizável.
            </h2>
            <p className="text-base leading-8 text-[color:var(--public-text-soft)]">
              Somos uma comunidade que une treino, dieta, organização e plataforma própria para
              apoiar a rotina de quem quer construir resultado com disciplina, clareza e visão de
              longo prazo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {whoWeArePillars.map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-[color:var(--public-border)] bg-[linear-gradient(160deg,var(--public-surface-strong),var(--public-surface))] p-5 shadow-[0_14px_34px_rgba(2,2,2,0.34)]"
              >
                <Dumbbell className="h-6 w-6 text-[color:var(--public-teal)]" />
                <p className="mt-4 text-sm font-medium leading-7 text-[color:var(--public-text-soft)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="experiencia" className="bg-[linear-gradient(180deg,var(--public-bg),var(--public-bg-alt)_48%,var(--public-bg))] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="mx-auto max-w-[48rem] space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--public-teal)]">
              O que a comunidade valoriza
            </p>
            <h2 className="mx-auto max-w-[30ch] text-[2rem] font-semibold leading-[1.10] text-[color:var(--public-text)] sm:text-[2.45rem] lg:text-[3rem]">
              Mais do que um ponto de partida, criamos o ecossistema necessário para a sua continuidade.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {experienceValues.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-[28px] border bg-[linear-gradient(160deg,var(--public-surface-strong),var(--public-surface))] p-6 shadow-[0_14px_40px_rgba(2,2,2,0.34)] sm:p-7 ${
                  index === 1
                    ? "border-[color:var(--public-border-strong)]"
                    : "border-[color:var(--public-border)]"
                }`}
              >
                <p className="text-[1.22rem] font-semibold leading-7 text-[color:var(--public-text)]">{item.title}</p>
                <p className="mt-4 text-sm leading-7 text-[color:var(--public-text-soft)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[color:var(--public-border)] bg-[linear-gradient(180deg,var(--public-bg-alt),var(--public-bg)_65%)] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center xl:gap-12">
          <div className="space-y-4 lg:max-w-[36rem]">
            <p className="inline-flex max-w-full flex-wrap items-center gap-5 rounded-full border border-[color:var(--public-border)] bg-[color:var(--public-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--public-text-soft)] sm:tracking-[0.18em]">
              <Shirt className="h-4 w-4 text-[color:var(--public-accent)]" />
              Camisas oficiais
            </p>
            <h2 className="text-2xl font-semibold text-[color:var(--public-text)] sm:text-4xl">
              As camisas entram como extensão da comunidade, não como foco principal da oferta.
            </h2>
            <p className="text-base leading-8 text-[color:var(--public-text-soft)]">
              O serviço continua sendo o centro da experiência. As camisas representam
              pertencimento, identidade e vínculo com a cultura da G-Force.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/camisas")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--public-border)] px-6 py-3 text-sm font-semibold text-[color:var(--public-text)] transition-colors hover:bg-[color:var(--public-surface)] sm:w-auto"
              >
                Conhecer a página de produtos
              </button>
              <button
                onClick={handleShirtClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--public-teal)] bg-[image:var(--public-secondary-gradient)] px-6 py-3 text-sm font-semibold text-[color:var(--public-accent-contrast)] transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Falar sobre os produtos
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[34rem] overflow-hidden rounded-[32px] border border-[color:var(--public-border)] bg-[color:var(--public-surface-strong)] lg:ml-auto lg:max-w-[30rem]">
            <img
              src="/20b27da5-b7bb-45e7-904e-66e8e5a997a1.jpeg"
              alt="Camisas oficiais da comunidade G-Force"
              className="aspect-[5/4] w-full object-cover sm:aspect-[6/5] lg:aspect-[5/4]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[36px] border border-[color:var(--public-border-strong)] bg-[linear-gradient(135deg,var(--public-accent-surface),var(--public-surface-strong)_42%,var(--public-teal-surface))] px-6 py-10 text-center shadow-[0_22px_54px_rgba(2,2,2,0.46)] sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--public-accent)]">
            Próximo passo
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.01em] text-[color:var(--public-text)] sm:text-5xl lg:text-[3rem]">
            Se você quer tratar treino e dieta com mais clareza, o ponto de partida é organizar a experiência.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[color:var(--public-text-soft)]">
            A G-Force foi desenhada para fortalecer constância, acompanhamento e leitura real do processo.
            Se isso faz sentido para o seu momento, vamos conversar.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={handleContactClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--public-accent)] bg-[image:var(--public-accent-gradient)] px-6 py-4 text-sm font-semibold text-[color:var(--public-accent-contrast)] transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-7 sm:text-base"
              >
                <MessageCircle className="h-5 w-5" />
                Quero iniciar meu acompanhamento
              </button>
              <button
                onClick={() => navigate("/planos")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--public-border)] px-6 py-4 text-sm font-semibold text-[color:var(--public-text)] transition-colors hover:bg-[color:var(--public-surface)] sm:w-auto sm:px-7 sm:text-base"
              >
                Entender o valor dos planos
              </button>
            </div>
          </div>
      </section>
    </PublicSiteLayout>
  )
}

export default PublicLandingPage
