# Neon Escape — Proyecto y Examen Final (Diseño)

Fecha: 2026-07-24
Materia: Juegos Interactivos
Repositorio: https://github.com/Dylan1410/NeonEscape

## Contexto

Neon Escape es un plataformero 2D cyberpunk hecho con Phaser 3.60 (cargado por CDN,
sin proceso de build). Ambientación: complejo industrial Aethelgard; tres sujetos
cibernéticos (Jolt, Dash, Kael) escapan antes de la "purga central".

Estado del juego tras sincronizar `origin/main` (commit `9faf307`):

- **Nivel 1 (Jolt)**: jugable. Doble salto, plataforma móvil, 3 núcleos, portal
  bloqueado, música, pausa (Esc), timer de 25s, muerte por abismo/tiempo.
- **Nivel 2 (Dash)**: jugable. Usa sprites de Jolt con habilidad de dash (ESPACIO),
  pinchos mortales (tiles 982/983), pickups de dash, timer de 25s, pausa, música.
- **Nivel 3 (Kael)**: jugable. Shooter de plataformas: disparo (ESPACIO), 5 drones,
  torretas, sludge tóxico, salto simple, portal que se desbloquea al eliminar 5 drones.
  **No tiene música ni menú de pausa.**
- **Menú**: presenta a Jolt/Dash/Kael, selector de niveles con desbloqueo en
  `localStorage` (`neonEscapeUnlockedLevel`), efecto glitch, música.
- **Código muerto**: `src/scenes/Scene_Game.js` y `src/scenes/Scene_End.js` NO están
  registrados en `main.js`; son prototipos huérfanos.

## Equipo (3 integrantes) y asignación

El examen se califica individual con "3 mejoras por integrante" (equipo de 3 → 9
mejoras totales). Dylan implementa todo el trabajo; el reparto por nivel/personaje
da coherencia a la matriz de asignación exigida por la guía.

- **Dylan Granizo Ayala** → Jolt / Nivel 1
- **Anderson Cango** → Dash / Nivel 2
- **Dayana Lema** → Kael / Nivel 3

## Objetivo

Completar los tres entregables del Proyecto Final (GDD, Video, Despliegue) y el
Examen Práctico (bitácora de playtesting + 9 mejoras implementadas y funcionales),
en este orden: **Mejoras → Deploy → GDD → Video**.

## Alcance

INCLUYE:
- Implementación de 9 mejoras quirúrgicas sobre los 3 niveles existentes.
- Limpieza de código muerto.
- Configuración de GitHub Pages sobre `main` (raíz).
- GDD en HTML maquetado (exportable a PDF por el navegador).
- Bitácora de playtesting (3 corridas × 3 integrantes) + matriz de asignación.
- Paquete de video: guion, shot-list de gameplay y prompts de IA.

NO INCLUYE:
- Construir niveles nuevos desde cero (los 3 ya existen).
- Cambios estructurales a la arquitectura de escenas de Phaser.
- Renderizado/generación real del video (solo el paquete de producción).

## Principios de arquitectura

- Se conserva Phaser 3.60 por CDN, una escena por archivo, sin build.
- Las mejoras se hacen dentro de cada `Scene_NivelN.js`; nada rompe la carga estática
  que permite el despliegue en GitHub Pages.
- No se introducen dependencias nuevas ni assets externos por red.

## Las 9 mejoras (matriz de asignación)

### Dylan Granizo Ayala — Nivel 1 / Jolt (Game Feel + UI)

1. **Coyote Time + jump buffer**
   - Problema: el salto se siente rígido; si el jugador presiona salto justo tras
     dejar la plataforma, no salta.
   - Solución: temporizadores `coyoteTimer` (~100 ms de gracia tras dejar el suelo)
     y `jumpBufferTimer` (~120 ms de input bufferizado antes de tocar suelo) en
     `Scene_Nivel1.update()`.
   - Verificación: se puede saltar unos ms después de caer del borde; el input de
     salto pre-aterrizaje se respeta.

2. **SFX + pop de recolección**
   - Problema: recoger núcleos y saltar no dan feedback auditivo.
   - Solución: `preload` de `assets/audio/collect.wav`; reproducir en
     `collectCollectible()` y un tick suave al saltar; micro-tween de escala/flash
     ya existente reforzado.
   - Verificación: suena al recoger; sin errores 404 en consola.

3. **Timer jugable + aviso de peligro (UI/UX)**
   - Problema: 25s es muy ajustado; no hay señal de urgencia.
   - Solución: subir `levelTime` a 40; cuando `levelTime <= 10`, `timeText` parpadea
     en rojo (tween de color/alpha).
   - Verificación: el contador parpadea rojo en los últimos 10s; el nivel es
     completable con holgura razonable.

### Anderson Cango — Nivel 2 / Dash (Bugfixes + Assets)

4. **Fix de progresión**
   - Problema: `completeLevel()` llama `unlockLevel(2)` (debería ser 3) y la tecla `N`
     reinicia el Nivel 2 en vez de ir al Nivel 3.
   - Solución: `unlockLevel(3)` y `this.scene.start('Scene_Nivel3')` en la rama de
     `nextKey`.
   - Verificación: completar Nivel 2 desbloquea Nivel 3; `N` va al Nivel 3.

