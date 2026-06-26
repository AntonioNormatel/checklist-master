/**
 * Agulha de localizacao. Usa currentColor para herdar a cor do texto.
 * `locationNeedleIconMarkup` e a versao em string para injecao em HTML
 * pelos controllers legados (innerHTML).
 */
export const locationNeedleIconMarkup = `
  <svg class="location-needle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12.85 2.75 20.5 21.3l-8.25-4.15L4 21.3l7.65-18.55c.22-.53.98-.53 1.2 0Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" />
    <path d="M12.25 5.85v9.35l4.15 2.1-4.15-11.45Z" fill="currentColor" opacity="0.22" />
  </svg>
`;

// Alias de compatibilidade com versoes anteriores.
export const LOCATION_NEEDLE_SVG = locationNeedleIconMarkup;

export function LocationNeedleIcon({ className = "location-needle-icon" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12.85 2.75 20.5 21.3l-8.25-4.15L4 21.3l7.65-18.55c.22-.53.98-.53 1.2 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12.25 5.85v9.35l4.15 2.1-4.15-11.45Z"
        fill="currentColor"
        opacity="0.22"
      />
    </svg>
  );
}
