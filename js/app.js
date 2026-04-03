/* ════════════════════════════════════════
   app.js — Controlador principal
   Coordina todos los módulos.
════════════════════════════════════════ */

/* ─── ESTADO GLOBAL ─── */
let chaos      = caosCargar();
let sessionLog = logCargar();

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await cargarDatos();
  } catch (e) {
    console.error('Error cargando generators.json:', e);
    mostrarErrorDatos();
    return;
  }

  initChaos();
  initTabs();
  initDice();
  initOracle();
  initGenerators();
  initNotas();
  initLog();
});

function mostrarErrorDatos() {
  document.body.innerHTML += `
    <div style="padding:2rem;color:#c84040;font-family:monospace;text-align:center;">
      Error al cargar los datos. Asegúrate de servir el proyecto desde un servidor web,
      no directamente desde el sistema de archivos (file://).
    </div>`;
}

/* ─── UTILIDADES UI ─── */

function pulse(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function log(type, text, icon = '•') {
  logAnadir(sessionLog, type, text, icon);
  renderLog();
}

/* ════════════════════════════════════════
   CAOS
════════════════════════════════════════ */
function initChaos() {
  renderChaos();
  document.getElementById('chaosUp').addEventListener('click', () => {
    if (chaos < 9) {
      chaos++;
      caosGuardar(chaos);
      renderChaos();
      log('Caos', `Factor de caos → ${chaos}`, '🌀');
    }
  });
  document.getElementById('chaosDown').addEventListener('click', () => {
    if (chaos > 1) {
      chaos--;
      caosGuardar(chaos);
      renderChaos();
      log('Caos', `Factor de caos → ${chaos}`, '🌀');
    }
  });

  document.getElementById('chaosHelpBtn').addEventListener('click', () => {
    document.getElementById('chaosModal').classList.remove('hidden');
  });

  document.getElementById('chaosModalClose').addEventListener('click', () => {
    document.getElementById('chaosModal').classList.add('hidden');
  });

  // Cerrar modal al hacer click fuera
  document.getElementById('chaosModal').addEventListener('click', (e) => {
    if (e.target.id === 'chaosModal') {
      document.getElementById('chaosModal').classList.add('hidden');
    }
  });
}

function renderChaos() {
  const pips = document.getElementById('pips');
  pips.innerHTML = Array.from({ length: 9 }, (_, i) => {
    const n   = i + 1;
    const on  = n <= chaos;
    const cls = on ? (n >= 7 ? 'pip danger' : 'pip on') : 'pip';
    return `<div class="${cls}"></div>`;
  }).join('');
  document.getElementById('chaosVal').textContent = chaos;
}

/* ════════════════════════════════════════
   TABS
════════════════════════════════════════ */
function initTabs() {
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x   => x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('tab-' + t.dataset.tab).classList.add('active');
    });
  });
}

