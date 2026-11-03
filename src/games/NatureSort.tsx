import { useState } from 'react';
import type { GameResult, Language, SchoolLevel } from '../types';
import { calculateStars, shuffle } from '../utils/gameLogic';

type Choice = { icon: string; label: string };
type Round = { picture: string; prompt: string; hint: string; choices: Choice[]; answer: number };

const roundsFor = (lang: Language, level: SchoolLevel): Round[] => {
  const eu = lang === 'eu';
  const round = (picture: string, prompt: string, hint: string, choices: Choice[], answer: number): Round => ({ picture, prompt, hint, choices, answer });

  if (level === 'lh1') return [
    round('🐸 💧', eu ? 'Non bizi da igela normalean?' : '¿Dónde suele vivir una rana?', eu ? 'Pentsatu non dagoen ura.' : 'Piensa dónde hay agua.', [
      { icon: '🌊', label: eu ? 'Urmael batean' : 'En un estanque' }, { icon: '🏜️', label: eu ? 'Basamortuan' : 'En el desierto' }, { icon: '🏠', label: eu ? 'Etxe batean' : 'En una casa' },
    ], 0),
    round('🪴', eu ? 'Zer eman diezaiokegu lur lehorra duen landare bati?' : '¿Qué podemos darle a una planta con la tierra seca?', eu ? 'Landareak edan egiten du.' : 'Las plantas también necesitan beber.', [
      { icon: '💧', label: eu ? 'Ura' : 'Agua' }, { icon: '🧸', label: eu ? 'Jostailu bat' : 'Un juguete' }, { icon: '🪨', label: eu ? 'Harri bat' : 'Una piedra' },
    ], 0),
    round('♻️', eu ? 'Zein gauza dago paperez eginda?' : '¿Qué objeto está hecho de papel?', eu ? 'Erantzunean orriak ditu.' : 'La respuesta tiene hojas para escribir.', [
      { icon: '🥫', label: eu ? 'Lata bat' : 'Una lata' }, { icon: '📓', label: eu ? 'Koaderno bat' : 'Un cuaderno' }, { icon: '🍾', label: eu ? 'Beirazko botila bat' : 'Una botella de vidrio' },
    ], 1),
    round('🍂', eu ? 'Zein urtarotan erortzen dira hosto asko?' : '¿En qué estación caen muchas hojas de los árboles?', eu ? 'Hostoak laranja eta marroi bihurtzen dira.' : 'Las hojas se vuelven naranjas y marrones.', [
      { icon: '❄️', label: eu ? 'Neguan' : 'En invierno' }, { icon: '☀️', label: eu ? 'Udan' : 'En verano' }, { icon: '🍁', label: eu ? 'Udazkenean' : 'En otoño' },
    ], 2),
    round('🌱 ☀️', eu ? 'Zerk laguntzen die landareei hazten?' : '¿Qué ayuda a las plantas a crecer?', eu ? 'Egunez zeruan dago.' : 'Durante el día está en el cielo.', [
      { icon: '🧢', label: eu ? 'Txano batek' : 'Una gorra' }, { icon: '☀️', label: eu ? 'Eguzkiak' : 'El sol' }, { icon: '🚗', label: eu ? 'Auto batek' : 'Un coche' },
    ], 1),
  ];

  return [
    round('🐸 🥚 💧', eu ? 'Igela arrautzak erruteko eta hazteko toki bat bilatzen ari da. Zein da egokiena?' : 'Una rana busca un lugar para poner sus huevos y crecer. ¿Cuál le viene mejor?', eu ? 'Arrautzak uretan egoten dira.' : 'Los huevos de rana se desarrollan en el agua.', [
      { icon: '🏜️', label: eu ? 'Harea lehorra' : 'Arena seca' }, { icon: '🪷', label: eu ? 'Urmaela' : 'Un estanque' }, { icon: '🏔️', label: eu ? 'Mendi tontorra' : 'Una cima nevada' },
    ], 1),
    round('♻️ 📚', eu ? 'Birziklatzeko, zein gauza doa paperaren eta kartoiaren sailera?' : 'Para reciclar, ¿qué objeto va con el papel y el cartón?', eu ? 'Begiratu zeinek dituen orriak.' : 'Fíjate en cuál tiene páginas.', [
      { icon: '🥫', label: eu ? 'Edari-lata' : 'Lata de bebida' }, { icon: '📚', label: eu ? 'Liburu zaharra' : 'Libro viejo' }, { icon: '🍾', label: eu ? 'Beirazko botila' : 'Botella de vidrio' },
    ], 1),
    round('🐝 🌼', eu ? 'Erleek loreak bisitatzen dituzte. Zerk laguntzen die loreei haziak sortzen?' : 'Las abejas visitan flores. ¿Qué ayuda a las flores a formar semillas?', eu ? 'Erleek polena lore batetik bestera eramaten dute.' : 'Las abejas llevan polen de una flor a otra.', [
      { icon: '🌬️', label: eu ? 'Polena zabaltzen laguntzen dute' : 'Ayudan a transportar el polen' }, { icon: '🌑', label: eu ? 'Lorea itzaltzen dute' : 'Apagan la flor' }, { icon: '🧊', label: eu ? 'Lorea izozten dute' : 'Congelan la flor' },
    ], 0),
    round('🌵 ☀️', eu ? 'Kaktusak leku lehorretan bizi daitezke. Zerk laguntzen die?' : 'Los cactus pueden vivir en lugares secos. ¿Qué les ayuda?', eu ? 'Kaktusek ura gorde dezakete.' : 'Los cactus pueden guardar agua.', [
      { icon: '🐟', label: eu ? 'Uretan igeri egiten dute' : 'Nadan bajo el agua' }, { icon: '💧', label: eu ? 'Ura gordetzen dute' : 'Almacenan agua' }, { icon: '🪶', label: eu ? 'Hegoak hazten zaizkie' : 'Les crecen alas' },
    ], 1),
    round('🍂 🌳', eu ? 'Uda amaitu ondoren, egunak freskatzen dira eta hostoak erortzen dira. Zein urtaro dator?' : 'Tras el verano refresca y caen las hojas. ¿Qué estación llega?', eu ? 'Negua baino lehen dator.' : 'Va antes del invierno.', [
      { icon: '🌸', label: eu ? 'Udaberria' : 'La primavera' }, { icon: '🍁', label: eu ? 'Udazkena' : 'El otoño' }, { icon: '❄️', label: eu ? 'Negua' : 'El invierno' },
    ], 1),
  ];
};

