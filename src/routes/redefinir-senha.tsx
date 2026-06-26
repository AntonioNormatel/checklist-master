import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { isSupabaseConfigured, supabase } from "@/supabaseClient";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Normatel Engenharia" },
      {
        name: "description",
        content:
          "Crie uma nova senha de acesso ao portal de checklists da Normatel Engenharia.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = { type: "ok" | "err"; message: string } | null;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [status, setStatus] = useState<Status>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(field: "password" | "confirmPassword", value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function showStatus(type: "ok" | "err", message: string) {
    setStatus({ type, message });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);

    if (!isSupabaseConfigured) {
      showStatus("err", "Configure as variaveis do Supabase.");
      return;
    }
    if (form.password.length < 6) {
      showStatus("err", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      showStatus("err", "As senhas informadas nao conferem.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;

      showStatus("ok", "Senha redefinida com sucesso. Redirecionando para o login...");
      window.setTimeout(async () => {
        await supabase.auth.signOut();
        navigate({ to: "/", replace: true });
      }, 1200);
    } catch {
      showStatus(
        "err",
        "Nao foi possivel redefinir a senha. Solicite um novo link e tente novamente."
      );
    } finally {
      setSubmitting(false);
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
          <div className="company-subtitle">Redefinicao de senha</div>
        </div>
      </header>

      <main className="site-main auth-page">
        <section className="auth-card auth-card-reset">
          <div className="auth-left">
            <div className="auth-title">Crie uma nova senha</div>
            <div className="auth-sub">
              Use o link recebido por e-mail para atualizar seu acesso.
            </div>
            <button
              className="btn btn-light"
              type="button"
              onClick={() => navigate({ to: "/" })}
            >
              Voltar ao login
            </button>
          </div>

          <div className="auth-right">
            <form className="tab-panel" onSubmit={handleSubmit}>
              <label className="lbl" htmlFor="newPass">Nova senha</label>
              <input
                id="newPass"
                type="password"
                placeholder="min. 6 caracteres"
                value={form.password}
                onChange={(event) => setField("password", event.target.value)}
                autoComplete="new-password"
              />

              <label className="lbl" htmlFor="newPassConfirm">Confirmar nova senha</label>
              <input
                id="newPassConfirm"
                type="password"
                placeholder="repita a nova senha"
                value={form.confirmPassword}
                onChange={(event) => setField("confirmPassword", event.target.value)}
                autoComplete="new-password"
              />

              <button className="btn btn-primary full" type="submit" disabled={submitting}>
                {submitting ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>

            {status ? (
              <div
                className={`paper-status ${status.type === "ok" ? "ok" : "err"}`}
                role="status"
                aria-live="polite"
              >
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
