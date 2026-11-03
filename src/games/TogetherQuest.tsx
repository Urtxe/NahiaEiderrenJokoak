import { useState } from 'react';
import type { GameResult, Language, SchoolLevel } from '../types';
import { calculateStars } from '../utils/gameLogic';

type Choice = { icon: string; eu: string; es: string };
type Clue = { eu: string; es: string; answer: number; choices: Choice[] };

const clues: Record<SchoolLevel, Clue[]> = {
  lh1: [
    {
      eu: 'Lehen pista lore artean dago. Non bilatuko dugu?',
      es: 'La primera pista está entre las flores. ¿Dónde la buscamos?',
      answer: 0,
      choices: [
        { icon: '🌷', eu: 'Loreak', es: 'Las flores' },
        { icon: '🌊', eu: 'Itsasoa', es: 'El mar' },
        { icon: '🏠', eu: 'Etxea', es: 'La casa' },
      ],
    },
    {
      eu: 'Hurrengo arrastoa mendiaren gainean dago. Zein aukeratuko dugu?',
      es: 'La siguiente pista está en la montaña. ¿Cuál elegimos?',
      answer: 1,
      choices: [
        { icon: '🌳', eu: 'Zuhaitza', es: 'El árbol' },
        { icon: '⛰️', eu: 'Mendia', es: 'La montaña' },
        { icon: '🐟', eu: 'Arraina', es: 'El pez' },
      ],
    },
    {
      eu: 'Altxorra kobazuloan dago! Non dago kobazuloa?',
      es: '¡El tesoro está en la cueva! ¿Dónde está la cueva?',
      answer: 2,
      choices: [
        { icon: '☁️', eu: 'Hodeia', es: 'La nube' },
        { icon: '🏕️', eu: 'Denda', es: 'La tienda' },
        { icon: '🪨', eu: 'Kobazuloa', es: 'La cueva' },
      ],
    },
  ],
  lh3: [
    {
      eu: 'Irteeran, lehen arrastoa lakuaren ondoan dago. Zein lekuk du ura?',
      es: 'Al salir, la primera pista está junto al lago. ¿Qué lugar tiene agua?',
      answer: 1,
      choices: [
        { icon: '🌋', eu: 'Sumendia', es: 'El volcán' },
        { icon: '🏞️', eu: 'Lakua', es: 'El lago' },
        { icon: '🌵', eu: 'Basamortua', es: 'El desierto' },
      ],
    },
    {
      eu: 'Lakuaren ondoren, basoan sartuko gara. Zer ikusiko dugu basoan?',
      es: 'Después del lago entraremos en el bosque. ¿Qué veremos allí?',
      answer: 2,
      choices: [
        { icon: '🐚', eu: 'Maskorrak', es: 'Conchas' },
        { icon: '🏢', eu: 'Eraikinak', es: 'Edificios' },
        { icon: '🌲', eu: 'Zuhaitzak', es: 'Árboles' },
      ],
    },
    {
      eu: 'Basoaren beste aldean, zubia zeharkatu behar dugu. Zeren gainetik pasatzen da zubia?',
      es: 'Al otro lado del bosque cruzaremos un puente. ¿Sobre qué suele pasar?',
      answer: 0,
      choices: [
        { icon: '🏞️', eu: 'Ibaiaren gainetik', es: 'Sobre un río' },
        { icon: '🌳', eu: 'Zuhaitz baten gainetik', es: 'Sobre un árbol' },
        { icon: '🌙', eu: 'Ilargiaren gainetik', es: 'Sobre la luna' },
      ],
    },
    {
      eu: 'Zubiaren amaieran dago altxorra: haitzulo txiki batean. Zein da haitzuloaren ikurra?',
      es: 'Al final del puente está el tesoro, en una cueva pequeña. ¿Qué dibujo es la cueva?',
      answer: 1,
      choices: [
        { icon: '🌷', eu: 'Lorea', es: 'La flor' },
        { icon: '🪨', eu: 'Haitzuloa', es: 'La cueva' },
        { icon: '☀️', eu: 'Eguzkia', es: 'El sol' },
      ],
    },
  ],
};

export function TogetherQuest({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const roundClues = clues[level];
  const [step, setStep] = useState(-1);
  const [mistake, setMistake] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [message, setMessage] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const es = lang === 'es';
  const clue = roundClues[Math.max(0, step)];

  const choose = (index: number) => {
    if (advancing) return;
    if (index !== clue.answer) {
      setMistake(true);
      setMessage(es ? '¡Casi! Leed la pista otra vez y decididlo juntas.' : 'Ia-ia! Irakurri pista berriro eta erabaki elkarrekin.');
      return;
    }

    const score = correct + (mistake ? 0 : 1);
    setAdvancing(true);
    setMessage(es ? '¡Buen trabajo en equipo! Encontrasteis la pista. ✨' : 'Talde lan bikaina! Pista aurkitu duzue. ✨');
    window.setTimeout(() => {
      const next = step + 1;
      if (next === roundClues.length) {
        onComplete({ game: 'teamQuest', score, correct: score, total: roundClues.length, stars: calculateStars(score, roundClues.length) });
      } else {
        setCorrect(score);
        setStep(next);
        setMistake(false);
        setAdvancing(false);
        setMessage('');
      }
    }, 550);
  };

  if (step === -1) {
    return <section className="game-shell intro-panel">
      <span className="museum-big">🗺️</span>
      <p className="eyebrow">🤝 {es ? 'AVENTURA EN EQUIPO' : 'TALDE ABENTURA'}</p>
      <h2>{es ? 'El mapa del tesoro' : 'Altxorraren mapa'}</h2>
      <p>{es ? 'Leed cada pista juntas y elegid el lugar correcto. No hay prisa: podéis hablarlo y probar otra vez.' : 'Irakurri pista bakoitza elkarrekin eta aukeratu leku zuzena. Ez dago presarik: hitz egin eta saiatu berriro.'}</p>
      <p className="game-note">{es ? 'Por turnos: una lee la pista y la otra elige; luego intercambiad los papeles.' : 'Txandaka: batek pista irakurri eta besteak aukeratu; gero, aldatu rolak.'}</p>
      <button className="primary" onClick={() => setStep(0)}>{es ? 'Empezar aventura' : 'Abentura hasi'} →</button>
    </section>;
  }

  return <section className="game-shell">
    <div className="game-top">
      <div><span className="eyebrow">🗺️ {es ? 'EL MAPA DEL TESORO' : 'ALTXORRAREN MAPA'}</span><h2>{es ? 'Buscad la siguiente pista' : 'Bilatu hurrengo pista'}</h2></div>
      <span className="counter">{step + 1} / {roundClues.length}</span>
    </div>
    <p className="turn-pill">🤝 {es ? 'Pista compartida' : 'Partekatutako pista'}</p>
    <div className="question-card">
      <p className="visual" aria-hidden="true">{step === roundClues.length - 1 ? '🎁' : '🧭'}</p>
      <h3>{es ? clue.es : clue.eu}</h3>
      <div className="answers">
        {clue.choices.map((choice, index) => <button className="answer" key={`${step}-${choice.icon}`} onClick={() => choose(index)} disabled={advancing}>
          <span aria-hidden="true">{choice.icon}</span><br />{es ? choice.es : choice.eu}
        </button>)}
      </div>
      {message && <p role="status" className={mistake ? 'gentle-feedback' : 'good-feedback'}>{message}</p>}
    </div>
    <p className="game-note">{es ? 'El objetivo es encontrarlo juntas, no hacerlo deprisa.' : 'Helburua elkarrekin aurkitzea da, ez azkar egitea.'}</p>
  </section>;
}
