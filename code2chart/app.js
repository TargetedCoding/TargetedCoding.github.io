/* Mermaid Flowchart Studio – Production JS
   - Live render + error handling
   - Colorful theme palettes
   - Export SVG / PNG (PNG export uses pure-SVG render to avoid tainted canvas)
   - File open + sample loader
*/

const editorEl = document.getElementById('editor');
const diagramHost = document.getElementById('diagram');
const renderBtn = document.getElementById('renderBtn');
const exportBtn = document.getElementById('exportBtn');
const exportType = document.getElementById('exportType');
const errorBox = document.getElementById('errorBox');
const openBtn = document.getElementById('openBtn');
const openFile = document.getElementById('openFile');
const sampleBtn = document.getElementById('sampleBtn');
const clearBtn = document.getElementById('clearBtn');
const paletteButtons = [...document.querySelectorAll('.palette')];
const uiThemeToggle = document.getElementById('uiTheme');
const fitToggle = document.getElementById('fitToggle');
const sizeInfo = document.getElementById('sizeInfo');

// Offscreen container for measuring export SVG safely (not visible, but in DOM)
const offscreenMeasure = document.createElement('div');
offscreenMeasure.style.position = 'absolute';
offscreenMeasure.style.left = '-100000px';
offscreenMeasure.style.top = '-100000px';
offscreenMeasure.style.visibility = 'hidden';
document.body.appendChild(offscreenMeasure);

// ----- Sample (strict/ASCII only) -----
const SAMPLE = `flowchart TD
subgraph Ingest
    I1[Code Repos - AST, CFG, Dataflow]
    I2[Docs and Manuals - Policies, SOPs, RFCs]
    I3[Runtime Signals - Logs, Traces, Metrics]
end
subgraph Extract
    E1[Domain Classifier - Modules or Capabilities]
    E2[Entity and Action Miner - Functions, Tables, APIs]
    E3[Transformation Mapper - Code to Data Lineage]
    E4[Requirement Synthesizer - Epics and Stories]
end
subgraph Build
    B1[Epic Generator]
    B2[Story Composer]
    B3[Acceptance Criteria Linker - ties AC to code and data transforms]
    TL[Traceability Store - code to story to AC links]
end
subgraph Persona
    P1[Business Analyst View - outcomes and KPIs]
    P2[Operations View - SOPs and runbooks]
    P3[IT Manager View - roadmap and risks]
    P4[Developer View - interfaces and tests]
end
subgraph QA
    Q1[Consistency and Conflict Scan]
    Q2[Coverage Check - AC completeness]
    Q3[Policy and NFR Linter - security, performance, privacy]
    Q4{Issues Found?}
end
subgraph Review
    R1[Reviewer Inbox - product, BA, QA]
    R2[Inline Fix or Approve]
end
subgraph Publish
    O1[Backlog - Jira or Azure Boards or GitHub Projects]
    O2[Release Notes and Docs Portals]
end
I1 --> E1
I2 --> E1
I3 --> E1
E1 --> E2 --> E3 --> E4
E4 --> B1 --> B2 --> B3 --> TL
TL --> P1
TL --> P2
TL --> P3
TL --> P4
B1 --> QA
B2 --> QA
B3 --> QA
QA --> Q1 --> Q2 --> Q3 --> Q4
Q4 -- No --> O1
Q4 -- Yes --> R1 --> R2
R2 -- Fix accepted --> B2
R2 -- Approve --> O1
O1 --> O2`;

// ----- Theme palettes (for Mermaid themeVariables) -----
const palettes = [
  { // Aurora
    primaryColor: "#a78bfa",
    primaryBorderColor: "#7c3aed",
    primaryTextColor: "#0b0d10",
    lineColor: "#7c3aed",
    secondaryColor: "#60a5fa",
    tertiaryColor: "#f472b6",
    nodeTextColor: "#60a5fa",
    edgeLabelBackground: "#0b0d10",
    clusterBkg: "#111827",
    clusterBorder: "#7dd3fc"
  },
  { // Sunset
    primaryColor: "#fb923c",
    primaryBorderColor: "#f97316",
    primaryTextColor: "#0b0d10",
    lineColor: "#f97316",
    secondaryColor: "#ef4444",
    tertiaryColor: "#f59e0b",
    nodeTextColor: "#ef4444",
    edgeLabelBackground: "#0b0d10",
    clusterBkg: "#1f2937",
    clusterBorder: "#fda4af"
  },
  { // Neon
    primaryColor: "#22d3ee",
    primaryBorderColor: "#06b6d4",
    primaryTextColor: "#06141b",
    lineColor: "#06b6d4",
    secondaryColor: "#a3e635",
    tertiaryColor: "#facc15",
    nodeTextColor: "#a3e635",
    edgeLabelBackground: "#06141b",
    clusterBkg: "#0f172a",
    clusterBorder: "#34d399"
  },
  { // Verdant
    primaryColor: "#34d399",
    primaryBorderColor: "#10b981",
    primaryTextColor: "#052017",
    lineColor: "#10b981",
    secondaryColor: "#22d3ee",
    tertiaryColor: "#60a5fa",
    nodeTextColor: "#22d3ee",
    edgeLabelBackground: "#052017",
    clusterBkg: "#0b1220",
    clusterBorder: "#93c5fd"
  }
];

