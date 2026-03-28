/* ════════════════════════════════════════
   dice.js — Motor de tiradas de dados
════════════════════════════════════════ */

/**
 * Entero aleatorio entre a y b (inclusive)
 */
function ri(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

/**
 * Parsea una notación de dados y devuelve el resultado.
 * Soporta: NdX, NdX+M, NdX-M, 4df / 4dF / fate
 * @param {string} raw - La notación en texto
 * @returns {object|null} Objeto con resultado, o null si el formato no es válido
 */
function parseDice(raw) {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');

  // ── Dados FATE/FUDGE ─────────────────────────────────────
  if (s === '4df' || s === 'fate' || s === '4dfate') {
    const r = [0, 0, 0, 0].map(() => ri(1, 3) - 2); // -1, 0, +1
    return {
      type: 'fate',
      results: r,
      total: r.reduce((a, b) => a + b, 0),
      notation: '4dF'
    };
  }

  // ── Dados estándar: NdX o NdX+M o NdX-M ──────────────────
  const m = s.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!m) return null;

  const count = Math.min(parseInt(m[1], 10), 20); // máx 20 dados
  const sides = parseInt(m[2], 10);
  const mod   = m[3] ? parseInt(m[3], 10) : 0;

  if (sides < 2 || count < 1) return null;

  const r = Array.from({ length: count }, () => ri(1, sides));
  const sum = r.reduce((a, b) => a + b, 0);

  return {
    type: 'std',
    results: r,
    total: sum + mod,
    sum,
    count,
    sides,
    mod,
    notation: raw.trim().toUpperCase(),
    isCrit:   count === 1 && r[0] === sides,
    isFumble: count === 1 && r[0] === 1
  };
}

/**
 * Construye el HTML del resultado de una tirada estándar
 */
function buildDiceHTML(res) {
  if (res.type === 'fate') {
    const diceHTML = res.results.map(v => {
      const cls = v > 0 ? 'plus' : v < 0 ? 'minus' : 'zero';
      const sym = v > 0 ? '+' : v < 0 ? '−' : '□';
      return `<div class="fate-die ${cls}">${sym}</div>`;
    }).join('');

    const sign = res.total >= 0 ? '+' : '';
    return `
      <div class="fate-row">${diceHTML}</div>
      <div class="result-big">${sign}${res.total}</div>
      <div class="result-detail">4dF · suma: ${sign}${res.total}</div>
    `;
  }

  // Detalle de dados individuales si hay más de uno
  let detail = '';
  if (res.count > 1) {
    detail = `[${res.results.join(', ')}]`;
    if (res.mod !== 0) detail += res.mod > 0 ? `+${res.mod}` : `${res.mod}`;
  } else if (res.mod !== 0) {
    detail = res.mod > 0 ? `+${res.mod}` : `${res.mod}`;
  }

  const cls    = res.isCrit ? 'result-big crit' : res.isFumble ? 'result-big fumble' : 'result-big';
  const extra  = res.isCrit ? ' · <span style="color:var(--gold)">¡CRÍTICO!</span>'
               : res.isFumble ? ' · <span style="color:var(--red-bright)">¡PIFIA!</span>'
               : '';

  return `
    <div class="${cls}">${res.total}</div>
    <div class="result-detail">${res.notation}${detail ? ' · ' + detail : ''}${extra}</div>
  `;
}

/**
 * Mensaje de texto simple para el log
 */
function diceLogText(res) {
  if (res.type === 'fate') {
    const sign = res.total >= 0 ? '+' : '';
    return `4dF → ${sign}${res.total} [${res.results.map(v => v > 0 ? '+' : v < 0 ? '−' : '□').join(' ')}]`;
  }
  let detail = res.count > 1 ? ` [${res.results.join(', ')}]` : '';
  if (res.mod > 0) detail += `+${res.mod}`;
  if (res.mod < 0) detail += `${res.mod}`;
  const extra = res.isCrit ? ' ¡CRÍTICO!' : res.isFumble ? ' ¡PIFIA!' : '';
  return `${res.notation} → ${res.total}${detail}${extra}`;
}
