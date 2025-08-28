// Blue Home: buscador que lee CSV publicado de Google Sheets
// Config: cambia SHEET_CSV_URL en index.html si es necesario.
const CSV_URL = window.SHEET_CSV_URL;

// Utilidades
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const fmtMoney = (n) => new Intl.NumberFormat('es-CO', {style:'currency', currency:'COP', maximumFractionDigits:0}).format(Number(n)||0);
const iframeYT = (url) => {
  if (!url) return "";
  // soporta enlaces completos de YouTube o solo el ID
  const idMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  const id = idMatch ? idMatch[1] : url.trim();
  return `https://www.youtube.com/embed/${id}`;
};

// Cache simple en localStorage (5 minutos)
const CACHE_KEY = "bluehome_csv_cache_v1";
const MAX_AGE_MS = 5 * 60 * 1000;

async function fetchCSV() {
  try {
    const now = Date.now();
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const obj = JSON.parse(cached);
      if (now - obj.ts < MAX_AGE_MS) return obj.rows;
    }
    const res = await fetch(CSV_URL, {cache:"no-store"});
    if (!res.ok) throw new Error("No se pudo cargar el CSV");
    const text = await res.text();
    const rows = parseCSV(text);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ts: now, rows}));
    return rows;
  } catch (e) {
    console.error(e);
    $("#results").innerHTML = `<div class="loading">Error cargando datos. Revisa el enlace del CSV.</div>`;
    return [];
  }
}

// CSV muy simple (se asume sin comillas complejas). Si se complica, cambiar por PapaParse.
function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] ?? "");
    return obj;
  });
}

// Normaliza headers esperados según tu hoja (en minúsculas)
function normalize(row){
  // Posibles nombres de columnas (ajusta si cambian)
  return {
    codigo: row["codigo"] || row["código"] || "",
    direccion: row["direccion"] || row["dirección"] || "",
    tipo: (row["tipo"]||"").toLowerCase(),
    valor: row["valor canon"] || row["canon"] || row["valor"] || "",
    habitaciones: row["numero habitaciones"] || row["habitaciones"] || "",
    banos: row["numero banos"] || row["baños"] || row["banos"] || "",
    parqueadero: row["parqueadero"] || "",
    youtube: row["enlace youtube"] || row["youtube"] || row["link youtube"] || "",
    ficha: row["enlace ficha tecnica"] || row["enlace ficha técnica"] || "",
    estado: (row["estado"]||"disponible").toLowerCase()
  };
}

function habBucket(v){
  const n = parseInt(v||"0",10);
  if (isNaN(n)) return "";
  return n >= 4 ? "4" : String(n);
}

function applyFilters(data){
  const t = $("#tipo").value;
  const h = $("#habitaciones").value;
  const pmax = parseInt($("#presupuesto").value||"0",10);
  const q = $("#buscar").value.toLowerCase();

  return data.filter(r => {
    if (r.estado && r.estado.startsWith("no")) return false; // ocultar no_disponible
    if (t && r.tipo !== t) return false;
    if (h && habBucket(r.habitaciones) !== h) return false;
    if (pmax && Number(r.valor||0) > pmax) return false;
    if (q && !(`${r.codigo} ${r.direccion}`.toLowerCase().includes(q))) return false;
    return true;
  });
}

function render(list){
  const results = $("#results");
  results.innerHTML = "";
  if (!list.length){
    results.innerHTML = '<div class="loading">No hay inmuebles que coincidan con los filtros.</div>';
    return;
  }
  const tpl = $("#card-tpl");
  list.forEach(item => {
    const card = tpl.content.cloneNode(true);
    const title = card.querySelector(".title");
    const canon = card.querySelector(".canon");
    const hab = card.querySelector(".hab");
    const ban = card.querySelector(".ban");
    const paq = card.querySelector(".paq");
    const codigo = card.querySelector(".codigo");
    const pillTipo = card.querySelector(".pill-tipo");
    const pillEstado = card.querySelector(".pill-estado");
    const aYT = card.querySelector("[data-youtube]");
    const aFicha = card.querySelector("[data-ficha]");
    const iframe = card.querySelector(".yt");

    title.textContent = item.direccion ? item.direccion : `Código ${item.codigo}`;
    canon.textContent = fmtMoney(item.valor);
    hab.textContent = item.habitaciones || "-";
    ban.textContent = item.banos || "-";
    paq.textContent = item.parqueadero || "—";
    codigo.textContent = item.codigo || "—";

    pillTipo.textContent = item.tipo || "—";
    pillEstado.textContent = (item.estado==="disponible" ? "Disponible" : "No disponible");
    pillEstado.classList.add(item.estado==="disponible" ? "ok":"no");

    if (item.youtube){
      aYT.href = typeof item.youtube === "string" ? item.youtube : "#";
      iframe.src = iframeYT(item.youtube);
    } else {
      aYT.style.display = "none";
      iframe.style.display = "none";
    }
    if (item.ficha){
      aFicha.href = item.ficha;
    } else {
      aFicha.style.display = "none";
    }

    results.appendChild(card);
  });
}

async function init(){
  $("#year").textContent = new Date().getFullYear();
  const raw = await fetchCSV();
  const data = raw.map(normalize);
  window._DATA = data; // debug

  // poblar resultados
  render(data);

  // eventos
  $("#aplicar").addEventListener("click", () => render(applyFilters(data)));
  $("#limpiar").addEventListener("click", () => {
    $("#tipo").value = "";
    $("#habitaciones").value = "";
    $("#presupuesto").value = "";
    $("#buscar").value = "";
    render(data);
  });
}

document.addEventListener("DOMContentLoaded", init);
