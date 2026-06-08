import { createFileRoute } from "@tanstack/react-router";
import ChecklistView from "@/components/ChecklistView";

export const Route = createFileRoute("/checklist-simples")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Checklist Simples — Normatel Engenharia" },
      {
        name: "description",
        content:
          "Formulario simplificado de planejamento operacional, mantendo padronizacao de registro e impressao.",
      },
    ],
  }),
  component: () => <ChecklistView kind="simples" />,
});
