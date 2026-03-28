/* ════════════════════════════════════════
   oracle.js — Oráculo y mecánicas de caos
════════════════════════════════════════ */

/**
 * Umbrales base para cada nivel de probabilidad (d100)
 * El caos modifica estos valores: ±10 por nivel alejado de 5
 */
const UMBRAL_BASE = {
  'muy-probable':    85,
  'probable':        70,
  'neutral':         50,
  'improbable':      30,
  'muy-improbable':  15
};

const PROB_NOMBRES = {
  'muy-probable':   'Muy probable',
  'probable':       'Probable',
  'neutral':        'Neutral',
  'improbable':     'Improbable',
  'muy-improbable': 'Muy improbable'
};

/**
 * Consulta al oráculo.
 * @param {string} prob  - Clave de probabilidad
 * @param {number} chaos - Factor de caos actual (1–9)
 * @param {Array}  eventos - Array de eventos posibles
 * @param {object} prompts  - Objeto con arrays de prompts por tipo
 * @returns {object} Resultado completo de la consulta
 */
function consultarOraculo(prob, chaos, eventos, prompts) {
  // Modificador de caos: +10 por nivel sobre 5, -10 por nivel bajo 5
  const modCaos  = (chaos - 5) * 10;
  const umbral   = Math.min(95, Math.max(5, UMBRAL_BASE[prob] + modCaos));
  const roll     = ri(1, 100);

  // Evento aleatorio: los dos dígitos iguales (11,22…99) → ~9% base
  // A caos 8–9 también se activan con 10, 20, etc.
  const tens  = Math.floor(roll / 10);
  const units = roll % 10;
  const isEvento = (tens === units && roll !== 100) || (chaos >= 8 && roll <= 20);

  // Determinar resultado
  const success   = roll <= umbral;
  const margen    = Math.abs(roll - umbral);
  const ambiguo   = margen <= 15; // zona de ambigüedad

  let tipo;
  if (success  &&  ambiguo) tipo = 'sipero';
  else if (success)         tipo = 'si';
  else if (!success && ambiguo) tipo = 'nopero';
  else                      tipo = 'no';

  // Evento y prompt aleatorios
  const evento  = isEvento ? rand(eventos) : null;
  const promArr = prompts[tipo] || [];
  const prompt  = rand(promArr);

  return { tipo, roll, umbral, chaos, prob, evento, prompt, isEvento };
}

/**
 * Construye el HTML del resultado del oráculo
 */
function buildOracleHTML(res) {
  const labels = {
    si:     `<div class="oracle-result-label oracle-yes">SÍ</div>`,
    sipero: `<div class="oracle-result-label oracle-yesb">SÍ, pero…</div>`,
    nopero: `<div class="oracle-result-label oracle-nob">NO, pero…</div>`,
    no:     `<div class="oracle-result-label oracle-no">NO</div>`
  };

  const eventoHTML = res.isEvento
    ? `<div class="event-banner">⚡ EVENTO — ${res.evento}</div>`
    : '';

  return `
    ${labels[res.tipo]}
    <div class="result-detail" style="margin-top:0.4rem;">
      d100: ${res.roll} · umbral: ${res.umbral} · caos: ${res.chaos}
    </div>
    ${eventoHTML}
  `;
}

/**
 * Texto para el log
 */
function oracleLogText(res) {
  const mapa = { si: 'SÍ', sipero: 'SÍ pero...', nopero: 'NO pero...', no: 'NO' };
  let txt = `${PROB_NOMBRES[res.prob]} → ${mapa[res.tipo]} (d100:${res.roll} umbral:${res.umbral})`;
  if (res.isEvento) txt += ` | ⚡ Evento: ${res.evento}`;
  return txt;
}
