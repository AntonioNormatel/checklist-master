import { supabase } from "../supabaseClient";

export type ChecklistPayload = Record<string, unknown>;

export type ChecklistRow = {
  id: string;
  user_id: string;
  data: ChecklistPayload;
  created_at: string;
  updated_at: string | null;
};

type ListFilters = {
  dateFrom?: string;
  dateTo?: string;
};

function assertValidPayload(payload: ChecklistPayload) {
  const descricao = String(payload?.descricaoAtividade || "").trim();

  if (descricao.length < 3) {
    throw new Error("Informe a Descricao da Atividade (min 3 caracteres).");
  }

  if (Array.isArray(payload?.imagens)) {
    for (const img of payload.imagens) {
      if (typeof img !== "string" || !img.startsWith("data:image/")) {
        throw new Error("Imagem deve ser um data URL valido.");
      }
    }
  }
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error("Nao autorizado. Faca login.");

  return data.user;
}

function getUserName(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return (
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuario"
  );
}

function normalizeChecklist(row: ChecklistRow, userName = "") {
  const payload = row.data || {};

  return {
    ...payload,
    id: row.id,
    userId: row.user_id,
    userEmail: "",
    userName,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function filterByPayloadDate(item: Record<string, unknown>, filters: ListFilters) {
  const payloadDate = String(item.data || item.dataInicio || item.createdAt || "").slice(0, 10);

  if (filters.dateFrom && payloadDate < filters.dateFrom) return false;
  if (filters.dateTo && payloadDate > filters.dateTo) return false;

  return true;
}

// CRUD centralizado: substitui as antigas rotas /api/checklists do Express.
export async function listChecklists(filters: ListFilters = {}) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("checklists")
    .select("id,user_id,data,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || [])
    .map((row) => normalizeChecklist(row as ChecklistRow, getUserName(user)))
    .filter((item) => filterByPayloadDate(item, filters));
}

export async function getChecklist(id: string) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("checklists")
    .select("id,user_id,data,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  return normalizeChecklist(data as ChecklistRow, getUserName(user));
}

export async function createChecklist(payload: ChecklistPayload) {
  const user = await getCurrentUser();
  assertValidPayload(payload);

  const { data, error } = await supabase
    .from("checklists")
    .insert({
      user_id: user.id,
      data: payload,
    })
    .select("id")
    .single();

  if (error) throw error;

  return { id: data.id as string };
}

export async function updateChecklist(id: string, payload: ChecklistPayload) {
  const user = await getCurrentUser();
  assertValidPayload(payload);

  const { error } = await supabase
    .from("checklists")
    .update({
      data: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  return { ok: true, id };
}

export async function deleteChecklist(id: string) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("checklists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  return { ok: true };
}
