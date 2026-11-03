import { useState } from 'react';
import type { GameResult, Language, SchoolLevel } from '../types';
import { calculateStars, shuffle } from '../utils/gameLogic';

type StoryCard = { icon: string; eu: string; es: string };
type Story = { eu: string; es: string; cards: StoryCard[] };

const stories: Story[] = [
  {
    eu: 'Lore bat hazten da',
    es: 'Crece una flor',
    cards: [
      { icon: '🌱', eu: 'Hazia lurrean jartzen dugu.', es: 'Plantamos una semilla.' },
      { icon: '💧', eu: 'Ura ematen diogu.', es: 'La regamos.' },
      { icon: '🌼', eu: 'Lorea hazten da.', es: 'Crece una flor.' },
    ],
  },
  {
    eu: 'Etxetik eskolara',
    es: 'De casa al cole',
    cards: [
      { icon: '👕', eu: 'Jantzi egiten naiz.', es: 'Me visto.' },
      { icon: '🥣', eu: 'Gosaria jaten dut.', es: 'Desayuno.' },
      { icon: '🎒', eu: 'Motxila hartzen dut.', es: 'Cojo la mochila.' },
    ],
  },
  {
    eu: 'Euria hasi da',
    es: 'Empieza a llover',
    cards: [
      { icon: '☁️', eu: 'Hodei iluna agertzen da.', es: 'Llega una nube oscura.' },
      { icon: '🌧️', eu: 'Euria hasten da.', es: 'Empieza a llover.' },
      { icon: '🌈', eu: 'Ortzadarra agertzen da.', es: 'Sale el arcoíris.' },
    ],
  },
  {
    eu: 'Sagar zukua',
    es: 'Zumo de manzana',
    cards: [
      { icon: '🍎', eu: 'Sagar bat hartzen dugu.', es: 'Cogemos una manzana.' },
      { icon: '🔪', eu: 'Heldu batek sagarra mozten du.', es: 'Una persona adulta corta la manzana.' },
      { icon: '🥤', eu: 'Zukua edaten dugu.', es: 'Bebemos el zumo.' },
    ],
  },
  {
    eu: 'Tximeletaren bidaia',
    es: 'El viaje de la mariposa',
    cards: [
      { icon: '🥚', eu: 'Tximeletak arrautzak uzten ditu hosto batean.', es: 'La mariposa pone huevos en una hoja.' },
      { icon: '🐛', eu: 'Beldarra jaiotzen da eta hostoak jaten ditu.', es: 'Nace una oruga y come hojas.' },
      { icon: '🫛', eu: 'Beldarra krisalida batean gordetzen da.', es: 'La oruga se transforma dentro de una crisálida.' },
      { icon: '🦋', eu: 'Tximeleta berria ateratzen da.', es: 'Sale una mariposa nueva.' },
    ],
  },
  {
    eu: 'Bizikletaz ibiltzen ikasten',
    es: 'Aprender a montar en bici',
    cards: [
      { icon: '🪖', eu: 'Kaskoa jartzen dut.', es: 'Me pongo el casco.' },
      { icon: '🚲', eu: 'Heldu batek bizikletari heltzen dio.', es: 'Una persona adulta sujeta la bicicleta.' },
      { icon: '🚴', eu: 'Oreka lantzen dut laguntzarekin.', es: 'Practico el equilibrio con ayuda.' },
      { icon: '⭐', eu: 'Gero eta hobeto ibiltzen naiz.', es: 'Cada vez voy un poco mejor.' },
    ],
  },
];

const label = (lang: Language, eu: string, es: string) => lang === 'eu' ? eu : es;

function newRound(level: SchoolLevel) {
  const pool = level === 'lh1' ? stories.slice(0, 4) : stories.slice(2);
  const story = pool[Math.floor(Math.random() * pool.length)];
  return { story, choices: shuffle(story.cards.map((_, index) => index)) };
}

