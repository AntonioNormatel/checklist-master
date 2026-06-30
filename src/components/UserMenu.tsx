import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";
import AdminUsersModal from "@/components/AdminUsersModal";

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  planejador: "Planejador",
  executante: "Encarregado / Executante",
};

export default function UserMenu() {
  const { user, role, approved, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const displayName =
    meta.name || meta.full_name || user.email?.split("@")[0] || "Usuario";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="user-menu no-print" ref={ref}>
      <button
        className="user-menu-trigger"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="user-menu-avatar">{initials}</span>
        <span className="user-menu-info">
          <span className="user-menu-name">{displayName}</span>
          <span className="user-menu-role">
            {role ? ROLE_LABEL[role] : "Sem papel"}
            {!approved && role ? " (pendente)" : ""}
          </span>
        </span>
        <span className="user-menu-chevron" aria-hidden>▾</span>
      </button>

      {open ? (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            <div className="user-menu-name">{displayName}</div>
            <div className="user-menu-email">{user.email}</div>
            <div className="user-menu-role-chip">
              {role ? ROLE_LABEL[role] : "Sem papel"}
              {!approved && role ? " · pendente" : ""}
            </div>
          </div>

          <button
            className="user-menu-item"
            type="button"
            onClick={() => {
              setOpen(false);
              navigate({ to: "/menu" });
            }}
          >
            Ir para o menu
          </button>

          {role === "admin" ? (
            <button
              className="user-menu-item"
              type="button"
              onClick={() => {
                setOpen(false);
                setAdminOpen(true);
              }}
            >
              Gerenciar usuários
            </button>
          ) : null}

          <button
            className="user-menu-item user-menu-item-danger"
            type="button"
            onClick={handleSignOut}
          >
            Sair
          </button>
        </div>
      ) : null}

      {adminOpen ? <AdminUsersModal onClose={() => setAdminOpen(false)} /> : null}
    </div>
  );
}
