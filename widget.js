// v7: campo BARRIO (texto debajo del título) + búsqueda incluye barrio
const CSV_URL = window.SHEET_CSV_URL;
const WHATSAPP_PHONE = "573178574053";
const $ = (s, r=document)=>r.querySelector(s);
const fmtMoney = (n)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
const numFrom = (s)=>s?Number(String(s).replace(/[^0-9]/g,''))||0:0;
const normKey = (k)=>String(k||"").normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const youtubeId=(url)=>{
  if(!url) return "";
  const str=String(url).trim();
  try{
    const u=new URL(str.includes("http")?str:`https://${str}`);
    if(u.hostname.includes("youtu")){
      if(u.searchParams.get("v")) return u.searchParams.get("v");
      const parts=u.pathname.split("/").filter(Boolean);
      if(parts[0]==='shorts' && parts[1]) return parts[1];
      if(parts[0]==='embed' && parts[1]) return parts[1];
      if(u.hostname.includes("youtu.be") && parts[0]) return parts[0];
    }
  }catch(e){
    const match=str.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{6,11})/);
    if(match) return match[1];
  }
  const fallback=str.match(/[\w-]{11}/);
  return fallback?fallback[0]:"";
};

const youtubeWatchUrl=(url)=>{
  const id=youtubeId(url);
  return id?`https://www.youtube.com/watch?v=${id}`:String(url||"");
};

const youtubeThumb=(url)=>{
  const id=youtubeId(url);
  return id?`https://img.youtube.com/vi/${id}/hqdefault.jpg`:"";
};

const KEYMAP = {
  codigo: ['codigo','codigoinmueble','id','code','cod'],
  direccion: ['direccion','ubicacion','direccioninmueble','direccion inmueble'],
  barrio: ['barrio','sector','zona','colonia'],
  tipo: ['tipo','tipoinmueble'],
  valor: ['valorcanon','canon','valor','canonmensual','valorarriendo','precio'],
  habitaciones: ['numerohabitaciones','habitaciones','habitacion'],
  banos: ['numerobanos','banos','baños'],
  parqueadero: ['parqueadero','garaje','parqueos'],
  youtube: ['enlaceyoutube','linkyoutube','youtube'],
  ficha: ['enlacefichatecnica','fichatecnica','ficha'],
  estado: ['estado','disponibilidad'],
  maps: ['gps','mapa','googlemaps','maps','linkmaps','ubicacionmaps']
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
  return (parsed.data||[]).map(r=>r);
}

function normalize(row){
  const codeRaw = pick(row,'codigo');
  return {
    codigo: codeRaw != null ? String(codeRaw).trim() : "",
    direccion: pick(row,'direccion'),
    barrio: pick(row,'barrio'),
    tipo: String(pick(row,'tipo')||"").toLowerCase(),
    valor: numFrom(pick(row,'valor')),
    habitaciones: pick(row,'habitaciones'),
    banos: pick(row,'banos'),
    parqueadero: pick(row,'parqueadero'),
    youtube: pick(row,'youtube'),
    ficha: pick(row,'ficha'),
    estado: String(pick(row,'estado')||"disponible").toLowerCase(),
    maps: (pick(row,'maps')||"").toString().trim()
  };
}

function attachCopy(btn, text){
  btn.addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(text||""); btn.textContent="¡Copiado!"; setTimeout(()=>btn.textContent="Copiar",1200); }
    catch{ btn.textContent="Error"; setTimeout(()=>btn.textContent="Copiar",1200); }
  });
}

