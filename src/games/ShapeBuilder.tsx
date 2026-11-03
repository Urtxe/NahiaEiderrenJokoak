import { useState } from 'react';
import type { GameResult, Language, SchoolLevel } from '../types';
import { calculateStars } from '../utils/gameLogic';

type Shape = { icon: string; color: string; name: { eu: string; es: string } };
type Puzzle = { cells: (Shape | null)[]; answer: Shape; options: Shape[] };

const circle: Shape = { icon: '●', color: '#ed7b9c', name: { eu: 'zirkulua', es: 'círculo' } };
const square: Shape = { icon: '■', color: '#6c9df1', name: { eu: 'karratua', es: 'cuadrado' } };
const triangle: Shape = { icon: '▲', color: '#e2a52e', name: { eu: 'hirukia', es: 'triángulo' } };
const diamond: Shape = { icon: '◆', color: '#8c78d8', name: { eu: 'erronboa', es: 'rombo' } };

const puzzles: Record<SchoolLevel, Puzzle[]> = {
  lh1: [
    { cells: [circle, square, circle, null], answer: square, options: [triangle, square, diamond] },
    { cells: [triangle, diamond, triangle, null], answer: diamond, options: [circle, diamond, square] },
    { cells: [square, circle, square, null], answer: circle, options: [circle, triangle, diamond] },
  ],
  lh3: [
    { cells: [circle, square, triangle, square, triangle, circle, triangle, circle, null], answer: square, options: [diamond, square, circle] },
    { cells: [triangle, circle, square, circle, square, triangle, square, triangle, null], answer: circle, options: [square, diamond, circle] },
    { cells: [square, triangle, circle, triangle, circle, square, circle, square, null], answer: triangle, options: [triangle, circle, diamond] },
  ],
};

export function ShapeBuilder({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const rounds = puzzles[level];
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const puzzle = rounds[round];
  const eu = lang === 'eu';

  const choose = (shape: Shape) => {
    if (message && !isError) return;
    if (shape !== puzzle.answer) {
      setMistake(true);
      setIsError(true);
      setMessage(eu ? 'Oso gertu! Begiratu eredua berriro.' : '¡Casi! Mira el patrón otra vez.');
      return;
    }

    const score = correct + (mistake ? 0 : 1);
    setIsError(false);
    setMessage(eu ? 'Bikain! Eredua osatu duzu.' : '¡Muy bien! Has completado el patrón.');
    window.setTimeout(() => {
      if (round + 1 === rounds.length) {
        onComplete({ game: 'shapes', score, correct: score, total: rounds.length, stars: calculateStars(score, rounds.length) });
      } else {
        setCorrect(score);
        setRound(round + 1);
        setMistake(false);
        setMessage('');
        setIsError(false);
      }
    }, 550);
  };

  const columns = level === 'lh1' ? 2 : 3;
  return <section className="game-shell learning-game shape-game">
    <div className="game-top"><div>
      <span className="eyebrow">🧩 {eu ? 'FORMAK ETA EREDUAK' : 'FORMAS Y PATRONES'}</span>
      <h2>{eu ? 'Osatu eredua' : 'Completa el modelo'}</h2>
      <p>{eu ? 'Begiratu formak eta aukeratu falta dena.' : 'Mira las formas y elige la que falta.'}</p>
    </div><span className="counter">{round + 1} / {rounds.length}</span></div>

    <div className="question-card" style={{ textAlign: 'center' }}>
      <div aria-label={eu ? 'Eredua' : 'Modelo'} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(68px, 112px))`, justifyContent: 'center', gap: 12, margin: '12px auto 22px' }}>
        {puzzle.cells.map((shape, index) => <div key={index} aria-label={shape ? shape.name[lang] : (eu ? 'falta den forma' : 'forma que falta')} style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 18, border: shape ? '2px solid #e6e1f1' : '3px dashed #9b8cc2', background: shape ? '#fff' : '#f6f2ff', color: shape?.color ?? '#8c78d8', fontSize: 48, fontWeight: 900 }}>{shape?.icon ?? '?'}</div>)}
      </div>
      <h3>{eu ? 'Zein forma doa ereduarekin?' : '¿Qué forma completa el patrón?'}</h3>
      <div className="answers">{puzzle.options.map((shape, index) => <button className="answer" key={`${shape.icon}-${index}`} onClick={() => choose(shape)} aria-label={shape.name[lang]} style={{ color: shape.color, fontSize: '2.4rem' }}>{shape.icon}</button>)}</div>
      {message && <p role="status" className={isError ? 'gentle-feedback' : 'good-feedback'}>{message}</p>}
    </div>
    <p className="learning-note">{eu ? 'Ez dago presarik. Saiatu beste aukera batekin.' : 'Sin prisa. Puedes probar otra opción.'}</p>
  </section>;
}