/* ════════════════════════════════════════
   DADOS
════════════════════════════════════════ */
function initDice() {
  const input = document.getElementById('diceInput');
  const box   = document.getElementById('diceBox');
  const countVal = document.getElementById('countVal');
  const modVal   = document.getElementById('modVal');

  let diceCount = 1;
  let diceMod   = 0;
  let baseDice  = 'd6';          // Default dice type for controles
  let manualInput = false;

  // Actualizar display
  function applyDiceInput() {
    if (manualInput || !baseDice) return;

    if (baseDice === 'df' || baseDice === 'fate') {
      input.value = `${diceCount}df`;
      return;
    }

    const m = baseDice.match(/^d(\d+)$/);
    if (m) {
      let value = `${diceCount}d${m[1]}`;
      if (diceMod !== 0) value += diceMod > 0 ? `+${diceMod}` : `${diceMod}`;
      input.value = value;
    }
  }

  function updateControls() {
    countVal.textContent = diceCount;
    modVal.textContent = diceMod;
    applyDiceInput();
  }
  updateControls();

  // Botones de control
  document.getElementById('countUp').addEventListener('click', () => {
    if (diceCount < 20) diceCount++;
    updateControls();
  });
  document.getElementById('countDown').addEventListener('click', () => {
    if (diceCount > 1) diceCount--;
    updateControls();
  });
  document.getElementById('modUp').addEventListener('click', () => {
    if (diceMod < 99) diceMod++;
    updateControls();
  });
  document.getElementById('modDown').addEventListener('click', () => {
    if (diceMod > -99) diceMod--;
    updateControls();
  });

  // Botón tirar
  document.getElementById('rollBtn').addEventListener('click', () => doRoll(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doRoll(input.value); });
  input.addEventListener('input', () => { manualInput = true; });

  // Botones rápidos de tipo de dado (usa el contador / modificador cuando aplica)
  document.querySelectorAll('.dice-quick').forEach(b => {
    b.addEventListener('click', () => {
      let diceType = b.dataset.d.toLowerCase();
      const qty = diceCount;
      const modifier = diceMod;
      manualInput = false;

      // Marcar botón seleccionado
      document.querySelectorAll('.dice-quick').forEach(x => x.classList.remove('active'));
      b.classList.add('active');

      if (/df$/.test(diceType) || diceType === 'fate') {
        baseDice = 'df';
        diceType = `${qty}df`;
      } else {
        const m = diceType.match(/^(\d+)d(\d+)$/);
        if (m) {
          baseDice = `d${m[2]}`;
          diceType = `${qty}d${m[2]}`;
        } else {
          baseDice = diceType;
          diceType = `${qty}${diceType}`;
        }
      }

      const isFate = /df$/.test(diceType) || /fate$/.test(diceType);
      if (modifier !== 0 && !isFate && !/[+-]\d+$/.test(diceType)) {
        diceType += modifier > 0 ? `+${modifier}` : `${modifier}`;
      }

      input.value = diceType;
      // No ejecutar tirada aquí: solo actualización de configuración.
    });
  });

  function doRoll(notation) {
    let expression = notation.trim().toLowerCase();
    const modifier = diceMod;
    const isFateRoll = /df$/.test(expression) || /fate$/.test(expression);

    if (!/[+-]\d+$/.test(expression) && modifier !== 0 && !isFateRoll) {
      expression += modifier > 0 ? `+${modifier}` : `${modifier}`;
    }

    if (isFateRoll) {
      // Si es dado fudge, no aplicamos modificadores.
      expression = expression.replace(/[+-]\d+$/, '');
    }

    const res = parseDice(expression);
    pulse(box, 'anim-shake');
    setTimeout(() => {
      if (!res) {
        box.innerHTML = `<span class="result-placeholder" style="color:var(--red-bright)">
          Formato no reconocido. Usa: 2d6 · 1d20+3 · 1df
        </span>`;
        return;
      }
      box.innerHTML = buildDiceHTML(res);
      pulse(box, 'anim-in');
      log('Dados', diceLogText(res), '🎲');
    }, 180);
  }
}

/* ════════════════════════════════════════
   ORÁCULO
════════════════════════════════════════ */
function initOracle() {
  const box      = document.getElementById('oracleBox');
  const promptEl = document.getElementById('promptBlock');

  document.getElementById('askBtn').addEventListener('click', () => {
    const prob = document.querySelector('input[name="prob"]:checked').value;
    const res  = consultarOraculo(prob, chaos, GEN_DATA.eventos, GEN_DATA.prompts);

    box.innerHTML = buildOracleHTML(res);
    pulse(box, 'anim-in');

    promptEl.textContent = res.prompt;
    promptEl.style.display = 'block';

    log('Oráculo', oracleLogText(res), '🔮');
  });

  // Cierre de escena
  document.getElementById('sceneWon').addEventListener('click', () => {
    if (chaos > 1) { chaos--; caosGuardar(chaos); renderChaos(); }
    const n = document.getElementById('sceneNote');
    n.style.display = 'block';
    n.textContent   = `Escena superada — caos reducido a ${chaos}. La situación está bajo control.`;
    log('Escena', `Controlada — caos reducido a ${chaos}`, '✓');
  });

  document.getElementById('sceneLost').addEventListener('click', () => {
    if (chaos < 9) { chaos++; caosGuardar(chaos); renderChaos(); }
    const n = document.getElementById('sceneNote');
    n.style.display = 'block';
    n.textContent   = `Escena perdida — caos aumentado a ${chaos}. Las cosas se complican.`;
    log('Escena', `Perdida — caos aumentado a ${chaos}`, '✗');
  });
}

