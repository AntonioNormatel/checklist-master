import { createFileRoute } from "@tanstack/react-router";
import ChecklistView from "@/components/ChecklistView";

export const Route = createFileRoute("/checklist")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Checklist Critico — Normatel Engenharia" },
      {
        name: "description",
        content:
          "Formulario completo de planejamento para atividades criticas, com analise detalhada e ficha tecnica.",
      },
    ],
  }),
  component: () => <ChecklistView kind="critico" />,
});
