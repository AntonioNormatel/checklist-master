import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/lib/auth-context";
import UserMenu from "@/components/UserMenu";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Normatel Engenharia" },
      {
        name: "description",
        content:
          "Central de acesso aos checklists operacionais da Normatel: critico e simples.",
      },
    ],
  }),
  component: MenuPage,
});

function displayName(user: User | null) {
  if (!user) return "Usuario";
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  return (
    meta.name ||
    meta.full_name ||
    user.email?.split("@")[0] ||
    "Usuario"
  );
}

function LoadingScreen() {
  return (
    <main className="site-main app-loading">
      <div className="paper-status ok">Carregando sessao...</div>
    </main>
  );
}

function PendingApprovalScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <main className="site-main app-loading">
      <div className="paper-status err" style={{ maxWidth: 520, textAlign: "center" }}>
        <div style={{ marginBottom: 12 }}>
          <b>Conta aguardando aprovação</b>
        </div>
        <div style={{ marginBottom: 16 }}>
          Seu cadastro foi recebido. Um administrador precisa autorizar seu acesso antes que você possa usar os checklists.
        </div>
        <button className="btn btn-primary" type="button" onClick={onSignOut}>Sair</button>
      </div>
    </main>
  );
}

function MenuPage() {
  const { user, loading, role, approved, roleLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  if (loading || roleLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  if (!approved || !role) {
    return <PendingApprovalScreen onSignOut={handleSignOut} />;
  }

  return (
    <>
      <header className="site-header no-print">
        <div className="header-left">
          <img className="logo" src="/logo-ne.png" alt="Normatel Engenharia" />
        </div>
        <div className="header-right">
          <div className="company-title">Normatel Engenharia</div>
          <div className="company-subtitle">Central de Acesso</div>
          <UserMenu />
        </div>
      </header>

      <main className="site-main">
        <div className="menu-page-wrap">
          <section className="menu-hero">
            <div className="menu-hero-top">
              <div>
                <div className="menu-hero-title">Bem-vindo ao painel operacional</div>
                <div className="menu-hero-sub">
                  Este ambiente reune os formularios de planejamento utilizados para
                  organizacao, registro e acompanhamento de atividades operacionais.
                </div>
              </div>

              <div className="menu-user-box">
                <div className="menu-user-label">Usuario conectado</div>
                <div className="menu-user-name">{displayName(user)}</div>
                <div className="menu-user-email">{user?.email || ""}</div>
              </div>
            </div>
          </section>

          <section className="menu-grid">
            <article className="menu-card menu-card-highlight">
              <div className="menu-card-title">Checklist Critico</div>
              <div className="menu-card-text">
                Acesse o formulario completo para atividades criticas, com analise mais
                detalhada, recursos, planejamento por etapas e ficha tecnica complementar.
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => navigate({ to: "/checklist" })}
              >
                Abrir Checklist Critico
              </button>
            </article>

            <article className="menu-card">
              <div className="menu-card-title">Checklist Simples</div>
              <div className="menu-card-text">
                Utilize a versao simplificada para atividades com fluxo mais direto,
                mantendo padronizacao de registro, etapas, recursos necessarios e impressao.
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => navigate({ to: "/checklist-simples" })}
              >
                Abrir Checklist Simples
              </button>
            </article>

            <article className="menu-card">
              <div className="menu-card-title">Suporte</div>
              <div className="menu-card-text">
                Em caso de duvida sobre preenchimento, uso do sistema ou fluxo operacional,
                abra o suporte para visualizar orientacoes e canais de contato.
              </div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setSupportOpen(true)}
              >
                Abrir Suporte
              </button>
            </article>
          </section>

          <section className="menu-info-strip">
            <div className="menu-info-strip-title">O que este site engloba</div>
            <div className="menu-info-strip-text">
              O portal centraliza os processos de planejamento operacional, preenchimento
              de checklists, recuperacao de registros por usuario e impressao dos formularios.
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer no-print">
        <span>&copy; {new Date().getFullYear()} Normatel Engenharia</span>
        <span className="footer-sep">&bull;</span>
        <span>Ambiente de demonstracao</span>
      </footer>

      {supportOpen ? (
        <div className="modal-backdrop no-print" onClick={() => setSupportOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Suporte</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setSupportOpen(false)}
              >
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="support-box">
                <p>
                  Caso tenha duvidas sobre preenchimento dos checklists, recuperacao de
                  registros ou uso geral da plataforma, entre em contato com o suporte.
                </p>
                <div className="support-contact">
                  <div><b>Suporte operacional:</b> equipe responsavel pelo sistema</div>
                  <div><b>E-mail sugerido:</b> suporte@normatel.com.br</div>
                  <div><b>Canal interno:</b> equipe administrativa ou supervisao local</div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setSupportOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
