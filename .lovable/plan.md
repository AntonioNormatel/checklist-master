## Objetivo

Adicionar controle de acesso por papéis (roles), reorganizar a UI com menu de usuário e ajustar o estilo dos botões.

## 1. Papéis (Roles)

Criar três papéis no backend:
- **admin** — tudo + gerenciar usuários (aprovar, alterar papel, apagar)
- **supervisor** e **planejador** — mesmo nível: novo, puxar, salvar, corrigir, baixar PDF
- **executante** (encarregado) — apenas novo e salvar (sem puxar, sem baixar PDF)

### Migração SQL
- `create type app_role as enum ('admin','supervisor','planejador','executante')`
- Tabela `user_roles (id, user_id → auth.users, role app_role, approved boolean default false, unique(user_id,role))`
- GRANTs + RLS + função `has_role(_user_id, _role) security definer`
- Trigger em `auth.users` (INSERT) cria registro padrão `executante` com `approved=false` (admin precisa aprovar)
- Seed: marcar o e-mail `antonio.pedro@normatel.com.br` como `admin` aprovado
- Policy: usuário vê seu próprio papel; admin vê/edita todos

## 2. Botões — estilo global

Em `src/legacy-styles/style.css` e `style2.css`:
- `.btn-primary` (e botões de ação dos checklists): fundo verde Normatel `#1f7a3a`, texto branco
- `:hover` → fundo preto `#0f172a`, texto branco
- `.btn-light` segue o mesmo padrão (verde → preto no hover) para uniformidade pedida
- Manter `Sair` em vermelho discreto

## 3. Menu de usuário (topo direito)

Substituir o botão "Sair" solto por um **dropdown no canto superior direito** com avatar + nome:
- Itens comuns: Meu perfil, Sair
- Se `admin`: **Gerenciar usuários** (abre modal com lista de usuários pendentes/ativos, aprovar, mudar role, apagar)
- Visível em todas as páginas (menu, checklist, checklist-simples)

Componente novo: `src/components/UserMenu.tsx` (usa Supabase para listar/atualizar `user_roles` via server functions admin).

## 4. Permissões na UI

No `ChecklistView` / controllers, ler role atual via hook `useRole()`:
- Botão **Puxar checklists**: visível para todos (admin/supervisor/planejador/executante) — antes podia estar restrito
- Botão **Baixar PDF**: oculto para `executante`
- Botões de edição/correção em registros existentes: ocultos para `executante` (só pode criar novo + salvar)

Implementação: adicionar/remover classes `role-hidden-executante` ou condicionar `display:none` via CSS injetado pelo wrapper React baseado no role.

## 5. Gerenciar usuários (admin)

Modal `AdminUsersModal.tsx`:
- Lista usuários (`auth.admin.listUsers` via server function com `requireSupabaseAuth` + checagem `has_role(uid,'admin')`)
- Ações: aprovar (set `approved=true`), alterar role (select), remover (`auth.admin.deleteUser`)
- Server functions em `src/lib/admin.functions.ts` usando `supabaseAdmin` dentro do handler após validar admin

## 6. Detalhes técnicos
- `src/lib/auth-context.tsx`: expor `role` e `approved` carregados via query em `user_roles`
- Bloquear login no app se `approved=false` → tela "Aguardando aprovação do administrador"
- Atualizar `src/start.ts` para incluir middleware bearer (`attachSupabaseAuth`) se ainda não estiver

## Arquivos afetados
- migração SQL nova
- `src/lib/auth-context.tsx` (adiciona role)
- `src/components/UserMenu.tsx` (novo)
- `src/components/AdminUsersModal.tsx` (novo)
- `src/lib/admin.functions.ts` (novo)
- `src/routes/menu.tsx`, `src/components/ChecklistView.tsx` (integrar UserMenu, esconder Sair antigo)
- `src/legacy-styles/style.css` / `style2.css` (cores dos botões + hover)
- `src/legacy/checklistController.js` / `checklistSimplesController.js` (esconder Baixar PDF p/ executante; manter Puxar visível)

## Pontos de confirmação
1. OK criar trigger que coloca novo usuário como `executante` pendente de aprovação? (Alternativa: aprovar automaticamente e admin só promove role.)
2. Verde Normatel exato — uso `#1f7a3a` (igual ao botão atual do "Abrir Checklist Crítico") ou tem outro hex?
3. `antonio.pedro@normatel.com.br` é o admin inicial?
