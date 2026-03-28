/* ════════════════════════════════════════
   storage.js — Persistencia en localStorage
════════════════════════════════════════ */

const KEYS = {
  LOG:   'oraculo-log',
  CAOS:  'oraculo-caos',
  NOTAS: 'oraculo-notas'
};

const MAX_LOG_ENTRIES = 200;

/* ─── LOG ─── */

function logCargar() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.LOG) || '[]');
  } catch {
    return [];
  }
}

/**
 * Añade una entrada al log y persiste.
 * @param {Array}  log  - Array actual del log (se modifica in-place)
 * @param {string} type - Tipo de entrada (Dados, Oráculo, etc.)
 * @param {string} text - Texto descriptivo
 * @param {string} icon - Emoji icono
 */
function logAnadir(log, type, text, icon = '•') {
  const t = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  log.push({ type, text, icon, t });
  // Limitar tamaño
  if (log.length > MAX_LOG_ENTRIES) log.splice(0, log.length - MAX_LOG_ENTRIES);
  localStorage.setItem(KEYS.LOG, JSON.stringify(log));
}

function logLimpiar(log) {
  log.splice(0, log.length);
  localStorage.removeItem(KEYS.LOG);
}

/* ─── CAOS ─── */

function caosCargar() {
  const v = parseInt(localStorage.getItem(KEYS.CAOS) || '5', 10);
  return isNaN(v) ? 5 : Math.min(9, Math.max(1, v));
}

function caosGuardar(valor) {
  localStorage.setItem(KEYS.CAOS, String(valor));
}

/* ─── NOTAS ─── */

function notasCargar() {
  return localStorage.getItem(KEYS.NOTAS) || '';
}

function notasGuardar(texto) {
  localStorage.setItem(KEYS.NOTAS, texto);
}
