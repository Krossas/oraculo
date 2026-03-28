# Oráculo — Motor de Rol en Solitario

Herramienta web ligera de apoyo para jugar a rol en solitario.  
Sin IA, sin suscripción, sin fricción.

**[→ Jugar online](https://TU-USUARIO.github.io/oraculo/)**

---

## Qué incluye

- **🔮 Oráculo** — Sistema de probabilidad con d100, modificado por el factor de caos. Resultados: Sí / Sí, pero… / No, pero… / No. Eventos aleatorios integrados.
- **🎲 Dados** — Soporte completo: d4, d6, d8, d10, d12, d20, d100 y dados FATE/FUDGE (4dF). Combina dados libremente (`3d6+2`). Detección de críticos y pifias.
- **⚡ Ideas** — Generadores de situaciones, personajes (con nombre), lugares, giros narrativos, pistas, conexiones forzadas, contaminación de género y tono de escena.
- **📝 Notas** — Bloc de notas persistente en localStorage para apuntar NPCs, lugares e hilos abiertos.
- **📜 Registro** — Historial de sesión con todas las tiradas y consultas, persistente entre recargas.
- **🌀 Factor de caos** — Nivel dinámico (1–9) que afecta al oráculo, la frecuencia de eventos y la probabilidad de contaminación de género. Se ajusta con el cierre de escena.

---

## Mecánicas clave

### Factor de Caos
El caos sube cuando pierdes el control de una escena y baja cuando lo mantienes. Afecta a:
- Los umbrales del oráculo (±10 por nivel alejado de 5)
- La frecuencia de eventos aleatorios (más probable con caos alto)
- La probabilidad de contaminación de género en los generadores (12% base → 30% con caos ≥7)

### Oráculo
Usa d100 con estos umbrales base:

| Probabilidad    | Umbral base |
|-----------------|-------------|
| Muy probable    | 85          |
| Probable        | 70          |
| Neutral         | 50          |
| Improbable      | 30          |
| Muy improbable  | 15          |

Los resultados *Sí, pero…* y *No, pero…* aparecen cuando el dado cae dentro de 15 puntos del umbral. Los eventos se disparan cuando los dos dígitos del dado coinciden (11, 22, 33…).

### Contaminación de género
Introduce elementos disonantes (sci-fi, horror, misterio) en la narrativa de fantasía. Puede ocurrir automáticamente al generar situaciones y lugares, o activarse manualmente.

---

## Estructura del proyecto

```
oraculo/
├── index.html          ← Punto de entrada
├── css/
│   └── styles.css      ← Estilos completos
├── js/
│   ├── dice.js         ← Motor de dados
│   ├── oracle.js       ← Lógica del oráculo
│   ├── generators.js   ← Generadores narrativos
│   ├── storage.js      ← Persistencia localStorage
│   └── app.js          ← Controlador principal
└── data/
    └── generators.json ← Todas las tablas de contenido
```

---

## Añadir contenido

Todo el contenido narrativo está en `data/generators.json`. El formato es simple y extensible:

```json
{
  "situaciones": ["Texto de la situación…", "Otra situación…"],
  "npcs": [
    { "rasgo": "descripción del rasgo", "motiv": "motivación del personaje" }
  ],
  "lugares": ["Descripción del lugar…"],
  "giros": ["El giro narrativo…"],
  "pistas": ["La pista…"],
  "conexiones": ["La conexión…"],
  "eventos": ["El evento del oráculo…"],
  "prompts": {
    "si":     ["Pregunta para resultado SÍ…"],
    "sipero": ["Pregunta para SÍ pero…"],
    "nopero": ["Pregunta para NO pero…"],
    "no":     ["Pregunta para resultado NO…"]
  },
  "contaminacion": {
    "scifi":   ["Elemento sci-fi…"],
    "horror":  ["Elemento de horror…"],
    "misterio":["Elemento de misterio…"]
  },
  "atmosfera": {
    "tension": ["Descriptor de tensión…"],
    "alivio":  ["Descriptor de alivio…"],
    "misterio":["Descriptor de misterio…"]
  }
}
```

---

## Inspiración

Inspirado en [Mythic Game Master Emulator](https://www.wordmillgames.com/mythic.html) de Tana Pigeon.

---

## Licencia

MIT — Úsalo, modifícalo, compártelo.
