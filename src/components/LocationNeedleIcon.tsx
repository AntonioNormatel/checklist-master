/**
 * SVG da agulha de localização. Usa currentColor para herdar a cor do texto.
 * Pode ser usado em React (este componente) ou injetado via string usando
 * `LOCATION_NEEDLE_SVG` no markup vanilla dos controllers legados.
 */
export const LOCATION_NEEDLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
  <path d="M12 2 L15.2 12 L12 10 L8.8 12 Z" />
  <circle cx="12" cy="14.2" r="2" />
</svg>
`.trim();

export function LocationNeedleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2 L15.2 12 L12 10 L8.8 12 Z" />
      <circle cx="12" cy="14.2" r="2" />
    </svg>
  );
}
