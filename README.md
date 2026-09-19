# Nahia eta Eiderren Jokoak

Aplicación local de juegos educativos para primaria, en euskera y castellano.

- Siete juegos: matemáticas, memoria, secuencias, comprensión, creatividad y coordinación.
- Perfiles independientes para Nahia, Eider y juego cooperativo.
- Progreso, récords y últimas actividades guardados en el navegador de este ordenador (`localStorage`).
- La puntuación es de aprendizaje: terminar siempre da una semilla/estrella y la precisión mejora la recompensa; los reintentos no restan.

## Uso

```bash
npm install
npm start
```

Abre la dirección que muestra el comando (normalmente `http://localhost:5173`). No abras `index.html` directamente: es la entrada de Vite y necesita el servidor para transformar `src/main.tsx`.

Para comprobar el proyecto: `npm test` y `npm run build`.

Portal local de juegos educativos, alegre y seguro, pensado para Nahia y Eider. No incluye cuentas, anuncios, pagos, analítica, enlaces externos ni backend.

## Requisitos y uso

Necesitas Node.js 20 o superior.

```bash
npm install
npm start
```

Para preparar la versión de producción:

```bash
npm run build
npm run preview
```

También se pueden ejecutar las pruebas de lógica con `npm test`.

## GitHub Pages

Al subir cambios a la rama `main`, el flujo de GitHub Actions compila y publica automáticamente `dist` en `https://urtxe.github.io/NahiaEiderrenJokoak/`. En la configuración del repositorio, selecciona **Settings → Pages → Source → GitHub Actions** una única vez.

## Datos y privacidad

Todo el progreso se conserva exclusivamente en `localStorage` del navegador de este ordenador. Se puede borrar por perfil o completamente desde Ajustes, siempre con confirmación.

## Juegos incluidos

- Rescate de animales: 8 retos de matemáticas, patrones y naturaleza.
- Taller de pociones: 5 recetas de memoria y secuencias.
- Carrera de preguntas: 10 preguntas en una carrera amistosa.
- Detectives del museo: cinco pistas de observación, memoria y deducción.
- Mi ciudad mágica: misiones cortas para desbloquear y colocar construcciones.
- Camino de estrellas: arcade de carreras Canvas con tres coches, tres circuitos, teclado, controles táctiles y mando opcional.

El portal incluye perfiles de Nahia, Eider y modo conjunto, euskera/castellano, dificultad automática, logros y medallas. La carrera se pausa automáticamente al ocultar la pestaña. Ideas para ampliarlo: un taller de música, un jardín de cuentos o nuevos barrios temáticos para la ciudad.