/* ════════════════════════════════════════
   GENERADORES
════════════════════════════════════════ */
function initGenerators() {
  const out = document.getElementById('genOut');

  // Botones de generadores principales
  document.querySelectorAll('[data-g]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = generar(btn.dataset.g, chaos);
      out.innerHTML = buildGenHTML(res);
      pulse(out, 'anim-in');
      log(res.etiqueta, res.texto.replace(/\*\*/g, ''), '⚡');
    });
  });

  // Contaminación manual
  document.querySelectorAll('[data-c]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = contaminacion(btn.dataset.c);
      const o   = document.getElementById('contamOut');
      o.style.display = 'block';
      o.innerHTML = `<span class="contam-badge">⚠ Elemento extraño · ${res.tipo}</span><br><br><em>${res.texto}</em>`;
      pulse(o, 'anim-in');
      log('Contaminación', res.texto, '⚠️');
    });
  });

  // Atmósfera
  document.querySelectorAll('[data-atm]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = genAtmosfera(btn.dataset.atm);
      const o   = document.getElementById('atmosOut');
      o.style.display = 'block';
      o.innerHTML = `<span class="gen-tag">${res.etiqueta}</span><br>${res.texto}`;
      pulse(o, 'anim-in');
      log('Atmósfera', res.texto, '🌫️');
    });
  });
}

/* ════════════════════════════════════════
   NOTAS
════════════════════════════════════════ */
function initNotas() {
  const ta    = document.getElementById('notasArea');
  const count = document.getElementById('notasCount');

  ta.value = notasCargar();
  updateCount();

  ta.addEventListener('input', updateCount);

  document.getElementById('btnSaveNota').addEventListener('click', () => {
    notasGuardar(ta.value);
    const btn = document.getElementById('btnSaveNota');
    btn.textContent = '✓ Guardado';
    setTimeout(() => { btn.textContent = 'Guardar notas'; }, 1500);
  });

  document.getElementById('btnClearNota').addEventListener('click', () => {
    if (confirm('¿Borrar todas las notas? Esta acción no se puede deshacer.')) {
      ta.value = '';
      notasGuardar('');
      updateCount();
    }
  });

  document.getElementById('btnExportNota').addEventListener('click', () => {
    const blob = new Blob([ta.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notas-oraculo.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  document.getElementById('fileImportNota').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      ta.value = String(reader.result || '');
      notasGuardar(ta.value);
      updateCount();
      alert('Notas importadas correctamente.');
    };
    reader.onerror = () => {
      alert('No se ha podido leer el archivo.');
    };
    reader.readAsText(file);
  });

  function updateCount() {
    const c = ta.value.length;
    count.textContent = `${c} car.`;
  }
}

/* ════════════════════════════════════════
   LOG
════════════════════════════════════════ */
function initLog() {
  renderLog();
  document.getElementById('clearLog').addEventListener('click', () => {
    if (confirm('¿Limpiar el registro de esta sesión?')) {
      logLimpiar(sessionLog);
      renderLog();
    }
  });
}

function renderLog() {
  const wrap = document.getElementById('logWrap');
  if (!sessionLog.length) {
    wrap.innerHTML = '<div class="empty-msg">El registro está vacío.<br>Las acciones aparecerán aquí.</div>';
    return;
  }
  wrap.innerHTML = [...sessionLog].reverse().map(e => `
    <div class="log-entry">
      <div class="log-time">${e.t}</div>
      <div class="log-icon">${e.icon || '•'}</div>
      <div class="log-body">
        <div class="log-type">${e.type}</div>
        <div class="log-text">${e.text}</div>
      </div>
    </div>
  `).join('');
}
