import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { GameResult, Language, SchoolLevel } from '../types';
import { calculateStars, shuffle } from '../utils/gameLogic';

type Shape = { icon: string; color: string; name: { eu: string; es: string } };
type Puzzle = { cells: (Shape | null)[]; answer: Shape; options: Shape[] };

const circle: Shape = { icon: '●', color: '#ed7b9c', name: { eu: 'zirkulua', es: 'círculo' } };
const square: Shape = { icon: '■', color: '#6c9df1', name: { eu: 'karratua', es: 'cuadrado' } };
const triangle: Shape = { icon: '▲', color: '#e2a52e', name: { eu: 'hirukia', es: 'triángulo' } };
const diamond: Shape = { icon: '◆', color: '#8c78d8', name: { eu: 'erronboa', es: 'rombo' } };

const shapes = [circle, square, triangle, diamond];
const patterns: Record<SchoolLevel, number[][]> = {
  lh1: [[0, 0, 1], [0, 1, 1], [0, 1, 2], [0, 1, 0, 2]],
  lh3: [[0, 1, 2, 1], [0, 0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 1, 3], [0, 1, 1, 2, 3]],
};

function makePuzzles(level: SchoolLevel): Puzzle[] {
  const size = level === 'lh1' ? 8 : 12;
  return shuffle(patterns[level]).slice(0, 3).map(pattern => {
    const palette = shuffle(shapes);
    const gap = 1 + Math.floor(Math.random() * (size - 2));
    const cells = Array.from({ length: size }, (_, index) => index === gap ? null : palette[pattern[index % pattern.length]]);
    return { cells, answer: palette[pattern[gap % pattern.length]], options: shuffle(shapes) };
  });
}

export function ShapeBuilder({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const [rounds] = useState(() => makePuzzles(level));
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistake, setMistake] = useState(false);
  const puzzle = rounds[round];
  const eu = lang === 'eu';

  const choose = (shape: Shape) => {
    if (advancing) return;
    if (shape !== puzzle.answer) {
      setMistake(true);
      showFeedback(false, eu ? 'Begiratu eredua berriro.' : 'Mira el patrón otra vez.');
      return;
    }

    const score = correct + (mistake ? 0 : 1);
    showFeedback(true, eu ? 'Eredua osatu duzu.' : 'Has completado el patrón.', () => {
      if (round + 1 === rounds.length) {
        onComplete({ game: 'shapes', score, correct: score, total: rounds.length, stars: calculateStars(score, rounds.length) });
      } else {
        setCorrect(score);
        setRound(round + 1);
        setMistake(false);
      }
    });
  };

  return <section className="game-shell learning-game shape-game">
    <div className="game-top"><div>
      <span className="eyebrow">🧩 {eu ? 'FORMAK ETA EREDUAK' : 'FORMAS Y PATRONES'}</span>
      <h2>{eu ? 'Osatu eredua' : 'Completa el modelo'}</h2>
      <p>{eu ? 'Irakurri eredua ezkerretik eskuinera, lerroz lerro, eta aukeratu falta den forma.' : 'Lee el patrón de izquierda a derecha, fila por fila, y elige la forma que falta.'}</p>
    </div><span className="counter">{round + 1} / {rounds.length}</span></div>

    <div className="question-card" style={{ textAlign: 'center' }}>
      <div aria-label={eu ? 'Eredua' : 'Modelo'} style={{ display: 'grid', gridTemplateColumns: `repeat(${level === 'lh1' ? 4 : 6}, minmax(0, 1fr))`, maxWidth: 380, gap: 'clamp(6px, 2vw, 12px)', margin: '12px auto 22px' }}>
        {puzzle.cells.map((shape, index) => <div key={index} aria-label={shape ? shape.name[lang] : (eu ? 'falta den forma' : 'forma que falta')} style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 18, border: shape ? '2px solid #e6e1f1' : '3px dashed #9b8cc2', background: shape ? '#fff' : '#f6f2ff', color: shape?.color ?? '#8c78d8', fontSize: 'clamp(26px, 7vw, 48px)', fontWeight: 900 }}>{shape?.icon ?? '?'}</div>)}
      </div>
      <h3>{eu ? 'Zein forma doa ereduarekin?' : '¿Qué forma completa el patrón?'}</h3>
      <div className="answers">{puzzle.options.map((shape, index) => <button className="answer" key={`${shape.icon}-${index}`} onClick={() => choose(shape)} disabled={advancing} aria-label={shape.name[lang]} style={{ color: shape.color, fontSize: '2.4rem' }}>{shape.icon}</button>)}</div>
    </div>
    <p className="learning-note">{eu ? 'Ez dago presarik. Saiatu beste aukera batekin.' : 'Sin prisa. Puedes probar otra opción.'}</p>
  </section>;
}
