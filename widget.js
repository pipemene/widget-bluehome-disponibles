// usa PapaParse y el nuevo CSV
const CSV_URL = window.SHEET_CSV_URL;
const $ = (s, r=document)=>r.querySelector(s);
const fmtMoney = (n)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
const numFrom = (s)=>s?Number(String(s).replace(/[^0-9]/g,''))||0:0;
const iframeYT = (url)=>{if(!url)return '';const id=String(url).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);return id?`https://www.youtube.com/embed/${id[1]}`:url;};

async function fetchCSV(){
  const res=await fetch(CSV_URL);const text=await res.text();
  const parsed=Papa.parse(text,{header:true,skipEmptyLines:true});
  return parsed.data.map(r=>{const o={};for(const k in r)o[k.trim().toLowerCase()]=r[k];return o;});
}

function normalize(row){return{
  codigo:row["codigo"]||"",direccion:row["direccion"]||"",
  tipo:(row["tipo"]||"").toLowerCase(),valor:numFrom(row["valor canon"]||row["canon"]||row["valor"]),
  habitaciones:row["numero habitaciones"]||"",banos:row["numero banos"]||row["baños"]||"",
  parqueadero:row["parqueadero"]||"",youtube:row["enlace youtube"]||"",ficha:row["enlace ficha tecnica"]||"",
  estado:(row["estado"]||"disponible").toLowerCase()
};}

function render(list){const results=$("#results");results.innerHTML="";
if(!list.length){results.innerHTML="<p>No hay inmuebles.</p>";return;}
const tpl=$("#card-tpl");
list.forEach(item=>{const c=tpl.content.cloneNode(true);
c.querySelector(".title").textContent=item.direccion||`Código ${item.codigo}`;
c.querySelector(".canon").textContent=fmtMoney(item.valor);
c.querySelector(".hab").textContent=item.habitaciones||"—";
c.querySelector(".ban").textContent=item.banos||"—";
c.querySelector(".paq").textContent=item.parqueadero||"—";
c.querySelector(".codigo").textContent=item.codigo;
c.querySelector(".pill-tipo").textContent=item.tipo;
c.querySelector(".pill-estado").textContent=item.estado==="disponible"?"Disponible":"No disponible";
if(item.youtube){c.querySelector(".yt").src=iframeYT(item.youtube);}else{c.querySelector(".yt").style.display="none";}
if(item.ficha){c.querySelector("[data-ficha]").href=item.ficha;}else{c.querySelector("[data-ficha]").style.display="none";}
results.appendChild(c);});}

async function init(){const data=(await fetchCSV()).map(normalize);window._DATA=data;render(data);
$("#aplicar").addEventListener("click",()=>render(data));$("#limpiar").addEventListener("click",()=>render(data));
$("#year").textContent=new Date().getFullYear();}
document.addEventListener("DOMContentLoaded",init);