function render(list){
  const results=$("#results"); results.innerHTML="";
  if(!list.length){ results.innerHTML='<div class="loading">No hay inmuebles que coincidan con los filtros.</div>'; return; }
  const tpl=$("#card-tpl");
  list.forEach(item=>{
    const c = tpl.content.cloneNode(true);
    const codigo = item.codigo || "—";
    c.querySelector(".pill-codigo").textContent = `Código ${codigo}`;
    c.querySelector(".pill-tipo").textContent = item.tipo||"—";
    const pe = c.querySelector(".pill-estado");
    pe.textContent = item.estado==='disponible'?'Disponible':'No disponible';
    pe.classList.add(item.estado==='disponible'?'ok':'no');

    const title = item.direccion ? `${item.direccion} · Código ${codigo}` : `Código ${codigo}`;
    c.querySelector(".title").textContent = title;

    // BARRIO debajo del título (si existe)
    const barrioEl = c.querySelector(".barrio");
    if (item.barrio){
      barrioEl.innerHTML = `<span class="label">Barrio:</span> ${item.barrio}`;
    } else {
      barrioEl.style.display = "none";
    }

    c.querySelector(".canon").textContent = item.valor>0 ? fmtMoney(item.valor) : "Por definir";
    c.querySelector(".hab").textContent = item.habitaciones||"—";
    c.querySelector(".ban").textContent = item.banos||"—";
    c.querySelector(".paq").textContent = item.parqueadero||"—";
    c.querySelector(".codigo").textContent = codigo;

    const youtubeBtn=c.querySelector("[data-youtube]");
    const preview=c.querySelector("[data-youtube-preview]");
    const mapsBtn=c.querySelector("[data-maps]");
    const whatsappBtn=c.querySelector("[data-whatsapp]");
    if(item.youtube){
      const watchUrl=youtubeWatchUrl(item.youtube);
      youtubeBtn.style.display='';
      youtubeBtn.href = watchUrl;
      youtubeBtn.textContent = "Ver video en YouTube";
      preview.style.display='flex';
      preview.href = watchUrl;
      const thumb=youtubeThumb(item.youtube);
      if(thumb){
        preview.querySelector(".yt-thumb-img").style.backgroundImage=`url('${thumb}')`;
      }
      preview.setAttribute("aria-label",`Ver video del inmueble ${codigo} en YouTube`);
      youtubeBtn.setAttribute("aria-label",`Abrir en YouTube el video del inmueble ${codigo}`);
    }else{
      youtubeBtn.style.display='none';
      preview.style.display='none';
    }

    const fichaBtn=c.querySelector("[data-ficha]");
    if(item.ficha){ fichaBtn.href = item.ficha; fichaBtn.textContent="Ficha técnica"; }
    else { fichaBtn.style.display='none'; }

    if(mapsBtn){
      if(item.maps){
        mapsBtn.style.display='';
        mapsBtn.href = item.maps;
        mapsBtn.textContent = "Ver ubicación";
        mapsBtn.setAttribute("aria-label",`Abrir la ubicación del inmueble ${codigo} en Google Maps`);
      } else {
        mapsBtn.style.display='none';
      }
    }

    if(whatsappBtn){
      const hasCode = Boolean(item.codigo);
      const message = hasCode ?
        `Estoy interesado en el inmueble con código ${item.codigo}.` :
        "Estoy interesado en el inmueble.";
      whatsappBtn.style.display='';
      whatsappBtn.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
      whatsappBtn.setAttribute("aria-label",`Enviar mensaje por WhatsApp sobre el inmueble ${codigo}`);
    }

    attachCopy(c.querySelector(".copy"), codigo);
    results.appendChild(c);
  });
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
    if (q && !(`${r.codigo} ${r.direccion} ${r.barrio}`.toLowerCase().includes(q))) return false;
    return true;
  });
}

async function init(){
  document.getElementById("year").textContent = new Date().getFullYear();
  const results = document.getElementById("results");
  const loading = document.getElementById("loading");
  try{
    loading.textContent = "Sincronizando datos...";
    const raw = await fetchRows();
    const data = raw.map(normalize);
    window._DATA = data;
    render(data);
    document.getElementById("aplicar").addEventListener("click", ()=>render(applyFilters(data)));
    document.getElementById("limpiar").addEventListener("click", ()=>{
      document.getElementById("tipo").value="";
      document.getElementById("habitaciones").value="";
      document.getElementById("presupuesto").value="";
      document.getElementById("buscar").value="";
      render(data);
    });
  }catch(err){
    console.error("Error cargando datos", err);
    results.innerHTML = '<div class="loading">No pudimos cargar los inmuebles. Intenta actualizar la página.</div>';
  }
}

document.addEventListener("DOMContentLoaded", init);