5. **Eliminar assets fantasma**
   - Problema: `preload` carga `joltDash_strip.png` y `speed_boost.wav` inexistentes
     (404 en consola).
   - Solución: quitar esas cargas; el dash usa un SFX existente
     (`assets/audio/collect.wav` o `hit.wav`) o queda sin sonido pero sin 404. La
     animación de dash ya está protegida por `textures.exists`.
   - Verificación: consola sin 404 al entrar al Nivel 2; el dash sigue funcionando.

6. **Feedback de daño en pinchos**
   - Problema: morir en pinchos no tiene impacto claro auditivo.
   - Solución: `preload` de `hit.wav`; en `checkSpikeTiles()`/`failLevel('PINCHOS
     MORTALES')` reproducir `hit.wav` + `cameras.main.flash` rojo.
   - Verificación: al tocar pinchos hay flash rojo + sonido antes de la pantalla de
     derrota.

### Dayana Lema — Nivel 3 / Kael (Audio + SFX + Pausa)

7. **Música de Nivel 3 con fade**
   - Problema: el Nivel 3 no tiene música (inconsistente con 1 y 2).
   - Solución: `preload` de `assets/audio/bgm.wav`; iniciar en loop con fade-in en
     `create()`, fade-out/stop en victoria, derrota y al salir de la escena
     (`SHUTDOWN`).
   - Verificación: suena música al entrar; se detiene limpiamente al salir/reiniciar.

8. **SFX de combate**
   - Problema: disparar, destruir drones y ganar/perder no tienen sonido.
   - Solución: `preload` de `hit.wav`, `win.wav`, `lose.wav`; reproducir disparo en
     `shoot()`, explosión en `hitEnemy()`, `win.wav` en `finishLevel()`, `lose.wav`
     en `defeat()`/`toxicDeath()`.
   - Verificación: cada acción emite su sonido; sin 404.

9. **Menú de pausa en Nivel 3 + limpieza de código muerto**
   - Problema: el Nivel 3 no tiene pausa (solo R/M) y existen escenas huérfanas.
   - Solución: añadir pausa con `Esc` (overlay + `physics.pause()`) consistente con
     niveles 1-2; **eliminar** `src/scenes/Scene_Game.js` y `src/scenes/Scene_End.js`
     (no referenciados en `index.html` ni `main.js`).
   - Verificación: Esc pausa/reanuda en Nivel 3; el juego arranca sin referencias
     rotas; los archivos huérfanos ya no existen.

## Verificación general

- Ejecutar en servidor local (`npx serve .` o Live Server) — no abrir por doble clic
  (bloquea carga de `.json` y audios).
- Recorrer los 3 niveles de inicio a fin; revisar la consola del navegador: **cero
  errores 404 y cero excepciones**.
- Confirmar que el flujo de desbloqueo Nivel 1 → 2 → 3 funciona.

## Entregables del Proyecto Final

### A — Game Design Document (GDD)
Documento HTML maquetado (`docs/GDD/index.html` o similar), exportable a PDF desde el
navegador (Ctrl+P → Guardar como PDF). Estructura obligatoria:
1. Portada y datos generales (título, logo textual, los 3 integrantes).
2. Historia y narrativa (lore de Aethelgard, conflicto, objetivo).
3. Personajes (fichas de Jolt, Dash, Kael, drones, torretas, con datos mecánicos y
   visuales).
4. Mecánicas de juego (movimiento, colisiones, victoria/derrota, puntaje, power-ups).
5. Diseño de niveles (mapas/capturas, flujo de dificultad, distribución de elementos).
6. Sección especial — Bitácora e Informe de Playtesting:
   - Observaciones de cada integrante en sus 3 corridas.
   - Matriz de asignación: qué 3 mejoras tomó cada estudiante y cómo se resolvieron
     técnicamente.

### B — Video Introductorio (Trailer)
Archivo de producción (`docs/video/guion-trailer.md`) con:
- Guion por escenas (1–2 min).
- Shot-list de gameplay real a capturar en Phaser.
- Prompts listos para IA generativa de video (Runway / Kling / Luma / Pika) para la
  cinemática de introducción.
- Estructura de edición (orden, música, textos).

### C — Despliegue en GitHub Pages
- Configurar GitHub Pages sirviendo `main` desde la raíz (el `index.html` ya es
  estático y carga Phaser por CDN).
- Verificar que la URL pública `https://dylan1410.github.io/NeonEscape/` cargue y sea
  jugable sin dependencias locales.
- Nota: rutas de assets ya son relativas (`assets/...`, `src/...`), compatibles con el
  subdirectorio de Pages.

## Bitácora de playtesting (contenido)

9 corridas (3 por integrante) redactadas a partir de los problemas reales
documentados arriba. Cada observación se vincula a la mejora que la resuelve, para que
la narrativa "encontrar → consolidar → asignar → arreglar" sea coherente y verificable
contra el código final.

## Riesgos y consideraciones

- Habilitar GitHub Pages puede requerir la UI web de GitHub o `gh` CLI autenticado; si
  `gh` no está autenticado, se documentan los pasos manuales para el usuario.
- La exportación del GDD a PDF la hace el usuario desde el navegador (no hay generador
  de PDF instalado en el entorno).
- El video no se genera; se entrega el paquete de producción.
