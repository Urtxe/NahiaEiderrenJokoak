import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { useExerciseRound } from '../hooks/useExerciseRound';
import { answerChoices, calculateStars, pickExercises } from '../utils/gameLogic';

const place = (icon: string, eu: string, es: string) => ({ icon, eu, es });
const places = {
  bridge: place('🌉', 'Zubia', 'El puente'),
  cave: place('🪨', 'Haitzuloa', 'La cueva'),
  forest: place('🌲', 'Basoa', 'El bosque'),
  fountain: place('⛲', 'Iturria', 'La fuente'),
  garden: place('🌷', 'Lorategia', 'El jardín'),
  lake: place('🏞️', 'Aintzira', 'El lago'),
  library: place('📚', 'Liburutegia', 'La biblioteca'),
  lighthouse: place('🗼', 'Itsasargia', 'El faro'),
  mountain: place('⛰️', 'Mendia', 'La montaña'),
  orchard: place('🍎', 'Sagastia', 'El manzanal'),
  park: place('🛝', 'Parkea', 'El parque'),
  school: place('🏫', 'Eskola', 'El colegio'),
  shore: place('🏖️', 'Hondartza', 'La playa'),
  station: place('🚉', 'Geltokia', 'La estación'),
  tunnel: place('🚇', 'Tunela', 'El túnel'),
  well: place('🪣', 'Putzua', 'El pozo'),
  bakery: place('🥖', 'Okindegia', 'La panadería'),
  harbour: place('⚓', 'Portua', 'El puerto'),
  greenhouse: place('🌿', 'Negutegia', 'El invernadero'),
  museum: place('🏛️', 'Museoa', 'El museo'),
};

type Place = keyof typeof places;
const clue = (eu: string, es: string, ...places: [Place, Place, Place, Place]) => ({ eu, es, places });

