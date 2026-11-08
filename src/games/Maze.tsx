import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { calculateStars } from '../utils/gameLogic';
import { generateMaze, moveInMaze, type MazeDirection, type MazePoint } from '../utils/mazeLogic';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { useAnswerFeedback } from './AnswerFeedback';
import './maze.css';

const turnNames = { nahia: 'Nahia', eider: 'Eider' } as const;
const labels = {
  eu: { title: 'Aurkitu irteera', instructions: 'Erabili gezi-teklak edo pantailako geziak mugitzeko.', moves: 'Urratsak', up: 'Gora mugitu', down: 'Behera mugitu', left: 'Ezkerretara mugitu', right: 'Eskuinera mugitu', finish: 'Helmuga', start: 'Hasiera', player: 'Jokalaria', nextTurn: 'Orain Eiderrek jokatuko du. Labirinto bera izango du.', reached: 'Irteerara iritsi zara!', win: (name: string) => `${name}k irabazi du labirintoko erronka!`, tie: 'Berdinketa! Biek urrats kopuru bera egin dute.', solo: 'Irteera aurkitu duzu!' },
  es: { title: 'Encuentra la salida', instructions: 'Muévete con las flechas del teclado o con las flechas de la pantalla.', moves: 'Pasos', up: 'Mover arriba', down: 'Mover abajo', left: 'Mover a la izquierda', right: 'Mover a la derecha', finish: 'Meta', start: 'Inicio', player: 'Turno', nextTurn: 'Ahora juega Eider. Recorrerá el mismo laberinto.', reached: '¡Has llegado a la salida!', win: (name: string) => `¡${name} gana el reto del laberinto!`, tie: '¡Empate! Las dos habéis dado el mismo número de pasos.', solo: '¡Has encontrado la salida!' },
};

export function Maze({ lang, level, profile, onComplete }: { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (result: GameResult) => void }) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const [maze] = useState(() => generateMaze(level));
  const [position, setPosition] = useState<MazePoint>(maze.start);
  const [steps, setSteps] = useState(0);
  const [turn, setTurn] = useState(0);
  const [firstSteps, setFirstSteps] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const finishedRef = useRef(false);
  const turnFinishingRef = useRef(false);
  const team = profile === 'team';
  const text = labels[lang];
  const player = team ? (turn === 0 ? turnNames.nahia : turnNames.eider) : profile === 'eider' ? turnNames.eider : turnNames.nahia;

  function finishTurn(finalSteps: number) {
    if (finishedRef.current) return;
    if (team && turn === 0) {
      showFeedback(true, text.nextTurn, () => {
        setFirstSteps(finalSteps);
        setTurn(1);
        setPosition(maze.start);
        setSteps(0);
        turnFinishingRef.current = false;
      });
      return;
    }
    finishedRef.current = true;
    setFinished(true);
    const tie = team && firstSteps === finalSteps;
    const winner = team ? (tie ? undefined : (firstSteps! < finalSteps ? turnNames.nahia : turnNames.eider)) : undefined;
    const summary = team
      ? `${tie ? text.tie : text.win(winner!)} Nahia: ${firstSteps} · Eider: ${finalSteps} ${lang === 'eu' ? 'urrats' : 'pasos'}.`
      : `${text.solo} ${finalSteps} ${lang === 'eu' ? 'urrats' : 'pasos'}.`;
    const bestSteps = Math.min(firstSteps ?? finalSteps, finalSteps);
    const result: GameResult = {
      game: 'maze', score: Math.round(100 * maze.shortestPath / bestSteps),
      correct: 1, total: 1, stars: calculateStars(1, 1), teamWin: team && !tie, summary,
    };
    showFeedback(true, text.reached, () => onComplete(result));
  }

  function move(direction: MazeDirection) {
    if (advancing || finishedRef.current || turnFinishingRef.current) return;
    const next = moveInMaze(maze, position, direction);
    if (next === position) return;
    const nextSteps = steps + 1;
    setPosition(next);
    setSteps(nextSteps);
    if (next.x === maze.goal.x && next.y === maze.goal.y) {
      turnFinishingRef.current = true;
      finishTurn(nextSteps);
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyDirections: Record<string, MazeDirection> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      const direction = keyDirections[event.key];
      if (!direction || advancing || finished || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      move(direction);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return <section className="game-shell maze-game">
    <div className="game-top"><div><span className="eyebrow">🌀 {text.title}</span><h2>{text.instructions}</h2></div><span className="counter">{team ? `${turn + 1} / 2` : `${level === 'lh1' ? 'LH1' : 'LH3'}`}</span></div>
    {team && <p className="maze-turn">{text.player}: <strong>{player}</strong></p>}
    <div className="maze-stats"><span>{text.moves}: <strong>{steps}</strong></span>{firstSteps !== null && <span>Nahia: <strong>{firstSteps}</strong></span>}</div>
    <div className="maze-track" role="grid" aria-label={lang === 'eu' ? 'Labirintoa' : 'Laberinto'} style={{ '--maze-size': maze.size } as CSSProperties}>
      {maze.walls.flatMap((row, y) => row.map((wall, x) => {
        const isPlayer = position.x === x && position.y === y;
        const isGoal = maze.goal.x === x && maze.goal.y === y;
        const isStart = maze.start.x === x && maze.start.y === y;
        return <div role="gridcell" key={`${x}-${y}`} aria-label={isPlayer ? player : isGoal ? text.finish : isStart ? text.start : undefined} className={`maze-cell${wall ? ' wall' : ''}${isPlayer ? ' player' : ''}${isGoal ? ' goal' : ''}`}>
          {isPlayer ? <span aria-hidden="true">🧒</span> : isGoal ? <span aria-hidden="true">🏁</span> : isStart && steps === 0 ? <span aria-hidden="true">🚩</span> : null}
        </div>;
      }))}
    </div>
    <div className="maze-controls" aria-label={lang === 'eu' ? 'Mugimendu-kontrolak' : 'Controles de movimiento'}>
      <button type="button" onClick={() => move('up')} disabled={advancing || finished} aria-label={text.up}>↑</button>
      <button type="button" onClick={() => move('left')} disabled={advancing || finished} aria-label={text.left}>←</button>
      <button type="button" onClick={() => move('down')} disabled={advancing || finished} aria-label={text.down}>↓</button>
      <button type="button" onClick={() => move('right')} disabled={advancing || finished} aria-label={text.right}>→</button>
    </div>
  </section>;
}
