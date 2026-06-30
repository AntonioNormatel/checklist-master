// Robust PDF export: bundled html2canvas + jsPDF.
// Builds an offscreen A4-width clone, replaces form controls with static text,
// strips interactive widgets (maps, buttons, iframes, etc.) and slices the
// rendered canvas across multiple A4 pages.

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_WIDTH_PX = 794; // 210mm at ~96dpi
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function safeFilePart(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function makeFilename(nomeBase, solicitacao) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const parts = [safeFilePart(nomeBase), safeFilePart(solicitacao), stamp].filter(Boolean);
  return `${parts.join("-")}.pdf`;
}

function fieldText(value) {
  const text = String(value ?? "").trim();
  return text || "\u00a0";
}

function replaceWithValue(control, value) {
  const span = control.ownerDocument.createElement("span");
  span.className = "pdf-field-value";
  span.textContent = fieldText(value);
  control.replaceWith(span);
}

function replaceWithMark(control, checked, type) {
  const span = control.ownerDocument.createElement("span");
  span.className = `pdf-${type}-value ${checked ? "checked" : ""}`;
  span.textContent = checked ? (type === "checkbox" ? "\u2713" : "\u25cf") : "";
  control.replaceWith(span);
}

function syncControlsForPdf(source, clone) {
  const originals = Array.from(source.querySelectorAll("input, select, textarea"));
  const clones = Array.from(clone.querySelectorAll("input, select, textarea"));
  clones.forEach((control, index) => {
    const original = originals[index];
    if (!original) {
      control.remove();
      return;
    }
    const tag = original.tagName;
    if (tag === "SELECT") {
      replaceWithValue(control, original.selectedOptions?.[0]?.textContent || original.value);
      return;
    }
    if (tag === "TEXTAREA") {
      replaceWithValue(control, original.value);
      return;
    }
    const type = String(original.type || "text").toLowerCase();
    if (type === "checkbox" || type === "radio") {
      replaceWithMark(control, original.checked, type);
      return;
    }
    if (type === "file") {
      control.remove();
      return;
    }
    replaceWithValue(control, original.value);
  });
}

function stripNonPrintable(clone) {
  const selectors = [
    ".no-print",
    "[data-no-print]",
    "button",
    ".btn",
    ".add-btn",
    ".remove-btn",
    ".foto-remove-btn",
    "#btnAddImagem",
    "#btnGetLocation",
    ".location-map",
    ".leaflet-container",
    ".leaflet-pane",
    ".leaflet-control",
    "iframe",
    "nav",
    ".site-menu",
    ".actions-stack",
    "script",
    "noscript",
  ];
  clone.querySelectorAll(selectors.join(",")).forEach((el) => el.remove());
}

async function waitForImages(container) {
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.onload = () => resolve();
          img.onerror = () => {
            img.remove();
            resolve();
          };
          // Safety timeout per image
          setTimeout(resolve, 4000);
        }),
    ),
  );
}

function prepareClone(source) {
  const clone = source.cloneNode(true);
  clone.id = "printAreaPdfClone";
  clone.classList.add("pdf-print-area", "pdf-export-clone");

  syncControlsForPdf(source, clone);
  stripNonPrintable(clone);

  // Offscreen A4-wide stage
  const stage = document.createElement("div");
  stage.setAttribute(
    "style",
    [
      "position:fixed",
      "left:-100000px",
      "top:0",
      `width:${A4_WIDTH_PX}px`,
      "background:#ffffff",
      "z-index:-1",
      "pointer-events:none",
    ].join(";"),
  );

  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.background = "#ffffff";
  clone.style.padding = "20px";
  clone.style.boxSizing = "border-box";
  clone.style.color = "#111";

  stage.appendChild(clone);
  document.body.appendChild(stage);
  return {
    element: clone,
    cleanup() {
      stage.remove();
    },
  };
}

// CSS injected in the cloned document so html2canvas never sees modern color
// functions (oklch/lab/color()) that it cannot parse.
const PDF_SAFE_CSS = `
  .pdf-export-clone, .pdf-export-clone * {
    color: #111 !important;
    border-color: #333 !important;
    text-shadow: none !important;
    filter: none !important;
    box-shadow: none !important;
    background-image: none !important;
  }
  .pdf-export-clone { background: #ffffff !important; }
  .pdf-export-clone .pdf-field-value {
    display: inline-block;
    min-height: 1em;
    padding: 2px 4px;
    font-weight: 600;
  }
  .pdf-export-clone .pdf-checkbox-value,
  .pdf-export-clone .pdf-radio-value {
    display: inline-block;
    width: 14px; height: 14px;
    border: 1px solid #333;
    text-align: center; line-height: 12px;
    font-size: 12px;
  }
  .pdf-export-clone .pdf-radio-value { border-radius: 50%; }
`;

export async function gerarPdfDoPrintArea({ nomeBase, solicitacao = "" }) {
  const source = document.getElementById("printArea");
  if (!source) throw new Error("Area do checklist nao encontrada (#printArea).");

  const filename = makeFilename(nomeBase, solicitacao);
  const { element, cleanup } = prepareClone(source);

  document.body.classList.add("pdf-export");

  try {
    await waitForImages(element);
    await new Promise((r) => setTimeout(r, 150));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (doc) => {
        try {
          const style = doc.createElement("style");
          style.textContent = PDF_SAFE_CSS;
          doc.head.appendChild(style);
          doc
            .querySelectorAll(
              ".location-map, .leaflet-container, iframe, .no-print, button, .btn, .actions-stack, nav, .site-menu",
            )
            .forEach((el) => el.remove());
        } catch (err) {
          console.warn("[pdf] onclone falhou:", err);
        }
      },
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const imgWidthMm = A4_WIDTH_MM;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    let heightLeft = imgHeightMm;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgWidthMm, imgHeightMm);
    heightLeft -= A4_HEIGHT_MM;

    while (heightLeft > 0) {
      position -= A4_HEIGHT_MM;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= A4_HEIGHT_MM;
    }

    pdf.save(filename);
  } catch (err) {
    console.error("[pdf] Falha ao gerar PDF:", {
      message: err?.message,
      stack: err?.stack,
      err,
    });
    throw err;
  } finally {
    cleanup();
    document.body.classList.remove("pdf-export");
  }
}
