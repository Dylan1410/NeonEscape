# Neon Escape — Paquete de Producción del Trailer (Componente B)

**Materia:** Juegos Interactivos · EPN — Ingeniería de Software GR1
**Equipo:** Dylan Granizo Ayala · Anderson Cango · Dayana Lema
**Duración objetivo:** 90 segundos (rango permitido 1–2 min)
**Juego en vivo:** https://dylan1410.github.io/NeonEscape/

Este documento combina, como exige la guía, **cinemática generada por IA** (intro que
expone historia, ambiente y diseño de personajes) con **gameplay real capturado en Phaser**.

---

## 1. Concepto creativo

- **Logline:** Tres sujetos cibernéticos rompen su confinamiento y corren contra la Purga
  Central para escapar del complejo Aethelgard.
- **Tono:** cyberpunk tenso, neón cian/magenta, sensación de cuenta regresiva.
- **Paleta:** negro/azul profundo (#0c0a1c) con acentos cian (#00F5FF) y magenta (#FF2A6D).
- **Música:** darksynth / synthwave enérgico, ~120–128 BPM, con un golpe grave en el
  título. Puedes reutilizar el `bgm.wav` del juego o una pista libre (ver §5).
- **Tipografía en pantalla:** sans-serif bold, mayúsculas, con glow neón (igual que el logo
  del GDD).

---

## 2. Timeline / Guion (estructura de edición)

| Tiempo | Bloque | Contenido | Audio / Texto en pantalla |
|--------|--------|-----------|---------------------------|
| 0:00–0:06 | **Cine IA** | Vista aérea del complejo Aethelgard de noche, lluvia neón, alarmas rojas encendiéndose. | Zumbido grave + alarma. Texto: *"Complejo Aethelgard"* |
| 0:06–0:14 | **Cine IA** | Interior: se anuncia la **Purga Central**; luces rojas de emergencia recorren pasillos vacíos. | Voz robótica/glitch: *"Protocolo de purga: iniciado"* |
| 0:14–0:22 | **Cine IA** | Tres siluetas cibernéticas (amarilla, cian, magenta) rompen una compuerta y miran a cámara. | Beat sube. Texto: *"Tres sujetos. Una salida."* |
| 0:22–0:30 | **Título** | Cinemática funde a negro → aparece el logo **NEON ESCAPE** con glitch. | Golpe grave (drop). |
| 0:30–0:44 | **Gameplay N1** | Jolt: carrera, **doble salto**, recolección de núcleos, portal abriéndose. | Música a tope. Texto: *"JOLT — Doble salto"* |
| 0:44–0:58 | **Gameplay N2** | Dash: **dash con estela** cruzando tiras de pinchos, pickup de energía. | Corte rápido al beat. Texto: *"DASH — Velocidad"* |
| 0:58–1:12 | **Gameplay N3** | Kael: **disparos** destruyendo drones, explosiones, esquivando torretas. | Texto: *"KAEL — Combate"* |
| 1:12–1:22 | **Clímax** | Montaje veloz: reloj en cuenta regresiva, portal desbloqueándose, escape. | Música clímax + tic-tac. Texto: *"Escapa antes de la purga"* |
| 1:22–1:30 | **Cierre** | Logo + llamada a la acción y URL. | Cola musical. Texto: *"Juégalo ya · dylan1410.github.io/NeonEscape"* |

> **Regla de montaje:** corta los planos de gameplay **al ritmo de la música** (cada 1–2
> compases). Alterna planos amplios (mostrar el nivel) con primeros planos de la acción.

---

## 3. Cinemática por IA — Prompts listos para usar

Herramientas sugeridas: **Runway Gen-3/Gen-4**, **Kling**, **Luma Dream Machine**, **Pika**.
Genera cada plano a **~5 s, 16:9**. Los prompts están en inglés (rinden mejor en estas
herramientas). Ajusta el `seed` para mantener coherencia entre planos.

### Plano A — Establecimiento del complejo (0:00–0:06)
```
Cinematic aerial drone shot flying over a massive dystopian cyberpunk industrial
megacomplex at night, neon signage in cyan and magenta, heavy rain, red emergency
lights starting to blink across the facility, volumetric fog, reflective wet metal,
blade-runner atmosphere, moody teal and pink color grade, 16:9, high detail, slow push-in.
```

### Plano B — Alarma de la Purga (0:06–0:14)
```
Interior of an abandoned high-tech factory corridor, red emergency strobe lights
sweeping the walls, holographic warning glyphs flickering, steam vents, empty automated
assembly lines powering down, ominous, cinematic, cyan and red neon reflections on the
floor, slow tracking shot forward, cyberpunk, 16:9.
```

### Plano C — Los tres protagonistas (0:14–0:22)
```
Three sleek cybernetic humanoid silhouettes standing in a neon-lit doorway they just
broke open, dramatic backlight, one glowing yellow, one glowing cyan, one glowing
magenta, sparks flying, determined heroic pose looking toward camera, cinematic rim
light, cyberpunk concept art style, shallow depth of field, 16:9.
```

### Prompts de diseño de personajes (para concept art / planos de detalle)
```
JOLT — agile lightweight cyber-runner, yellow energy accents, sleek athletic frame,
leg servo augmentations for double jump, neon cyberpunk character design, full body,
dark studio background, concept art.

DASH — speed-specialist cyborg, cyan light trails, aerodynamic armor, motion-blur
energy dash aura, neon cyberpunk character design, full body, dark background, concept art.

KAEL — combat cyborg soldier, magenta accents, shoulder-mounted energy weapon,
tactical armored frame, neon cyberpunk character design, full body, dark background,
concept art.
```

> **Consejo:** genera primero una **imagen** de cada personaje (Midjourney/DALL·E/Firefly)
> y luego usa *image-to-video* (Runway/Kling) para animarla; da más control y coherencia
> que text-to-video directo.

---

## 4. Shot-list del GAMEPLAY real (a capturar en Phaser)

Graba el juego desde `https://dylan1410.github.io/NeonEscape/` a pantalla completa. Captura
varias tomas limpias de cada una:

**Nivel 1 — Jolt (Sector de Ensamblaje)**
- [ ] Carrera lateral fluida por las plataformas.
- [ ] **Doble salto** para alcanzar un núcleo suspendido (idealmente en cámara lenta al editar).
- [ ] Recolección de un núcleo (con el destello) y el HUD subiendo 1/3 → 3/3.
- [ ] El **portal desbloqueándose** y la entrada.

**Nivel 2 — Dash (Corredor de Contramedidas)**
- [ ] Recoger un **pickup de energía ⚡** (mensaje "¡DASH RECARGADO!").
- [ ] **Dash con estela cian** cruzando una tira de pinchos (el momento estrella del nivel).
- [ ] El indicador de dash pasando de LISTO a RECARGANDO.

**Nivel 3 — Kael (Núcleo de Laboratorios)**
- [ ] **Disparar** y destruir un dron (explosión).
- [ ] Esquivar el proyectil de una torreta / recibir daño (flash rojo).
- [ ] "ACCESO AL PORTAL HABILITADO" tras el 5º dron y entrada al portal.

**Menú / UI**
- [ ] Pantalla de menú con el efecto **glitch** del título (buen plano para el cierre).

---

## 5. Producción práctica

- **Captura de pantalla:** OBS Studio (gratis) o la grabación de pantalla del navegador.
  Graba a **1920×1080, 60 fps**. El canvas del juego es 800×600; céntralo y añade un fondo
  o haz zoom para llenar el encuadre.
- **Edición:** CapCut, DaVinci Resolve (gratis) o Premiere. Importa la cinemática de IA + los
  clips de gameplay y móntalos según el timeline de §2.
- **Música libre:** el propio `bgm.wav`/`nivel1_loop.wav` del repo, o pistas de
  Pixabay Music / YouTube Audio Library / Uppbeat (revisa la licencia y acredita si aplica).
- **Exportación:** MP4 (H.264), 1080p, y subir a **YouTube / Vimeo / Drive** con acceso
  abierto (ese enlace es el entregable del Componente B).
- **Textos en pantalla:** usa el mismo estilo neón del logo (cian con glow, magenta de
  acento) para coherencia de marca.

---

## 6. Checklist de entrega del trailer

- [ ] Cinemática de IA generada (planos A, B, C) y descargada.
- [ ] Clips de gameplay capturados (shot-list §4).
- [ ] Música seleccionada (licencia OK).
- [ ] Montaje según timeline (§2), cortes al ritmo.
- [ ] Título NEON ESCAPE y tarjeta de cierre con la URL.
- [ ] Exportado a 1080p MP4 y subido con **acceso público**.
- [ ] Enlace del video registrado para la entrega.
