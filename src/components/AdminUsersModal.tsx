import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listUsersWithRoles,
  setUserRole,
  approveUser,
  deleteUserAccount,
} from "@/lib/admin.functions";
import type { AppRole } from "@/lib/auth-context";

type Row = {
  id: string;
  email: string | undefined;
  name: string | null;
  created_at: string;
  roles: { role: AppRole; approved: boolean }[];
};

const ROLES: AppRole[] = ["admin", "supervisor", "planejador", "executante"];

export default function AdminUsersModal({ onClose }: { onClose: () => void }) {
  const list = useServerFn(listUsersWithRoles);
  const setRole = useServerFn(setUserRole);
  const approve = useServerFn(approveUser);
  const del = useServerFn(deleteUserAccount);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await list();
      setRows(data as any);
    } catch (e: any) {
      setErr(e?.message ?? "Falha ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function effectiveRole(r: Row): AppRole | null {
    const approved = r.roles.filter((x) => x.approved);
    for (const role of ROLES) if (approved.some((a) => a.role === role)) return role;
    if (r.roles.length) return r.roles[0].role;
    return null;
  }

  async function changeRole(r: Row, role: AppRole) {
    setBusy(r.id);
    try {
      const wasApproved = r.roles.some((x) => x.approved);
      await setRole({ data: { userId: r.id, role, approved: wasApproved } });
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Erro");
    } finally {
      setBusy(null);
    }
  }

  async function toggleApprove(r: Row, value: boolean) {
    setBusy(r.id);
    try {
      await approve({ data: { userId: r.id, approved: value } });
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Erro");
    } finally {
      setBusy(null);
    }
  }

  async function remove(r: Row) {
    if (!confirm(`Apagar ${r.email}? Esta acao nao pode ser desfeita.`)) return;
    setBusy(r.id);
    try {
      await del({ data: { userId: r.id } });
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Erro");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="modal-backdrop no-print" onClick={onClose}>
      <div
        className="modal admin-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 920, width: "95%" }}
      >
        <div className="modal-head">
          <div className="modal-title">Gerenciar usuários</div>
          <button className="modal-close" type="button" onClick={onClose}>x</button>
        </div>
        <div className="modal-body" style={{ maxHeight: "70vh", overflow: "auto" }}>
          {err ? <div className="paper-status err" style={{ marginBottom: 12 }}>{err}</div> : null}
          {loading ? (
            <div className="paper-status ok">Carregando...</div>
          ) : (
            <table className="tbl admin-users-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const eff = effectiveRole(r);
                  const isApproved = r.roles.some((x) => x.approved);
                  const isBusy = busy === r.id;
                  return (
                    <tr key={r.id}>
                      <td>{r.name || "—"}</td>
                      <td>{r.email}</td>
                      <td>
                        <select
                          value={eff ?? "executante"}
                          disabled={isBusy}
                          onChange={(e) => changeRole(r, e.target.value as AppRole)}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {isApproved ? (
                          <span style={{ color: "#1f7a3a", fontWeight: 600 }}>aprovado</span>
                        ) : (
                          <span style={{ color: "#b45309", fontWeight: 600 }}>pendente</span>
                        )}
                      </td>
                      <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {isApproved ? (
                          <button
                            className="btn btn-light"
                            type="button"
                            disabled={isBusy}
                            onClick={() => toggleApprove(r, false)}
                          >
                            Revogar
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            type="button"
                            disabled={isBusy}
                            onClick={() => toggleApprove(r, true)}
                          >
                            Aprovar
                          </button>
                        )}
                        <button
                          className="btn btn-light"
                          type="button"
                          disabled={isBusy}
                          onClick={() => remove(r)}
                          style={{ background: "#b91c1c", color: "#fff" }}
                        >
                          Apagar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-light" type="button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