export function NatureSort({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const [rounds] = useState(() => roundsFor(lang, level).map((item) => {
    const choices = shuffle(item.choices);
    return { ...item, choices, answer: choices.findIndex((choice) => choice.label === item.choices[item.answer].label) };
  }));
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [message, setMessage] = useState('');
  const current = rounds[step];
  const eu = lang === 'eu';

  const choose = (index: number) => {
    if (advancing) return;
    if (index !== current.answer) {
      setMistake(true);
      setMessage(`${eu ? 'Saiatu berriro!' : '¡Prueba otra vez!'} ${current.hint}`);
      return;
    }
    setAdvancing(true);
    const score = correct + (mistake ? 0 : 1);
    setMessage(eu ? 'Bai! Naturaren laguna zara. 🌱' : '¡Muy bien! Cuidas la naturaleza. 🌱');
    window.setTimeout(() => {
      if (step + 1 === rounds.length) {
        onComplete({ game: 'science', score, correct: score, total: rounds.length, stars: calculateStars(score, rounds.length) });
      } else {
        setCorrect(score);
        setStep(step + 1);
        setMistake(false);
        setAdvancing(false);
        setMessage('');
      }
    }, 450);
  };

  return <section className="game-shell learning-game nature-game">
    <div className="game-top"><div>
      <span className="eyebrow">🌿 {eu ? 'NATURAREN ESPLORATZAILEAK' : 'EXPLORADORES DE LA NATURALEZA'} · {level.toUpperCase()}</span>
      <h2>{eu ? 'Aztertu natura!' : '¡Explora la naturaleza!'}</h2>
      <p>{eu ? 'Animaliak, landareak eta gure ingurua ezagutuko ditugu.' : 'Descubre animales, plantas y nuestro entorno.'}</p>
    </div><span className="counter">{step + 1} / {rounds.length}</span></div>
    <div className="question-card">
      <div className="visual" aria-hidden="true">{current.picture}</div>
      <h3>{current.prompt}</h3>
      <div className="answers">{current.choices.map((choice, index) => <button className="answer" key={`${choice.label}-${index}`} onClick={() => choose(index)} disabled={advancing}><span aria-hidden="true">{choice.icon}</span><br />{choice.label}</button>)}</div>
      {message && <p role="status" className={mistake ? 'gentle-feedback' : 'good-feedback'}>{message}</p>}
    </div>
    <p className="game-note">{eu ? 'Ez dago presarik. Saiatu eta ikasi!' : 'Sin prisa. ¡Prueba y aprende!'}</p>
  </section>;
}
