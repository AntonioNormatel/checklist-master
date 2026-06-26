const HTML2PDF_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";

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
  const text = String(value || "").trim();
  return text || "\u00a0";
}

function replaceWithValue(control, value) {
  const span = document.createElement("span");
  span.className = `${control.className || ""} pdf-field-value`.trim();
  span.textContent = fieldText(value);
  control.replaceWith(span);
}

function replaceWithMark(control, checked, type) {
  const span = document.createElement("span");
  span.className = `pdf-${type}-value ${checked ? "checked" : ""}`;
  span.textContent = checked ? (type === "checkbox" ? "\u2713" : "\u25cf") : "";
  control.replaceWith(span);
}

function syncControlsForPdf(source, clone) {
  const originalControls = Array.from(source.querySelectorAll("input, select, textarea"));
  const cloneControls = Array.from(clone.querySelectorAll("input, select, textarea"));

  cloneControls.forEach((control, index) => {
    const original = originalControls[index];
    if (!original) return;

    const tag = original.tagName;

    if (tag === "SELECT") {
      const selected = original.selectedOptions?.[0]?.textContent || original.value;
      replaceWithValue(control, selected);
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

function prepareClone(source) {
  const clone = source.cloneNode(true);
  clone.id = "printAreaPdfClone";
  clone.classList.add("pdf-print-area");
  syncControlsForPdf(source, clone);

  const stage = document.createElement("div");
  stage.className = "pdf-export-stage";
  stage.appendChild(clone);
  document.body.appendChild(stage);

  return {
    element: clone,
    cleanup() {
      stage.remove();
    },
  };
}

function loadHtml2Pdf() {
  if (window.html2pdf) return Promise.resolve(window.html2pdf);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-html2pdf-loader]");

    if (existing) {
      existing.addEventListener("load", () => resolve(window.html2pdf), { once: true });
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar html2pdf.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = HTML2PDF_CDN;
    script.async = true;
    script.dataset.html2pdfLoader = "true";
    script.onload = () => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
      } else {
        reject(new Error("html2pdf indisponivel."));
      }
    };
    script.onerror = () => reject(new Error("Falha ao carregar html2pdf."));
    document.head.appendChild(script);
  });
}

export async function gerarPdfDoPrintArea({ nomeBase, solicitacao = "" }) {
  const source = document.getElementById("printArea");
  if (!source) throw new Error("Area do checklist nao encontrada.");

  const html2pdf = await loadHtml2Pdf();
  const filename = makeFilename(nomeBase, solicitacao);
  const { element, cleanup } = prepareClone(source);

  document.body.classList.add("pdf-export");

  try {
    await html2pdf()
      .set({
        margin: 7,
        filename,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: ["tr", "table", ".form-block", ".foto-item"],
        },
      })
      .from(element)
      .save();
  } finally {
    cleanup();
    document.body.classList.remove("pdf-export");
  }
}
