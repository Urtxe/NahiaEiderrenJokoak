import { useState } from 'react';
import type { GameResult, Language, SchoolLevel } from '../types';
import { calculateStars, shuffle } from '../utils/gameLogic';

type StoryCard = { icon: string; eu: string; es: string };
type Story = { eu: string; es: string; cards: StoryCard[] };

const story = (eu: string, es: string, cards: [string, string, string][]): Story => ({
  eu, es, cards: cards.map(([icon, eu, es]) => ({ icon, eu, es })),
});

const stories: Record<SchoolLevel, Story[]> = {
  lh1: [
    story('Lore bat hazten da', 'Crece una flor', [
      ['🪴', 'Loreontzian lurra jartzen dugu.', 'Ponemos tierra en la maceta.'],
      ['🌰', 'Hazia lurrean sartzen dugu.', 'Enterramos la semilla.'],
      ['💧', 'Hazia ureztatzen dugu.', 'Regamos la semilla.'],
      ['🌼', 'Handik egun batzuetara, lorea ateratzen da.', 'Días después, sale la flor.'],
    ]),
    story('Etxetik eskolara', 'De casa al cole', [
      ['⏰', 'Iratzargailuak jo du; jaiki naiz.', 'Suena el despertador y me levanto.'],
      ['👕', 'Pijama kendu eta jantzi naiz.', 'Me quito el pijama y me visto.'],
      ['🎒', 'Motxila hartu eta etxetik atera naiz.', 'Cojo la mochila y salgo de casa.'],
      ['🏫', 'Eskolara iritsi naiz.', 'Llego al cole.'],
    ]),
    story('Ekaitza', 'Una tormenta', [
      ['☁️', 'Hodei ilunak hurbiltzen dira.', 'Se acercan nubes oscuras.'],
      ['💧', 'Lehen tantak erortzen dira.', 'Caen las primeras gotas.'],
      ['☔', 'Euria ari du eta aterkia irekitzen dut.', 'Llueve y abro el paraguas.'],
      ['🌈', 'Euria gelditzen da eta ortzadarra agertzen da.', 'Para la lluvia y sale el arcoíris.'],
    ]),
    story('Ogi txigortua', 'La tostada', [
      ['🍞', 'Ogi xerra bat hartzen dut.', 'Cojo una rebanada de pan.'],
      ['♨️', 'Ogia txigortzen dut.', 'Tuesto la rebanada.'],
      ['🍓', 'Ogi txigortuan marmelada jartzen dut.', 'Unto mermelada en la tostada.'],
      ['😋', 'Prest dagoen tostada jaten dut.', 'Me como la tostada preparada.'],
    ]),
    story('Gutuna', 'La carta', [
      ['✏️', 'Mezua paperean idazten dut.', 'Escribo el mensaje en un papel.'],
      ['✉️', 'Papera gutun-azalean sartzen dut.', 'Meto el papel en el sobre.'],
      ['📮', 'Gutuna postontzira botatzen dut.', 'Echo la carta al buzón.'],
      ['📖', 'Lagunak gutuna jasotzen eta irakurtzen du.', 'Mi amiga recibe y lee la carta.'],
    ]),
    story('Paperezko hegazkina', 'El avión de papel', [
      ['📄', 'Paper orri bat hartzen dut.', 'Cojo una hoja de papel.'],
      ['📐', 'Papera tolestu eta hegoak egiten ditut.', 'Doblo el papel y hago las alas.'],
      ['✈️', 'Hegazkina airera jaurtitzen dut.', 'Lanzo el avión al aire.'],
      ['🖐️', 'Lurrera erori den hegazkina jasotzen dut.', 'Recojo el avión cuando cae al suelo.'],
    ]),
  ],
  lh3: [
    story('Tximeletaren bidaia', 'El viaje de la mariposa', [
      ['🥚', 'Tximeletak arrautzak uzten ditu hosto batean.', 'La mariposa pone huevos en una hoja.'],
      ['🐛', 'Arrautzatik beldarra ateratzen da.', 'Del huevo sale una oruga.'],
      ['🍃', 'Beldarrak hostoak jan eta hazi egiten da.', 'La oruga come hojas y crece.'],
      ['🫛', 'Beldarra krisalida bihurtzen da.', 'La oruga forma una crisálida.'],
      ['🦋', 'Krisalidatik tximeleta ateratzen da.', 'De la crisálida sale una mariposa.'],
    ]),
    story('Gurpil zulatu bat', 'Una rueda pinchada', [
      ['🚲', 'Bizikletaren gurpilak airea galdu duela ikusten dut.', 'Veo que la rueda de la bici ha perdido aire.'],
      ['🔧', 'Heldu baten laguntzaz, gurpila kendu dugu.', 'Con ayuda, desmontamos la rueda.'],
      ['🩹', 'Zuloa aurkitu eta adabaki bat jartzen dugu.', 'Encontramos el agujero y ponemos un parche.'],
      ['💨', 'Gurpila berriz jarri eta puzten dugu.', 'Montamos e hinchamos la rueda.'],
      ['🚴', 'Konpondutako bizikleta probatzen dut.', 'Pruebo la bici reparada.'],
    ]),
    story('Liburutegiko mailegua', 'Un préstamo de la biblioteca', [
      ['🔎', 'Katalogoan liburu bat bilatzen dut.', 'Busco un libro en el catálogo.'],
      ['📚', 'Apalean aurkitu eta hartzen dut.', 'Lo encuentro y lo cojo de la estantería.'],
      ['🪪', 'Txartela erakutsi eta liburua maileguan hartzen dut.', 'Enseño el carné y me llevo el libro prestado.'],
      ['📖', 'Etxean irakurtzen dut.', 'Lo leo en casa.'],
      ['↩️', 'Liburua liburutegira itzultzen dut.', 'Devuelvo el libro a la biblioteca.'],
    ]),
    story('Erakusketa bat', 'Una exposición', [
      ['💭', 'Erakusketarako gaia aukeratzen dugu.', 'Elegimos el tema de la exposición.'],
      ['✏️', 'Gai horri buruzko marrazkiak egiten ditugu.', 'Hacemos dibujos sobre el tema.'],
      ['🏷️', 'Marrazki bakoitzari izenburua jartzen diogu.', 'Ponemos un título a cada dibujo.'],
      ['🖼️', 'Lanak horman zintzilikatzen ditugu.', 'Colgamos los trabajos en la pared.'],
      ['👋', 'Bisitariak sartzen dira lanak ikustera.', 'Entran las visitas a ver los trabajos.'],
    ]),
    story('Ogia egiten', 'Hacemos pan', [
      ['🥣', 'Irina, ura eta legamia nahasten ditugu.', 'Mezclamos harina, agua y levadura.'],
      ['🤲', 'Nahasketa oratzen dugu.', 'Amasamos la mezcla.'],
      ['⏳', 'Orea hazten uzten dugu.', 'Dejamos que la masa suba.'],
      ['🔥', 'Orea labean egosten dugu.', 'Cocemos la masa en el horno.'],
      ['🥖', 'Ogia hoztu eta zatitzen dugu.', 'Dejamos enfriar el pan y lo cortamos.'],
    ]),
    story('Mendiko argazkia', 'La foto en la montaña', [
      ['🗺️', 'Mapan ibilbidea aukeratzen dugu.', 'Elegimos una ruta en el mapa.'],
      ['🎒', 'Ibilbiderako motxila prestatzen dugu.', 'Preparamos la mochila para la ruta.'],
      ['🥾', 'Bidezidorretik gora igotzen gara.', 'Subimos por el sendero.'],
      ['📷', 'Tontorrean argazkia egiten dugu.', 'Hacemos una foto en la cima.'],
      ['🏠', 'Etxera itzuli eta argazkia erakusten dugu.', 'Volvemos a casa y enseñamos la foto.'],
    ]),
  ],
};

const label = (lang: Language, eu: string, es: string) => lang === 'eu' ? eu : es;

function makeRounds(level: SchoolLevel) {
  return shuffle(stories[level]).slice(0, 4).map(story => {
    const choices = shuffle(story.cards.map((_, index) => index));
    if (choices.every((card, index) => card === index)) choices.push(choices.shift()!);
    return { story, choices };
  });
}

export function StoryOrder({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const [rounds] = useState(() => makeRounds(level));
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [message, setMessage] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const total = rounds.length;
  const { story, choices } = rounds[round];

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
            <small>{lang === 'eu' ? card.eu : card.es}</small>
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