let currentPaletteIndex = 0;

// ----- Mermaid init (we control rendering manually) -----
function mermaidConfigFromPalette(p) {
  return {
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: {
      primaryColor: p.primaryColor,
      primaryBorderColor: p.primaryBorderColor,
      primaryTextColor: p.primaryTextColor,
      lineColor: p.lineColor,
      secondaryColor: p.secondaryColor,
      tertiaryColor: p.tertiaryColor,
      noteBkgColor: p.secondaryColor,
      noteTextColor: '#0b0d10',
      nodeTextColor: p.nodeTextColor,
      mainBkg: '#0b0d10',
      clusterBkg: p.clusterBkg,
      clusterBorder: p.clusterBorder,
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      edgeLabelBackground: p.edgeLabelBackground
    },
    flowchart: {
      htmlLabels: true, // pretty labels for on-screen viewing
      curve: 'basis'
    }
  };
}

function initMermaid() {
  mermaid.initialize(mermaidConfigFromPalette(palettes[currentPaletteIndex]));
}
initMermaid();

// ----- Rendering -----
async function renderDiagram() {
  const code = editorEl.value.trim();
  errorBox.classList.add('hidden');
  errorBox.textContent = '';

  if (!code) {
    diagramHost.innerHTML = '';
    sizeInfo.textContent = '';
    return;
  }

  try {
    // Parse validation for quick feedback (throws on syntax issues)
    mermaid.parse(code);

    // Unique id for this render
    const id = 'mm-' + Math.random().toString(36).slice(2, 9);

    const { svg } = await mermaid.render(id, code);

    diagramHost.innerHTML = svg;

    const svgEl = diagramHost.querySelector('svg');
    svgEl.setAttribute('width', '100%'); // responsive width
    svgEl.style.maxWidth = '100%';

    // Fit to view (optional)
    if (fitToggle.checked) {
      svgEl.removeAttribute('height');
      svgEl.style.height = 'auto';
    }

    const bbox = svgEl.getBBox();
    sizeInfo.textContent = `Diagram size: ${Math.round(bbox.width)} × ${Math.round(bbox.height)} px`;

  } catch (err) {
    errorBox.textContent = 'Mermaid error: ' + (err?.message || err);
    errorBox.classList.remove('hidden');
    console.error(err);
  }
}

// ----- Export helpers -----

// Render a PURE-SVG version (no <foreignObject>) for PNG export to avoid tainted canvas
async function renderExportSVGString(code) {
  // Build a safe config: htmlLabels disabled
  const base = mermaidConfigFromPalette(palettes[currentPaletteIndex]);
  const exportConfig = {
    ...base,
    startOnLoad: false,
    flowchart: {
      ...(base.flowchart || {}),
      htmlLabels: false, // IMPORTANT: avoid <foreignObject>
      curve: 'basis'
    }
  };

  // Initialize with safe config for export render
  mermaid.initialize(exportConfig);
  const id = 'mm-export-' + Math.random().toString(36).slice(2, 9);
  const { svg } = await mermaid.render(id, code);

  // Re-initialize back to normal viewing config
  mermaid.initialize(mermaidConfigFromPalette(palettes[currentPaletteIndex]));

  return svg;
}

/**
 * Serialize SVG for export.
 * If `overrideSvgString` is provided, it will be injected offscreen and measured there.
 */
