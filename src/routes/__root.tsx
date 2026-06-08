import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import legacyMainCss from "../legacy-styles/style.css?url";
import legacyExtrasCss from "../legacy-styles/style2.css?url";
import legacyReactCss from "../legacy-styles/react.css?url";
import { AuthProvider } from "../lib/auth-context";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <main className="site-main app-loading">
      <div className="paper-status err">Pagina nao encontrada.</div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="site-main app-loading">
      <div className="paper-status err" style={{ maxWidth: 540 }}>
        <div style={{ marginBottom: 12 }}>
          <b>Algo deu errado ao carregar esta pagina.</b>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Tentar novamente
          </button>
          <Link to="/" className="btn btn-light">
            Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Normatel Engenharia — Checklist de Operacao" },
      {
        name: "description",
        content:
          "Sistema da Normatel Engenharia para preenchimento e acompanhamento dos checklists operacionais (critico e simples).",
      },
      { name: "author", content: "Normatel Engenharia" },
      { property: "og:title", content: "Normatel Engenharia — Checklist de Operacao" },
      {
        property: "og:description",
        content:
          "Plataforma de planejamento operacional para preenchimento de checklists e acompanhamento de registros.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: legacyMainCss },
      { rel: "stylesheet", href: legacyExtrasCss },
      { rel: "stylesheet", href: legacyReactCss },
      { rel: "icon", type: "image/png", href: "/logo-ne.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. */}
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}
