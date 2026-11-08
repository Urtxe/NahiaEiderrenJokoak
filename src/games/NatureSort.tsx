import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { GameResult, Language, SchoolLevel } from '../types';
import { calculateStars, shuffle } from '../utils/gameLogic';

type Choice = { icon: string; label: string };
type Round = { picture: string; prompt: string; hint: string; choices: Choice[]; answer: number };

const roundsFor = (lang: Language, level: SchoolLevel): Round[] => {
  const eu = lang === 'eu';
  const round = (picture: string, prompt: string, hint: string, choices: [Choice, Choice, Choice, Choice], answer: number): Round => ({ picture, prompt, hint, choices, answer });

  if (level === 'lh1') return [
    round('🐸', eu ? 'Non bizi da igela normalean?' : '¿Dónde suele vivir una rana?', eu ? 'Pentsatu non dagoen ura.' : 'Piensa dónde hay agua.', [
      { icon: '🌊', label: eu ? 'Urmael batean' : 'En un estanque' }, { icon: '🏜️', label: eu ? 'Basamortuan' : 'En el desierto' }, { icon: '🏠', label: eu ? 'Etxe batean' : 'En una casa' }, { icon: '🏔️', label: eu ? 'Mendi tontorrean' : 'En una cima' },
    ], 0),
    round('🪴', eu ? 'Zer eman diezaiokegu lur lehorra duen landare bati?' : '¿Qué podemos darle a una planta con la tierra seca?', eu ? 'Landareak edan egiten du.' : 'Las plantas también necesitan beber.', [
      { icon: '💧', label: eu ? 'Ura' : 'Agua' }, { icon: '🧸', label: eu ? 'Jostailu bat' : 'Un juguete' }, { icon: '🪨', label: eu ? 'Harri bat' : 'Una piedra' }, { icon: '🧂', label: eu ? 'Gatza' : 'Sal' },
    ], 0),
    round('♻️', eu ? 'Zein gauza dago paperez eginda?' : '¿Qué objeto está hecho de papel?', eu ? 'Erantzunean orriak ditu.' : 'La respuesta tiene hojas para escribir.', [
      { icon: '🥫', label: eu ? 'Lata bat' : 'Una lata' }, { icon: '📓', label: eu ? 'Koaderno bat' : 'Un cuaderno' }, { icon: '🍾', label: eu ? 'Beirazko botila bat' : 'Una botella de vidrio' }, { icon: '🥄', label: eu ? 'Metalezko koilara bat' : 'Una cuchara de metal' },
    ], 1),
    round('🍂', eu ? 'Zein urtarotan erortzen dira hosto asko?' : '¿En qué estación caen muchas hojas de los árboles?', eu ? 'Hostoak laranja eta marroi bihurtzen dira.' : 'Las hojas se vuelven naranjas y marrones.', [
      { icon: '❄️', label: eu ? 'Neguan' : 'En invierno' }, { icon: '☀️', label: eu ? 'Udan' : 'En verano' }, { icon: '🍁', label: eu ? 'Udazkenean' : 'En otoño' }, { icon: '🌷', label: eu ? 'Udaberrian' : 'En primavera' },
    ], 2),
    round('🌱', eu ? 'Zerk laguntzen die landareei hazten?' : '¿Qué ayuda a las plantas a crecer?', eu ? 'Egunez zeruan dago.' : 'Durante el día está en el cielo.', [
      { icon: '🧢', label: eu ? 'Txano batek' : 'Una gorra' }, { icon: '☀️', label: eu ? 'Eguzkiak' : 'El sol' }, { icon: '🚗', label: eu ? 'Auto batek' : 'Un coche' }, { icon: '🎈', label: eu ? 'Puxika batek' : 'Un globo' },
    ], 1),
    round('🐦', eu ? 'Zein materialekin egin dezake txoriak habia?' : '¿Con qué puede hacer un nido un pájaro?', eu ? 'Zuhaitzetik jasotako gauza arin bat da.' : 'Es algo ligero que puede recoger de un árbol.', [
      { icon: '🧱', label: eu ? 'Adreiluekin' : 'Con ladrillos' }, { icon: '🌿', label: eu ? 'Adaxkekin' : 'Con ramitas' },
      { icon: '🧊', label: eu ? 'Izotzarekin' : 'Con hielo' }, { icon: '🥄', label: eu ? 'Koilarekin' : 'Con cucharas' },
    ], 1),
    round('🐛', eu ? 'Zein animalia atera daiteke krisalidatik?' : '¿Qué animal puede salir de una crisálida?', eu ? 'Beldarra aldatu egiten da eta hegoak ditu.' : 'La oruga se transforma y acaba teniendo alas.', [
      { icon: '🐸', label: eu ? 'Igela' : 'La rana' }, { icon: '🐟', label: eu ? 'Arraina' : 'El pez' },
      { icon: '🦋', label: eu ? 'Tximeleta' : 'La mariposa' }, { icon: '🐇', label: eu ? 'Untxia' : 'El conejo' },
    ], 2),
    round('🌨️', eu ? 'Zer gertatzen zaio elurrari leku epel batean?' : '¿Qué le pasa a la nieve en un sitio templado?', eu ? 'Izotzari gauza bera gertatzen zaio.' : 'Al hielo le ocurre lo mismo.', [
      { icon: '💧', label: eu ? 'Urtu egiten da' : 'Se derrite' }, { icon: '🌱', label: eu ? 'Hazi egiten da' : 'Crece' },
      { icon: '🪨', label: eu ? 'Harri bihurtzen da' : 'Se vuelve piedra' }, { icon: '🔥', label: eu ? 'Su hartzen du' : 'Se enciende' },
    ], 0),
  ];

  return [
    round('🐸 🥚', eu ? 'Igela arrautzak erruteko eta hazteko toki bat bilatzen ari da. Zein da egokiena?' : 'Una rana busca un lugar para poner sus huevos y crecer. ¿Cuál le viene mejor?', eu ? 'Arrautzak uretan egoten dira.' : 'Los huevos de rana se desarrollan en el agua.', [
      { icon: '🏜️', label: eu ? 'Harea lehorra' : 'Arena seca' }, { icon: '🪷', label: eu ? 'Urmaela' : 'Un estanque' }, { icon: '🏔️', label: eu ? 'Mendi tontorra' : 'Una cima nevada' }, { icon: '🪨', label: eu ? 'Harri lehorren artea' : 'Entre piedras secas' },
    ], 1),
    round('♻️', eu ? 'Birziklatzeko, zein gauza doa paperaren eta kartoiaren sailera?' : 'Para reciclar, ¿qué objeto va con el papel y el cartón?', eu ? 'Begiratu zeinek dituen orriak.' : 'Fíjate en cuál tiene páginas.', [
      { icon: '🥫', label: eu ? 'Edari-lata' : 'Lata de bebida' }, { icon: '📚', label: eu ? 'Liburu zaharra' : 'Libro viejo' }, { icon: '🍾', label: eu ? 'Beirazko botila' : 'Botella de vidrio' }, { icon: '🥣', label: eu ? 'Zeramikazko katilua' : 'Cuenco de cerámica' },
    ], 1),
    round('🐝 🌼', eu ? 'Erleek loreak bisitatzen dituzte. Zerk laguntzen die loreei haziak sortzen?' : 'Las abejas visitan flores. ¿Qué ayuda a las flores a formar semillas?', eu ? 'Erleek polena lore batetik bestera eramaten dute.' : 'Las abejas llevan polen de una flor a otra.', [
      { icon: '🌬️', label: eu ? 'Polena zabaltzen laguntzen dute' : 'Ayudan a transportar el polen' }, { icon: '🌑', label: eu ? 'Lorea itzaltzen dute' : 'Apagan la flor' }, { icon: '🧊', label: eu ? 'Lorea izozten dute' : 'Congelan la flor' }, { icon: '✂️', label: eu ? 'Petaloak mozten dituzte' : 'Cortan los pétalos' },
    ], 0),
    round('🌵 ☀️', eu ? 'Kaktusak leku lehorretan bizi daitezke. Zerk laguntzen die?' : 'Los cactus pueden vivir en lugares secos. ¿Qué les ayuda?', eu ? 'Kaktusek ura gorde dezakete.' : 'Los cactus pueden guardar agua.', [
      { icon: '🐟', label: eu ? 'Uretan igeri egiten dute' : 'Nadan bajo el agua' }, { icon: '💧', label: eu ? 'Ura gordetzen dute' : 'Almacenan agua' }, { icon: '🪶', label: eu ? 'Hegoak hazten zaizkie' : 'Les crecen alas' }, { icon: '❄️', label: eu ? 'Elurra sortzen dute' : 'Producen nieve' },
    ], 1),
    round('🍂 🌳', eu ? 'Uda amaitu ondoren, egunak freskatzen dira eta hostoak erortzen dira. Zein urtaro dator?' : 'Tras el verano refresca y caen las hojas. ¿Qué estación llega?', eu ? 'Negua baino lehen dator.' : 'Va antes del invierno.', [
      { icon: '🌸', label: eu ? 'Udaberria' : 'La primavera' }, { icon: '🍁', label: eu ? 'Udazkena' : 'El otoño' }, { icon: '❄️', label: eu ? 'Negua' : 'El invierno' }, { icon: '☀️', label: eu ? 'Uda' : 'El verano' },
    ], 1),
    round('🌧️', eu ? 'Lur maldatsu batean euria ari du. Zerk lagun dezake lurra bere lekuan mantentzen?' : 'Llueve en una ladera. ¿Qué ayuda a mantener la tierra en su sitio?', eu ? 'Landareen zati bat lur azpian dago.' : 'Una parte de las plantas queda bajo tierra.', [
      { icon: '🌱', label: eu ? 'Landareen sustraiek' : 'Las raíces de las plantas' }, { icon: '🍂', label: eu ? 'Hosto solteek' : 'Las hojas sueltas' },
      { icon: '☀️', label: eu ? 'Eguzkiak' : 'El sol' }, { icon: '🌬️', label: eu ? 'Haizeak' : 'El viento' },
    ], 0),
    round('🧊', eu ? 'Izotza urtu denean, zer egoeratan dago ura?' : 'Cuando se derrite el hielo, ¿en qué estado queda el agua?', eu ? 'Edalontzi batean isuri dezakezu.' : 'Puedes verterla en un vaso.', [
      { icon: '🪨', label: eu ? 'Solidoan' : 'Sólido' }, { icon: '💧', label: eu ? 'Likidoan' : 'Líquido' },
      { icon: '💨', label: eu ? 'Gasean' : 'Gaseoso' }, { icon: '🧂', label: eu ? 'Hauts gisa' : 'En polvo' },
    ], 1),
    round('🐟', eu ? 'Zer erabiltzen du arrain batek uretan arnasteko?' : '¿Qué usa un pez para respirar bajo el agua?', eu ? 'Buruaren alboetan daude.' : 'Están a los lados de la cabeza.', [
      { icon: '🫁', label: eu ? 'Birikak' : 'Los pulmones' }, { icon: '👀', label: eu ? 'Begiak' : 'Los ojos' },
      { icon: '🐟', label: eu ? 'Zakatzak' : 'Las branquias' }, { icon: '🦷', label: eu ? 'Hortzak' : 'Los dientes' },
    ], 2),
  ];
};

export function NatureSort({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const [rounds] = useState(() => shuffle(roundsFor(lang, level)).slice(0, 5).map((item) => {
    const choices = shuffle(item.choices);
    return { ...item, choices, answer: choices.findIndex((choice) => choice.label === item.choices[item.answer].label) };
  }));
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistake, setMistake] = useState(false);
  const current = rounds[step];
  const eu = lang === 'eu';

  const choose = (index: number) => {
    if (advancing) return;
    if (index !== current.answer) {
      setMistake(true);
      showFeedback(false, current.hint);
      return;
    }
    const score = correct + (mistake ? 0 : 1);
    showFeedback(true, undefined, () => {
      if (step + 1 === rounds.length) {
        onComplete({ game: 'science', score, correct: score, total: rounds.length, stars: calculateStars(score, rounds.length) });
      } else {
        setCorrect(score);
        setStep(step + 1);
        setMistake(false);
      }
    });
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
    </div>
    <p className="game-note">{eu ? 'Ez dago presarik. Saiatu eta ikasi!' : 'Sin prisa. ¡Prueba y aprende!'}</p>
  </section>;
}
