import { useEffect, useRef, useState } from 'react';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { calculateStars } from '../utils/gameLogic';
import { useAnswerFeedback } from './AnswerFeedback';
import './MemoryPairs.css';
import card1 from '../assets/memory/card-1.webp';
import card2 from '../assets/memory/card-2.webp';
import card3 from '../assets/memory/card-3.webp';
import card4 from '../assets/memory/card-4.webp';
import card5 from '../assets/memory/card-5.webp';
import card6 from '../assets/memory/card-6.webp';
import card7 from '../assets/memory/card-7.webp';
import card8 from '../assets/memory/card-8.webp';

const pictures = [card1, card2, card3, card4, card5, card6, card7, card8];
const labels = {
  eu: ['Izotz-magoa', 'Neguko esploratzailea', 'Elurrezko panpina', 'Elur-oreina', 'Soineko arrosadun panpina', 'Moda-diseinatzailea', 'Auto arrosa', 'Txakurkumea'],
  es: ['Mago de hielo', 'Exploradora de invierno', 'Muñeco de nieve', 'Reno', 'Muñeca de vestido rosa', 'Diseñadora de moda', 'Coche rosa', 'Cachorro'],
};

function shuffleCards<T>(items: T[]) {
  for (let index = items.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function shuffledCards(count: number) {
  const pairs = shuffleCards(pictures.map((_, index) => index)).slice(0, count);
  return shuffleCards(pairs.flatMap(pair => [{ pair, key: pair * 2 }, { pair, key: pair * 2 + 1 }]));
}

export function MemoryPairs({ lang, level, profile, onComplete }: {
  lang: Language;
  level: SchoolLevel;
  profile: ProfileId;
  onComplete: (result: GameResult) => void;
}) {
  const total = level === 'lh1' ? 6 : 8;
  const team = profile === 'team';
  const [deck] = useState(() => shuffledCards(total));
  const [revealed, setRevealed] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const [mismatch, setMismatch] = useState(false);
  const finished = useRef(false);
  const { advancing, showFeedback } = useAnswerFeedback();
  const eu = lang === 'eu';

  // Pause the mismatch reveal timer while a navigation/result dialog is open.
  useEffect(() => {
    if (!mismatch || advancing) return;
    const timer = window.setTimeout(() => {
      setRevealed([]);
      setMismatch(false);
      if (team) setTurn(current => current === 0 ? 1 : 0);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [advancing, mismatch, team]);

  const finish = (nextScores: [number, number]) => {
    if (finished.current) return;
    finished.current = true;
    const winner = nextScores[0] === nextScores[1] ? -1 : nextScores[0] > nextScores[1] ? 0 : 1;
    const summary = team
      ? `Nahia: ${nextScores[0]} ${eu ? 'bikote' : 'parejas'} · Eider: ${nextScores[1]} ${eu ? 'bikote' : 'parejas'}. ${winner < 0 ? (eu ? 'Berdinketa!' : '¡Empate!') : `${winner === 0 ? 'Nahia' : 'Eider'} ${eu ? 'irabazi du!' : 'gana!'}`}`
      : undefined;
    onComplete({
      game: 'memoryPairs',
      score: team ? Math.max(...nextScores) : nextScores[0],
      correct: total,
      total,
      stars: calculateStars(total, total),
      ...(team ? { teamWin: winner >= 0, summary } : {}),
    });
  };

  const selectCard = (index: number) => {
    if (advancing || finished.current || mismatch || revealed.length === 2 || matched.has(index) || revealed.includes(index)) return;
    const open = [...revealed, index];
    setRevealed(open);
    if (open.length < 2) return;

    const [first, second] = open;
    const currentTurn = turn;
    if (deck[first].pair === deck[second].pair) {
      const nextMatched = new Set(matched);
      nextMatched.add(first);
      nextMatched.add(second);
      setMatched(nextMatched);
      const nextScores: [number, number] = [...scores];
      nextScores[currentTurn] += 1;
      setScores(nextScores);
      const matchedCount = nextMatched.size / 2;
      showFeedback(true, eu ? 'Bikotea aurkitu duzu!' : '¡Has encontrado una pareja!', () => {
        setRevealed([]);
        if (team) setTurn(current => current === 0 ? 1 : 0);
        if (matchedCount === total) finish(nextScores);
      });
    } else {
      setMismatch(true);
      showFeedback(false, eu ? 'Irudiak desberdinak dira.' : 'Las imágenes son distintas.');
    }
  };

  const playerName = turn === 0 ? 'Nahia' : 'Eider';
  return <section className="memory-pairs" aria-label={eu ? 'Irudi bikoteak' : 'Parejas de imágenes'}>
    <header className="memory-pairs__header">
      <div>
        <h2>{eu ? 'Irudi bikoteak' : 'Parejas de imágenes'}</h2>
        <p>{eu ? 'Aurkitu irudi berdinak!' : '¡Encuentra las imágenes iguales!'}</p>
      </div>
      {team
        ? <div className="memory-pairs__scoreboard" aria-live="polite">
            <span className={turn === 0 ? 'is-active' : ''}>Nahia <b>{scores[0]}</b></span>
            <span className={turn === 1 ? 'is-active' : ''}>Eider <b>{scores[1]}</b></span>
            <strong>{eu ? `${playerName}ren txanda` : `Turno de ${playerName}`}</strong>
          </div>
        : <span className="memory-pairs__count">{matched.size / 2}/{total}</span>}
    </header>
    <div className={`memory-pairs__grid ${total === 8 ? 'memory-pairs__grid--eight' : ''}`}>
      {deck.map((card, index) => {
        const visible = revealed.includes(index) || matched.has(index);
        const label = labels[lang][card.pair];
        return <button
          key={card.key}
          type="button"
          className={`memory-pairs__card ${visible ? 'is-open' : ''} ${matched.has(index) ? 'is-matched' : ''}`}
          onClick={() => selectCard(index)}
          aria-label={visible ? `${label}${matched.has(index) ? (eu ? ', aurkituta' : ', encontrada') : ''}` : `${eu ? 'Erakutsi txartela' : 'Mostrar tarjeta'} ${index + 1}`}
          aria-pressed={visible}
          disabled={advancing || matched.has(index) || revealed.includes(index) || revealed.length === 2}
        >
          {visible
            ? <img src={pictures[card.pair]} alt={label} draggable={false} />
            : <span aria-hidden="true">❄️</span>}
        </button>;
      })}
    </div>
  </section>;
}
