import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useNavigate } from "@tanstack/react-router";
import {
  checklistCriticoTemplate,
  checklistSimplesTemplate,
  // @ts-expect-error - legacy JS module without types
} from "@/legacy/templates";
// @ts-expect-error - legacy JS module without types
import { initChecklistController } from "@/legacy/checklistController";
// @ts-expect-error - legacy JS module without types
import { initChecklistSimplesController } from "@/legacy/checklistSimplesController";
import { useAuth } from "@/lib/auth-context";
import UserMenu from "@/components/UserMenu";

type Kind = "critico" | "simples";

function LoadingScreen() {
  return (
    <main className="site-main app-loading">
      <div className="paper-status ok">Carregando sessao...</div>
    </main>
  );
}

export default function ChecklistView({ kind }: { kind: Kind }) {
  const { user, loading, role, approved, roleLoading, signOut } = useAuth();
  const tanstackNavigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  // Refs estáveis para callbacks (evita re-executar o init em cada render).
  const signOutRef = useRef(signOut);
  const navigateRef = useRef(tanstackNavigate);
  useEffect(() => {
    signOutRef.current = signOut;
    navigateRef.current = tanstackNavigate;
  });

  const template = useMemo(
    () => (kind === "simples" ? checklistSimplesTemplate : checklistCriticoTemplate),
    [kind]
  );

  // Carrega Leaflet e CSS apenas no client (o controller usa window.L).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // @ts-ignore - leaflet ships without bundled types
        const mod: any = await import("leaflet");
        // @ts-ignore - vite resolves css side-effect
        await import("leaflet/dist/leaflet.css");
        if (!active) return;
        (window as unknown as { L: unknown }).L = mod.default ?? mod;
        setLeafletReady(true);
      } catch (err) {
        console.warn("Falha ao carregar Leaflet:", err);
        if (active) setLeafletReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Atualiza apenas a classe quando o role muda (sem re-inicializar tudo).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.classList.toggle("role-executante", role === "executante");
    const pdfBtn = container.querySelector<HTMLElement>("#btnImprimirModal");
    if (pdfBtn) pdfBtn.style.display = role === "executante" ? "none" : "";
  }, [role]);

  // Injeta o template e inicializa o controller legado uma única vez por kind/usuário.
  useEffect(() => {
    if (!user || !leafletReady || !approved) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    // Set innerHTML imperativamente para que React nunca o reescreva.
    container.innerHTML = template;

    function handleLocalLinks(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (href === "/menu" || href === "/checklist" || href === "/checklist-simples" || href === "/") {
        event.preventDefault();
        navigateRef.current({ to: href });
      }
    }
    container.addEventListener("click", handleLocalLinks);

    const legacyNavigate = (path: string) => navigateRef.current({ to: path });
    const legacySignOut = () => signOutRef.current();

    let cleanup: (() => void) | undefined;
    try {
      cleanup =
        kind === "simples"
          ? initChecklistSimplesController({ user, navigate: legacyNavigate, signOut: legacySignOut })
          : initChecklistController({ user, navigate: legacyNavigate, signOut: legacySignOut });
    } catch (err) {
      console.error("[ChecklistView] init falhou", err);
    }

    // Injeta UserMenu no header legado
    const headerRight = container.querySelector<HTMLElement>(".site-header .header-right");
    if (headerRight && !headerRight.querySelector(".user-menu-slot")) {
      const slot = document.createElement("div");
      slot.className = "user-menu-slot";
      headerRight.appendChild(slot);
      setHeaderSlot(slot);
    }

    return () => {
      container.removeEventListener("click", handleLocalLinks);
      if (typeof cleanup === "function") cleanup();
      setHeaderSlot(null);
      container.innerHTML = "";
    };
  }, [kind, user?.id, leafletReady, approved, template]);


  if (loading || roleLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (!approved) return <Navigate to="/menu" replace />;

  return (
    <>
      <div key={kind} ref={containerRef} className="legacy-checklist-page" />
      {headerSlot ? createPortal(<UserMenu />, headerSlot) : null}
    </>
  );
}