function serializeSVG(overrideSvgString = null) {
  let svgEl;

  if (overrideSvgString) {
    offscreenMeasure.innerHTML = overrideSvgString;
    svgEl = offscreenMeasure.querySelector('svg');
  } else {
    svgEl = diagramHost.querySelector('svg');
  }

  if (!svgEl) return null;

  const bbox = svgEl.getBBox();
  const padding = 16;

  // Clone for export and set XMLNS
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const bg = document.body.classList.contains('light') ? '#ffffff' : '#0b0d10';
  const exportWidth  = Math.ceil(bbox.width  + padding * 2);
  const exportHeight = Math.ceil(bbox.height + padding * 2);

  clone.setAttribute('width',  String(exportWidth));
  clone.setAttribute('height', String(exportHeight));
  clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${exportWidth} ${exportHeight}`);
  clone.setAttribute('preserveAspectRatio', 'xMinYMin meet');

  // Optional solid background (remove if you want transparent PNG)
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', String(bbox.x - padding));
  rect.setAttribute('y', String(bbox.y - padding));
  rect.setAttribute('width',  String(exportWidth));
  rect.setAttribute('height', String(exportHeight));
  rect.setAttribute('fill', bg);
  clone.insertBefore(rect, clone.firstChild);

  const serializer = new XMLSerializer();
  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);

  if (overrideSvgString) {
    offscreenMeasure.textContent = ''; // cleanup
  }

  return { svgString, width: exportWidth, height: exportHeight };
}

function download(filename, blob) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}

async function exportSVG() {
  const data = serializeSVG();
  if (!data) return;
  const blob = new Blob([data.svgString], { type: 'image/svg+xml;charset=utf-8' });
  download('diagram.svg', blob);
}

async function exportPNG() {
  const code = editorEl.value.trim();
  if (!code) return;

  // Render SAFE SVG (no <foreignObject>) and serialize it with proper box + bg
  const exportSvgString = await renderExportSVGString(code);
  const data = serializeSVG(exportSvgString);
  if (!data) return;

  const { svgString, width, height } = data;
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

  // Scale using devicePixelRatio (capped) for sharp output
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  const scale = dpr;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d');

  // Prefer createImageBitmap route (fast & reliable)
  try {
    const bitmap = await createImageBitmap(svgBlob);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(bitmap, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (blob) {
        download('diagram.png', blob);
      } else {
        // Safari fallback
        const dataUrl = canvas.toDataURL('image/png');
        const bstr = atob(dataUrl.split(',')[1]);
        const u8 = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
        download('diagram.png', new Blob([u8], { type: 'image/png' }));
      }
    }, 'image/png');

    return;
  } catch {
    // Fallback to Image() path
  }

  // Fallback path (broad compatibility)
  const url = URL.createObjectURL(svgBlob);
  const img = new Image(); // don't set crossOrigin for blob: URLs
  img.onload = () => {
    URL.revokeObjectURL(url);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (blob) {
        download('diagram.png', blob);
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const bstr = atob(dataUrl.split(',')[1]);
        const u8 = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
        download('diagram.png', new Blob([u8], { type: 'image/png' }));
      }
    }, 'image/png');
  };
  img.onerror = (e) => {
    console.error('PNG export image load error', e);
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ----- UI bindings -----
renderBtn.addEventListener('click', renderDiagram);
exportBtn.addEventListener('click', () => {
  const kind = exportType.value;
  if (kind === 'svg') exportSVG();
  else exportPNG();
});
sampleBtn.addEventListener('click', () => {
  editorEl.value = SAMPLE;
  renderDiagram();
});
clearBtn.addEventListener('click', () => {
  editorEl.value = '';
  diagramHost.innerHTML = '';
  sizeInfo.textContent = '';
  errorBox.classList.add('hidden');
  errorBox.textContent = '';
});
openBtn.addEventListener('click', () => openFile.click());
openFile.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  editorEl.value = text;
  renderDiagram();
});

// Palette switching
paletteButtons.forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    paletteButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPaletteIndex = idx;
    mermaid.initialize(mermaidConfigFromPalette(palettes[currentPaletteIndex]));
    renderDiagram();
  });
});

// Dark / Light UI toggle
uiThemeToggle.addEventListener('change', () => {
  document.body.classList.toggle('light', !uiThemeToggle.checked);
  renderDiagram();
});

// Keyboard shortcut: Ctrl/Cmd+Enter to render
document.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    renderDiagram();
  }
});

// Initial state
uiThemeToggle.checked = true; // start in dark UI
editorEl.value = SAMPLE;
renderDiagram();
