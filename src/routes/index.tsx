import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { isSupabaseConfigured, supabase } from "@/supabaseClient";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — Normatel Engenharia" },
      {
        name: "description",
        content:
          "Acesse o portal da Normatel Engenharia para preencher checklists operacionais.",
      },
    ],
  }),
  component: LoginPage,
});

type Status = { type: "ok" | "err"; message: string } | null;

function LoadingScreen() {
  return (
    <main className="site-main app-loading">
      <div className="paper-status ok">Carregando sessao...</div>
    </main>
  );
}

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");
  const [status, setStatus] = useState<Status>(null);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);



  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/menu" replace />;

  function showStatus(type: "ok" | "err", message: string) {
    setStatus({ type, message });
  }
  function clearStatus() {
    setStatus(null);
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    clearStatus();

    if (!isSupabaseConfigured) {
      showStatus("err", "Configure as variaveis do Supabase.");
      return;
    }
    if (registerForm.name.trim().length < 2) {
      showStatus("err", "Nome invalido.");
      return;
    }
    if (registerForm.password.length < 6) {
      showStatus("err", "Senha muito curta (min 6).");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerForm.email.trim(),
        password: registerForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: registerForm.name.trim() },
        },
      });
      if (error) throw error;

      if (data.session) {
        showStatus("ok", "Cadastro realizado. Redirecionando...");
        navigate({ to: "/menu" });
      } else {
        showStatus("ok", "Cadastro realizado. Verifique seu e-mail para confirmar.");
        setActiveTab("login");
      }
    } catch (error: any) {
      showStatus("err", error?.message || "Erro ao cadastrar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    clearStatus();
    if (!isSupabaseConfigured) {
      showStatus("err", "Configure as variaveis do Supabase.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      if (error) throw error;
      showStatus("ok", "Login ok. Redirecionando...");
      navigate({ to: "/menu" });
    } catch (error: any) {
      showStatus("err", error?.message || "Erro ao entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordResetRequest() {
    clearStatus();
    const email = loginForm.email.trim();
    if (!email) {
      showStatus("err", "Informe seu e-mail para receber o link de redefinicao.");
      return;
    }
    if (!isSupabaseConfigured) {
      showStatus("err", "Configure as variaveis do Supabase.");
      return;
    }
    setResetSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      showStatus(
        "ok",
        "Se esse e-mail estiver cadastrado, enviaremos um link para redefinir sua senha."
      );
    } catch {
      showStatus(
        "err",
        "Nao foi possivel iniciar a redefinicao agora. Tente novamente em instantes."
      );
    } finally {
      setResetSubmitting(false);
    }
  }



  return (
    <>
      <header className="site-header">
        <div className="header-left">
          <img className="logo" src="/logo-ne.png" alt="Normatel Engenharia" />
        </div>
        <div className="header-right">
          <div className="company-title">Normatel Engenharia</div>
          <div className="company-subtitle">Ambiente de demonstracao</div>
        </div>
      </header>

      <main className="site-main auth-page">
        <section className="auth-card">
          <div className="auth-left">
            <div className="auth-title">Bem-vindo de volta</div>
            <div className="auth-sub">Acesse sua conta agora</div>
            <button
              className="btn btn-light"
              type="button"
              onClick={() => {
                setActiveTab("login");
                clearStatus();
              }}
            >
              Entrar
            </button>
          </div>

          <div className="auth-right">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "register" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  clearStatus();
                }}
              >
                Criar sua conta
              </button>
              <button
                className={`tab ${activeTab === "login" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  clearStatus();
                }}
              >
                Login
              </button>
            </div>

            {activeTab === "register" ? (
              <form className="tab-panel" onSubmit={handleRegister}>
                <label className="lbl" htmlFor="regName">Nome</label>
                <input
                  id="regName"
                  type="text"
                  placeholder="Seu nome"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                />
                <label className="lbl" htmlFor="regEmail">E-mail</label>
                <input
                  id="regEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                />
                <label className="lbl" htmlFor="regPass">Senha</label>
                <input
                  id="regPass"
                  type="password"
                  placeholder="min. 6 caracteres"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button className="btn btn-primary full" type="submit" disabled={submitting}>
                  {submitting ? "Enviando..." : "Cadastrar"}
                </button>
              </form>
            ) : (
              <form className="tab-panel" onSubmit={handleLogin}>
                <label className="lbl" htmlFor="logEmail">E-mail</label>
                <input
                  id="logEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                />
                <label className="lbl" htmlFor="logPass">Senha</label>
                <input
                  id="logPass"
                  type="password"
                  placeholder="sua senha"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button
                  className="forgot-link"
                  type="button"
                  onClick={handlePasswordResetRequest}
                  disabled={resetSubmitting || submitting}
                >
                  {resetSubmitting ? "Enviando link..." : "Esqueci minha senha"}
                </button>
                <button className="btn btn-primary full" type="submit" disabled={submitting}>
                  {submitting ? "Entrando..." : "Entrar"}
                </button>
              </form>
            )}

            {status ? (
              <div className={`paper-status ${status.type === "ok" ? "ok" : "err"}`}>
                {status.message}
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>&copy; {new Date().getFullYear()} Normatel Engenharia</span>
        <span className="footer-sep">&bull;</span>
        <span>Ambiente de demonstracao</span>
      </footer>
    </>
  );
}
