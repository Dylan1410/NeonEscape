# Neon Escape

Plataformero 2D cyberpunk hecho con Phaser 3. El proyecto actualmente incluye el menu principal, desbloqueo de niveles, audio, pausa, y el Nivel 1 jugable con Jolt.

## Estado Actual

- Menu principal con presentacion de los 3 personajes: Jolt, Dash y Kael.
- Selector de niveles con desbloqueo guardado en `localStorage`.
- Nivel 1 completo: doble salto, plataforma movil, coleccionables, portal bloqueado, musica, pausa y condicion de derrota.
- Nivel 2 y Nivel 3 existen como escenas placeholder para que el equipo pueda continuar.

## Requisitos

Solo necesitas un navegador moderno y un servidor local. Phaser se carga desde CDN en `index.html`.

No abras `index.html` directamente con doble clic, porque el navegador puede bloquear la carga del mapa `.json` y los audios. Usa servidor local.

## Como Ejecutar

Opcion recomendada con VS Code:

1. Instala la extension **Live Server**.
2. Abre la carpeta del proyecto en VS Code.
3. Click derecho en `index.html`.
4. Selecciona **Open with Live Server**.

Opcion con Python:

```bash
python -m http.server 5500
```

Luego abre:

```text
http://127.0.0.1:5500/index.html
```

Opcion con Node sin instalar nada en el proyecto:

```bash
npx serve .
```

## Controles

Menu:

- Click en un nivel desbloqueado para iniciar.

Nivel 1:

- Flecha izquierda/derecha: mover a Jolt.
- Flecha arriba: salto.
- Flecha arriba en el aire: doble salto.
- `Esc`: pausar/continuar.
- En pausa:
  - `R`: reiniciar.
  - `M`: volver al menu.
- Al completar el nivel:
  - `R`: reiniciar.
  - `N`: ir al nivel 2.
  - `M`: volver al menu.

## Estructura del Proyecto

```text
NeonEscape/
|-- index.html
|-- README.md
|-- assets/
|   |-- audio/
|   |   |-- GameMenu_loop.wav
|   |   |-- menu_select.wav
|   |   `-- nivel1_loop.wav
|   |-- images/
|   |   |-- tileset_cyberpunk.png
|   |   `-- jolt/
|   |       |-- joltDeath_strip.png
|   |       |-- joltIdle_strip.png
|   |       |-- joltJump_strip.png
|   |       `-- joltRun_strip.png
|   `-- tilemaps/
|       `-- nivel1_factory.json
`-- src/
    |-- main.js
    `-- scenes/
        |-- Scene_Menu.js
        |-- Scene_Nivel1.js
        |-- Scene_Nivel2.js
        `-- Scene_Nivel3.js
```

## Escenas

### `Scene_Menu.js`

Menu principal. Contiene:

- Presentacion narrativa de Jolt, Dash y Kael.
- Selector de niveles.
- Musica de menu en loop.
- Efecto de seleccion.
- Efecto visual de glitch.
- Lectura de nivel desbloqueado desde `localStorage`.

El desbloqueo se guarda con la clave:

```js
neonEscapeUnlockedLevel
```

### `Scene_Nivel1.js`

Nivel jugable de Jolt. Contiene:

- Tilemap de Tiled.
- Sprite animado de Jolt.
- Doble salto.
- Plataforma movil usando estetica del tileset original.
- 3 nucleos coleccionables.
- Portal cyberpunk bloqueado hasta recolectar los 3 nucleos.
- Musica en loop del nivel.
- Pausa con `Esc`.
- Derrota al tocar el borde inferior del mapa.
- Desbloqueo del nivel 2 al completar.

### `Scene_Nivel2.js`

Placeholder para Dash. Preparado para implementar el nivel con impulso horizontal.

### `Scene_Nivel3.js`

Placeholder para Kael. Preparado para implementar el nivel con disparo tactico.

## Como Continuar Nivel 2 y Nivel 3

Para implementar un nivel nuevo:

1. Editar `src/scenes/Scene_Nivel2.js` o `src/scenes/Scene_Nivel3.js`.
2. Agregar assets en `assets/images`, `assets/audio` o `assets/tilemaps`.
3. Cargar assets en `preload()`.
4. Crear gameplay en `create()`.
5. Actualizar logica en `update()`.
6. Al completar nivel 2, desbloquear nivel 3:

```js
localStorage.setItem('neonEscapeUnlockedLevel', '3');
this.scene.start('Scene_Menu');
```

## Notas Importantes

- El proyecto usa Phaser 3.60.0 desde CDN.
- No hay dependencias locales ni proceso de build.
- El mapa del nivel 1 viene de Tiled: `assets/tilemaps/nivel1_factory.json`.
- El tileset debe mantener el nombre `cyberpunk_tiles` dentro del JSON para que Phaser lo conecte correctamente.
- Si cambias nombres de archivos, actualiza tambien las rutas en las escenas.

## Creditos del Concepto

Proyecto: **Neon Escape**

Personajes:

- Jolt: doble salto.
- Dash: impulso horizontal.
- Kael: disparo tactico.

Ambientacion: complejo industrial cyberpunk de Aethelgard.
