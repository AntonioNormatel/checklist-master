import { useEffect, useMemo, useRef, useState } from "react";
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

type Kind = "critico" | "simples";

function LoadingScreen() {
  return (
    <main className="site-main app-loading">
      <div className="paper-status ok">Carregando sessao...</div>
    </main>
  );
}

export default function ChecklistView({ kind }: { kind: Kind }) {
  const { user, loading, signOut } = useAuth();
  const tanstackNavigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

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
        if (active) setLeafletReady(true); // segue mesmo sem mapa
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Inicializa o controller legado apos o template estar montado.
  useEffect(() => {
    if (!user || !leafletReady) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    function handleLocalLinks(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (href === "/menu" || href === "/checklist" || href === "/checklist-simples" || href === "/") {
        event.preventDefault();
        tanstackNavigate({ to: href });
      }
    }

    container.addEventListener("click", handleLocalLinks);

    // Adaptador: controllers legados chamam navigate("/path").
    const legacyNavigate = (path: string) => {
      tanstackNavigate({ to: path });
    };

    const cleanup =
      kind === "simples"
        ? initChecklistSimplesController({ user, navigate: legacyNavigate, signOut })
        : initChecklistController({ user, navigate: legacyNavigate, signOut });

    return () => {
      container.removeEventListener("click", handleLocalLinks);
      if (typeof cleanup === "function") cleanup();
    };
  }, [kind, user, leafletReady, signOut, tanstackNavigate]);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div
      key={kind}
      ref={containerRef}
      className="legacy-checklist-page"
      dangerouslySetInnerHTML={{ __html: template }}
    />
  );
}
