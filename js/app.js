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

  // Botón tirar
  document.getElementById('rollBtn').addEventListener('click', () => doRoll(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doRoll(input.value); });

  // Botones rápidos de tipo de dado
  document.querySelectorAll('.dice-quick').forEach(b => {
    b.addEventListener('click', () => { input.value = b.dataset.d; doRoll(b.dataset.d); });
  });

  // Accesos rápidos
  document.querySelectorAll('[data-q]').forEach(b => {
    b.addEventListener('click', () => { input.value = b.dataset.q; doRoll(b.dataset.q); });
  });

  function doRoll(notation) {
    const res = parseDice(notation);
    pulse(box, 'anim-shake');
    setTimeout(() => {
      if (!res) {
        box.innerHTML = `<span class="result-placeholder" style="color:var(--red-bright)">
          Formato no reconocido. Usa: 2d6 · 1d20+3 · 4df
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
