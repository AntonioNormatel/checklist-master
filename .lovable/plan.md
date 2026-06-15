
# Aplicar melhorias do checklist

Replicar no projeto atual (TanStack + Supabase) as 5 melhorias descritas. Tudo afeta os dois checklists (`checklist` e `checklist-simples`) — controllers em `src/legacy/` e estilos em `src/legacy-styles/style.css`.

## 1. CSS mobile (`src/legacy-styles/style.css`)

Adicionar bloco `@media (max-width: 640px)` com:
- `html, body, #root { overflow-x: hidden; max-width: 100vw }`
- Reduzir `padding`/`font-size`/`gap` em `.site-header`, `.card`, `.btn`, `.field`, `.tab-panel`
- `.grid-2`, `.grid-3`, `.grid-4` → `grid-template-columns: 1fr`
- `.modal-content` (e variantes) → `width: calc(100vw - 24px); max-height: 90vh; overflow-y: auto`
- Wrappers de tabelas largas (`.table-wrap`, `.historico-table`) → `overflow-x: auto; -webkit-overflow-scrolling: touch`
- `.foto-item` → `width: 100%` para não estourar largura

## 2. Impressão A4 (mesmo arquivo CSS)

Substituir o bloco `@media print` atual (linhas 1395–1434) por:
```css
@page { size: A4 portrait; margin: 8mm; }
@media print {
  body * { visibility: hidden !important; }
  #printArea, #printArea * { visibility: visible !important; }
  #printArea {
    position: absolute; left: 0; top: 0;
    transform: scale(0.55);
    transform-origin: top left;
    width: calc(100% / 0.55);
  }
  .no-print { display: none !important; }
  .page-break { page-break-before: always; break-before: page; }
}
```

## 3. Preview imediato de fotos + draft localStorage

Em `src/legacy/checklistController.js` e `checklistSimplesController.js`:

- Em `addImagemInput()`: ao escolher arquivo (`input change`), ler como base64 com `FileReader` na hora, substituir o `<input type="file">` pelo `<img src="${base64}">` + botão Remover; manter classe `.fotos-preview` como container.
- `collectImagens()`: simplificar para varrer `.foto-item img` (já tem base64).
- Adicionar funções `saveDraft()` / `loadDraft()` usando `localStorage` com chave `checklist_draft_<tipo>_<userId>`:
  - Hook em todos os `input`/`select`/`textarea` do form com debounce ~500ms
  - Inclui `imagens` (base64), `latitude`, `longitude`, `capturedAt`, etapas, infos adicionais
  - `loadDraft()` rodado no início se não houver `currentId`
  - Limpar draft no `salvar()` bem-sucedido e no `sair()`
- Bloco imprimível: dentro de `#printArea`, adicionar `<section class="print-imagens"><h3>Imagens anexadas</h3><div class="print-imagens-grid">…</div></section>` populado em `imprimir()` antes do `window.print()`.

CSS auxiliar (mesmo style.css):
```css
.print-imagens-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.print-imagens-grid img { width: 100%; height: auto; border: 1px solid #ddd; }
```

## 4. GPS no payload e impressão

Nos controllers:
- Ao receber `position` em `useCurrentLocation()`, gravar também `capturedAt = new Date().toISOString()` num campo oculto (`#locationCapturedAt`).
- `coletarPayload()` já inclui `latitude`/`longitude`; adicionar `capturedAt`.
- `setData()` restaura os três campos.
- Em `#printArea`, novo bloco:
  ```html
  <section class="print-localizacao">
    <h3><LocationNeedle/> Localização</h3>
    <p>Lat: … | Lng: … | Capturado em: …</p>
    <a href="https://www.google.com/maps?q=LAT,LNG">Abrir no Maps</a>
  </section>
  ```

Coluna `captured_at` na tabela `checklists`: não é necessária migração se gravarmos dentro do JSON `location` (já é jsonb conforme uso atual). Mantemos `location: { latitude, longitude, capturedAt }`.

## 5. Componente LocationNeedleIcon

Criar `src/components/LocationNeedleIcon.tsx` (projeto é TS, não JSX):
```tsx
export function LocationNeedleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2 L15 12 L12 10 L9 12 Z" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  );
}
```

Uso:
- Importado nos `routes/checklist.tsx` e `routes/checklist-simples.tsx` para renderizar no cabeçalho do bloco "Localização" (substituindo emoji/texto atual, se houver).
- No print fallback (quando SVG inline não imprime bem), os controllers injetam o mesmo path SVG como string no `#printArea`.

## Arquivos tocados

- `src/legacy-styles/style.css` — adiciona bloco mobile, reescreve `@media print`, adiciona `.print-imagens-grid`
- `src/legacy/checklistController.js` — preview imediato, draft, capturedAt, bloco imprimível
- `src/legacy/checklistSimplesController.js` — idem
- `src/components/LocationNeedleIcon.tsx` — novo
- `src/routes/checklist.tsx` e `src/routes/checklist-simples.tsx` — usar o ícone no header de localização

## Fora de escopo

- Não mexer no schema do banco (location já é JSON livre).
- Não tocar em auth, rotas, ou outras telas.

## Verificação

- Build limpo (TanStack + TS).
- Playwright em viewport 412×891 (21:9): conferir sem overflow horizontal, modais ajustados, grids em 1 coluna.
- Print preview do Chromium em A4 retrato: conferir escala 0.55, bloco de imagens e bloco de localização visíveis.
