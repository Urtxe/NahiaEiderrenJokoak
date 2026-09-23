# Guía rápida del repositorio

Aplicación educativa local para Nahia, Eider o ambas. Es una SPA de React + TypeScript montada con Vite. No hay servidor, cuentas ni base de datos. El idioma puede ser euskera o castellano. `npm start` abre el servidor de desarrollo; `npm test` ejecuta Vitest y `npm run build` comprueba TypeScript y genera `dist`.

## Recorrido de la app

`index.html` → `src/main.tsx` → `src/App.tsx`. `App` controla la pantalla mediante `view` (`welcome`, `menu`, `game`, `progress`, `settings`), el perfil activo (`nahia`, `eider`, `team`), el juego y los diálogos. No hay router. El selector de perfil está en `welcome`; `menu` lista los siete juegos. Cada juego se monta desde `App` al entrar en `game` y se desmonta al salir. El botón Inicio vuelve al selector de perfiles; salir de una partida en curso pide confirmación. Las pantallas de progreso y ajustes también viven en `App.tsx`.

Al terminar una actividad, el juego llama a `onComplete(GameResult)`. `App.complete` llama a `useProgress.saveResult(perfil, resultado)` y muestra el diálogo final. La ciudad y la carretera guardan además su estado propio mediante `onCityChange` y `onRoadUpdate`; revisa esas rutas antes de cambiar cuándo se abandona una partida. El progreso completado queda en el perfil con el que se jugó. La partida en curso de los demás juegos no se guarda al salir.

## Dónde cambiar cada cosa

| Cambio | Archivo principal |
| --- | --- |
| Navegación, perfiles, menú, diálogos, resumen de progreso y ajustes | `src/App.tsx` |
| Tipos de pantallas, juegos, resultados y datos persistidos | `src/types.ts` |
| Lectura, normalización de datos antiguos, guardado, borrado y ajustes | `src/hooks/useProgress.ts` |
| Textos comunes en euskera/castellano | `src/data/i18n.ts` |
| Ingredientes, nombres de pociones y edificios | `src/data/content.ts` |
| Dificultad automática, preguntas, puntuación y logros | `src/utils/gameLogic.ts` |
| Coches, circuitos y reglas auxiliares de la carretera | `src/utils/roadLogic.ts` |
| Mecánica de un juego concreto | `src/games/<Juego>.tsx` |
| Estilos globales y de juegos | `src/styles.css` |
| Entrada y URL base de GitHub Pages | `src/main.tsx`, `vite.config.ts` |

Juegos: `AnimalRescue`, `PotionLab`, `QuizRace`, `MuseumDetectives`, `MagicCity`, `StarRoad` y `NumberGarden`, todos en `src/games/`. Para agregar otro juego, actualizar el tipo `GameId`, la ficha y el render en `App`, los textos y los valores iniciales pertinentes; seguir el patrón de `GameResult` y `onComplete`.

## Datos y comprobación

`useProgress` persiste `SavedState` en `localStorage` bajo `nahia-eider-jokoak-v1`. `normalizeSavedState` completa campos que faltan para conservar progreso de versiones anteriores; `blankStats` crea los valores iniciales. Hay tres registros de `Stats` independientes. Las opciones de idioma, sonido, dificultad y movimiento reducido son globales. Cambiar la forma de los datos exige revisar normalización, valores iniciales y pruebas de migración.

Las pruebas de lógica están en `src/utils/gameLogic.test.ts` y `src/utils/newGames.test.ts`. Para cambios de lógica, ejecutar la prueba relevante y `npm run build`; para navegación o UI, al menos `npm run build` y comprobar manualmente el recorrido afectado. El sitio se publica desde `main` con GitHub Actions en GitHub Pages; la ruta base configurada es `/NahiaEiderrenJokoak/`.

Antes de editar, empezar por la fila pertinente y seguir sus llamadas directas. Ampliar la lectura solo cuando la ruta afectada lo exija. Mantener cambios pequeños, reutilizar funciones existentes y no mezclar el progreso de perfiles.
