/* ════════════════════════════════════════
   generators.js — Generadores narrativos
════════════════════════════════════════ */

/** Datos cargados desde generators.json */
let GEN_DATA = null;

/**
 * Carga los datos del JSON de generadores.
 * Devuelve una promesa; esperar antes de llamar a cualquier generador.
 */
async function cargarDatos() {
  if (GEN_DATA) return GEN_DATA;
  const resp = await fetch('./data/generators.json');
  GEN_DATA   = await resp.json();
  return GEN_DATA;
}

/* ─── Utilidades ─── */

/** Elemento aleatorio de un array */
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Decide si se produce contaminación de género.
 * Probabilidad base 12%; sube a 30% con caos >= 7.
 * @param {number} chaos
 */
function hayContaminacion(chaos) {
  const p = chaos >= 7 ? 0.30 : 0.12;
  return Math.random() < p;
}

/**
 * Genera una contaminación aleatoria de entre todos los géneros.
 * @param {string|null} tipo - 'scifi'|'horror'|'misterio' o null para aleatorio
 */
function contaminacion(tipo) {
  const tipos = ['scifi', 'horror', 'misterio'];
  const t     = tipo || rand(tipos);
  const pool  = GEN_DATA.contaminacion[t];
  return { tipo: t, texto: rand(pool) };
}

/* ─── Generadores individuales ─── */

function genSituacion(chaos) {
  const txt  = rand(GEN_DATA.situaciones);
  const c    = hayContaminacion(chaos) ? contaminacion(null) : null;
  const full = c ? `${txt}. Además, ${c.texto}` : txt;
  return { etiqueta: 'Situación', texto: full, contaminada: !!c, tipoContam: c?.tipo };
}

function genNPC() {
  const n    = rand(GEN_DATA.npcs);
  const genero = rand(['masculino', 'femenino', 'neutro']);
  const nombrePool = GEN_DATA.nombres[genero + 's'] || GEN_DATA.nombres.neutros;
  const nombre     = rand(nombrePool);
  return {
    etiqueta: 'Personaje',
    texto: `**${nombre}** — ${n.rasgo} — ${n.motiv}`,
    nombre,
    rasgo: n.rasgo,
    motiv: n.motiv
  };
}

function genLugar(chaos) {
  const txt  = rand(GEN_DATA.lugares);
  const c    = hayContaminacion(chaos) ? contaminacion(rand(['scifi', 'horror'])) : null;
  const full = c ? `${txt}. Aquí hay ${c.texto}` : txt;
  return { etiqueta: 'Lugar', texto: full, contaminada: !!c, tipoContam: c?.tipo };
}

function genGiro() {
  return { etiqueta: 'Giro narrativo', texto: rand(GEN_DATA.giros) };
}

function genPista() {
  return { etiqueta: 'Pista', texto: rand(GEN_DATA.pistas) };
}

function genConexion() {
  return { etiqueta: 'Conexión forzada', texto: rand(GEN_DATA.conexiones) };
}

function genAtmosfera(tipo) {
  const pool = GEN_DATA.atmosfera[tipo];
  return { etiqueta: tipo.charAt(0).toUpperCase() + tipo.slice(1), texto: rand(pool) };
}

/**
 * Dispatch general por tipo.
 * @param {string} tipo - 'situacion'|'npc'|'lugar'|'giro'|'pista'|'conexion'
 * @param {number} chaos
 */
function generar(tipo, chaos) {
  switch (tipo) {
    case 'situacion': return genSituacion(chaos);
    case 'npc':       return genNPC();
    case 'lugar':     return genLugar(chaos);
    case 'giro':      return genGiro();
    case 'pista':     return genPista();
    case 'conexion':  return genConexion();
    default:          return { etiqueta: '?', texto: '…' };
  }
}

/**
 * Construye el HTML para el output de un generador.
 */
function buildGenHTML(res) {
  const contamBadge = res.contaminada
    ? `<span class="contam-badge">⚠ Contaminado · ${res.tipoContam}</span>`
    : '';

  // Para NPCs, resaltamos nombre y rasgo
  let textoHTML = res.texto.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Separar rasgo y motivación con guión largo si aplica
  textoHTML = textoHTML.replace(' — ', ' <span style="color:var(--text-dim)">—</span> ');

  return `
    <span class="gen-tag">${res.etiqueta}</span>${contamBadge}
    <br>${textoHTML}
  `;
}