const clues: Record<SchoolLevel, ReturnType<typeof clue>[]> = {
  lh1: [
    clue('Erreka zeharkatu behar dugu oinak busti gabe. Zerk lotzen ditu bi ertzak?', 'Tenemos que cruzar el arroyo sin mojarnos. ¿Qué une las dos orillas?', 'bridge', 'lake', 'shore', 'fountain'),
    clue('Aterpea aurkitu dugu harkaitzaren barruan. Non bilatuko dugu pista?', 'Hemos encontrado un refugio dentro de la roca. ¿Dónde buscamos la pista?', 'cave', 'forest', 'mountain', 'tunnel'),
    clue('Pista adarrez eta itzalez betetako leku batean dago. Non dago?', 'La pista está en un lugar lleno de ramas y sombra. ¿Dónde está?', 'forest', 'lake', 'shore', 'mountain'),
    clue('Kulunkak eta txirrista bat ikusten ditugu. Non gaude?', 'Vemos unos columpios y un tobogán. ¿Dónde estamos?', 'park', 'garden', 'forest', 'station'),
    clue('Ipuin bat etxera eraman eta gero itzuli nahi dugu. Nora joango gara?', 'Queremos llevarnos un cuento a casa y devolverlo después. ¿Adónde vamos?', 'library', 'station', 'school', 'park'),
    clue('Olatuek oinak bustitzen dizkigute hondarrean. Non dago pista?', 'Las olas nos mojan los pies sobre la arena. ¿Dónde está la pista?', 'shore', 'bridge', 'cave', 'mountain'),
    clue('Trena hartu behar dugu. Non itxarongo dugu?', 'Tenemos que coger el tren. ¿Dónde esperamos?', 'station', 'school', 'park', 'library'),
    clue('Ogi beroaren usaina dator. Non erosi dezakegu ogia?', 'Huele a pan recién hecho. ¿Dónde podemos comprarlo?', 'bakery', 'orchard', 'library', 'station'),
    clue('Aulki eta mahai txikiak daude, eta irakaslea arbelaren ondoan dago. Non gaude?', 'Hay sillas y mesas pequeñas, y la profe está junto a la pizarra. ¿Dónde estamos?', 'school', 'museum', 'station', 'garden'),
  ],
  lh3: [
    clue('Bi ertzen artean dago pista. Oinez joan gaitezke eta ura azpitik doa.', 'La pista está entre dos orillas. Podemos pasar a pie y el agua queda por debajo.', 'bridge', 'tunnel', 'shore', 'fountain'),
    clue('Kostaldean dago, baina ez hondarrean. Gauez itsasontziei bidea erakusten die.', 'Está en la costa. Su luz guía a los barcos de noche. ¿Qué lugar es?', 'lighthouse', 'shore', 'bridge', 'station'),
    clue('Ura beherantz bilatu behar dugu. Ontzi bat sokaz jaitsiko dugu.', 'Buscamos agua debajo de nuestros pies. Bajaremos un cubo con una cuerda.', 'well', 'fountain', 'lake', 'cave'),
    clue('Mendiaren beste aldera joango gara tontorrera igo gabe. Bidea harkaitzetik pasatzen da.', 'Iremos al otro lado de la montaña sin subir a la cima. El camino pasa por dentro de la roca.', 'tunnel', 'bridge', 'cave', 'forest'),
    clue('Zuhaitzak lerroetan daude. Udazkenean, fruitu biribilak jasotzen dituzte.', 'Los árboles están en filas. En otoño, recogen frutos redondos de sus ramas.', 'orchard', 'forest', 'park', 'garden'),
    clue('Jendea ordutegiari begira dago eta nasan itxaroten du. Non gaude?', 'La gente mira el horario y espera en un andén. ¿Dónde estamos?', 'station', 'school', 'library', 'park'),
    clue('Ura gora ateratzen da eta harrizko ontzi batean erortzen da. Hiriko plazan dago.', 'El agua sale hacia arriba y cae en una pila de piedra. Está en la plaza.', 'fountain', 'well', 'lake', 'shore'),
    clue('Errekaren ura geldi geratu da leku zabal batean. Mendiak inguruan daude, eta itsasoko olaturik ez dago.', 'El agua se queda quieta en un lugar ancho, rodeado de montañas y sin olas de mar.', 'lake', 'shore', 'fountain', 'well'),
    clue('Itsasontziek bidaia amaitu dute. Sokaz lotuta daude, eta arrantzaleek kaxak lehorrera ateratzen dituzte.', 'Los barcos han terminado el viaje. Están amarrados y los pescadores descargan cajas en tierra.', 'harbour', 'lighthouse', 'lake', 'station'),
    clue('Kanpoan izotza dago, baina hemen landareak babestuta daude, horma gardenen artean.', 'Fuera hiela, pero aquí las plantas crecen protegidas entre paredes transparentes.', 'greenhouse', 'cave', 'orchard', 'forest'),
    clue('Objektu zaharrak beirazko erakusleihoetan daude, bakoitza bere azalpenarekin.', 'Los objetos antiguos se guardan en vitrinas, cada uno con su cartel explicativo.', 'museum', 'library', 'bakery', 'school'),
    clue('Aldapa luzea igo dugu. Orain, goitik, inguruko haranak eta herriak ikusten ditugu.', 'Hemos subido una larga cuesta. Desde lo alto vemos los valles y pueblos de alrededor.', 'mountain', 'lake', 'tunnel', 'park'),
  ],
};

export function TogetherQuest({ lang, level, profile, onComplete }: { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (r: GameResult) => void }) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const roundClues = useExerciseRound(`teamQuest:${profile}:${level}`, recent =>
    pickExercises(clues[level], level === 'lh1' ? 3 : 4, recent, clue => clue.eu).map(clue => {
      const [correct, ...wrong] = clue.places.map(id => places[id]);
      const { options, answer } = answerChoices(correct, wrong);
      return { ...clue, choices: options, answer };
    }), round => round.map(clue => clue.eu));
  const [step, setStep] = useState(-1);
  const [mistake, setMistake] = useState(false);
  const [correct, setCorrect] = useState(0);
  const es = lang === 'es';
  const clue = roundClues[Math.max(0, step)];

  const choose = (index: number) => {
    if (advancing) return;
    if (index !== clue.answer) {
      setMistake(true);
      showFeedback(false, es ? 'Leed la pista otra vez y decididlo juntas.' : 'Irakurri pista berriro eta erabaki elkarrekin.');
      return;
    }

    const score = correct + (mistake ? 0 : 1);
    showFeedback(true, es ? 'Encontrasteis la pista.' : 'Pista aurkitu duzue.', () => {
      const next = step + 1;
      if (next === roundClues.length) {
        onComplete({ game: 'teamQuest', score, correct: score, total: roundClues.length, stars: calculateStars(score, roundClues.length) });
      } else {
        setCorrect(score);
        setStep(next);
        setMistake(false);
      }
    });
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
    </div>
    <p className="game-note">{es ? 'El objetivo es encontrarlo juntas, no hacerlo deprisa.' : 'Helburua elkarrekin aurkitzea da, ez azkar egitea.'}</p>
  </section>;
}