export function StoryOrder({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const [roundData, setRoundData] = useState(() => newRound(level));
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [message, setMessage] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const total = 4;
  const { story, choices } = roundData;

  const choose = (card: number) => {
    if (sequence.includes(card) || sequence.length >= story.cards.length) return;
    setSequence([...sequence, card]);
    setMessage('');
  };

  const check = () => {
    if (advancing) return;
    const isCorrect = sequence.every((card, index) => card === index) && sequence.length === story.cards.length;
    if (!isCorrect) {
      setMistake(true);
      setSequence([]);
      setMessage(label(lang, 'Ia! Saiatu berriro, pausoz pauso.', '¡Casi! Prueba otra vez, paso a paso.'));
      return;
    }

    const nextCorrect = correct + (mistake ? 0 : 1);
    setAdvancing(true);
    setMessage(label(lang, 'Oso ondo! Istorioa osatu duzu.', '¡Muy bien! Has ordenado la historia.'));
    window.setTimeout(() => {
      if (round + 1 === total) {
        onComplete({ game: 'stories', score: nextCorrect, correct: nextCorrect, total, stars: calculateStars(nextCorrect, total) });
        return;
      }
      setCorrect(nextCorrect);
      setRound(round + 1);
      setRoundData(newRound(level));
      setSequence([]);
      setMistake(false);
      setAdvancing(false);
      setMessage('');
    }, 650);
  };

  const removeLast = () => {
    setSequence(sequence.slice(0, -1));
    setMessage('');
  };

  return <section className="game-shell learning-game">
    <div className="game-top">
      <div>
        <span className="eyebrow">📚 {label(lang, 'ISTORIEN HURRENKERA', 'ORDENA LA HISTORIA')}</span>
        <h2>{label(lang, 'Zer gertatu da lehenengo?', '¿Qué pasó primero?')}</h2>
        <p>{label(lang, 'Ukitu txartelak istorioa ordenatzeko.', 'Toca las tarjetas para ordenar la historia.')}</p>
      </div>
      <span className="counter">{round + 1} / {total}</span>
    </div>

    <div className="question-card" aria-label={lang === 'eu' ? story.eu : story.es}>
      <h3>{lang === 'eu' ? story.eu : story.es}</h3>
      <div className="answers" aria-label={label(lang, 'Aukeratu ordenean', 'Elige el orden')}>
        {choices.map((cardIndex) => {
          const card = story.cards[cardIndex];
          const selectedAt = sequence.indexOf(cardIndex);
          return <button
            className={`answer ${selectedAt >= 0 ? 'used' : ''}`}
            key={cardIndex}
            onClick={() => choose(cardIndex)}
            disabled={selectedAt >= 0}
            aria-label={`${card.icon} ${lang === 'eu' ? card.eu : card.es}`}
          >
            <span style={{ display: 'block', fontSize: '2.6rem' }}>{card.icon}</span>
            {level === 'lh3' && <small>{lang === 'eu' ? card.eu : card.es}</small>}
          </button>;
        })}
      </div>

      <div className="story-order" aria-live="polite">
        {sequence.map((cardIndex, position) => <span key={`${cardIndex}-${position}`}>
          <b>{position + 1}.</b> {story.cards[cardIndex].icon}
        </span>)}
        {Array.from({ length: story.cards.length - sequence.length }, (_, index) => <span key={`empty-${index}`} className="story-slot">{sequence.length + index + 1}. ···</span>)}
      </div>

      <div className="modal-actions">
        <button className="secondary" onClick={removeLast} disabled={!sequence.length || advancing}>{label(lang, 'Azkena kendu', 'Quitar la última')}</button>
        <button className="primary" onClick={check} disabled={sequence.length !== story.cards.length || advancing}>{label(lang, 'Egiaztatu', 'Comprobar')} →</button>
      </div>
      {message && <p role="status" className={mistake && !sequence.length ? 'gentle-feedback' : 'good-feedback'}>{message}</p>}
    </div>
    <p className="learning-note">{label(lang, 'Ez dago presarik. Saiatu istorioaren urratsei begiratzen.', 'No hay prisa. Piensa en los pasos de la historia.')}</p>
  </section>;
}
