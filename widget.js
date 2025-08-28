// v5 – mismo motor de datos, layout responsive mejorado para desktop
const CSV_URL = window.SHEET_CSV_URL;
const $ = (s, r=document)=>r.querySelector(s);
const fmtMoney = (n)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
const numFrom = (s)=>s?Number(String(s).replace(/[^0-9]/g,''))||0:0;
const normKey = (k)=>String(k||"").normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const iframeYT = (url)=>{if(!url)return '';const m=String(url).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);return m?`https://www.youtube.com/embed/${m[1]}`:url;};

const KEYMAP = {
  codigo: ['codigo','codigoinmueble','id','code'],
  direccion: ['direccion','ubicacion','direccioninmueble'],
  tipo: ['tipo','tipoinmueble'],
  valor: ['valorcanon','canon','valor','canonmensual','valorarriendo'],
  habitaciones: ['numerohabitaciones','habitaciones','habitacion'],
  banos: ['numerobanos','banos','baños'],
  parqueadero: ['parqueadero','garaje','parqueos'],
  youtube: ['enlaceyoutube','linkyoutube','youtube'],
  ficha: ['enlacefichatecnica','fichatecnica','ficha'],
  estado: ['estado','disponibilidad']
};

function findKey(obj, aliases){
  for (const k of Object.keys(obj)){
    const nk = normKey(k);
    if (aliases.includes(nk)) return k;
  }
  return null;
}
function pick(obj, name){
  const aliases = (KEYMAP[name]||[]).map(normKey);
  const realKey = findKey(obj, aliases);
  return realKey ? obj[realKey] : "";
}

async function fetchRows(){
  const res = await fetch(CSV_URL, {cache:"no-store"});
  const text = await res.text();
  const parsed = Papa.parse(text, {header:true, skipEmptyLines:true});
  const rows = (parsed.data||[]).map(r=>r);
  console.log("CSV headers:", Object.keys(rows[0]||{}));
  return rows;
}

function normalize(row){
  return {
    codigo: pick(row,'codigo'),
    direccion: pick(row,'direccion'),
    tipo: String(pick(row,'tipo')||"").toLowerCase(),
    valor: numFrom(pick(row,'valor')),
    habitaciones: pick(row,'habitaciones'),
    banos: pick(row,'banos'),
    parqueadero: pick(row,'parqueadero'),
    youtube: pick(row,'youtube'),
    ficha: pick(row,'ficha'),
    estado: String(pick(row,'estado')||"disponible").toLowerCase()
  };
}

function applyFilters(data){
  const t = $("#tipo").value;
  const h = $("#habitaciones").value;
  const pmax = parseInt($("#presupuesto").value||"0",10);
  const q = ($("#buscar").value||"").toLowerCase();
  return data.filter(r=>{
    if (r.estado && r.estado.startsWith("no")) return false;
    if (t && r.tipo !== t) return false;
    if (h){
      const n = parseInt(r.habitaciones||"0",10);
      const bucket = isNaN(n) ? "" : (n>=4?"4":String(n));
      if (bucket !== h) return false;
    }
    if (pmax && Number(r.valor||0) > pmax) return false;
    if (q && !(`${r.codigo} ${r.direccion}`.toLowerCase().includes(q))) return false;
    return true;
  });
}

function render(list){
  const results=$("#results"); results.innerHTML="";
  if(!list.length){ results.innerHTML='<div class="loading">No hay inmuebles que coincidan con los filtros.</div>'; return; }
  const tpl=$("#card-tpl");
  list.forEach(item=>{
    const c = tpl.content.cloneNode(true);
    c.querySelector(".title").textContent = item.direccion || `Código ${item.codigo||'—'}`;
    c.querySelector(".canon").textContent = fmtMoney(item.valor);
    c.querySelector(".hab").textContent = item.habitaciones||"—";
    c.querySelector(".ban").textContent = item.banos||"—";
    c.querySelector(".paq").textContent = item.parqueadero||"—";
    c.querySelector(".codigo").textContent = item.codigo||"—";
    c.querySelector(".pill-tipo").textContent = item.tipo||"—";
    const pe = c.querySelector(".pill-estado");
    pe.textContent = item.estado==='disponible'?'Disponible':'No disponible';
    pe.classList.add(item.estado==='disponible'?'ok':'no');
    if(item.youtube){ c.querySelector(".yt").src = iframeYT(item.youtube); } else { c.querySelector(".yt").style.display='none'; }
    if(item.ficha){ c.querySelector("[data-ficha]").href = item.ficha; } else { c.querySelector("[data-ficha]").style.display='none'; }
    results.appendChild(c);
  });
}

async function init(){
  document.getElementById("year").textContent = new Date().getFullYear();
  const raw = await fetchRows();
  const data = raw.map(normalize);
  window._RAW = raw; window._DATA = data;
  render(data);
  document.getElementById("aplicar").addEventListener("click", ()=>render(applyFilters(data)));
  document.getElementById("limpiar").addEventListener("click", ()=>{
    document.getElementById("tipo").value="";
    document.getElementById("habitaciones").value="";
    document.getElementById("presupuesto").value="";
    document.getElementById("buscar").value="";
    render(data);
  });
}

document.addEventListener("DOMContentLoaded", init);
