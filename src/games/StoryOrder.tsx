import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { useExerciseRound } from '../hooks/useExerciseRound';
import { calculateStars, pickExercises, shuffle } from '../utils/gameLogic';

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
    story('Hortzak garbitzen', 'Nos lavamos los dientes', [
      ['🪥', 'Hortzetako eskuila hartzen dut.', 'Cojo el cepillo de dientes.'],
      ['🟢', 'Pasta pixka bat jartzen dut eskuilan.', 'Pongo un poco de pasta en el cepillo.'],
      ['😁', 'Hortzak eskuilatzen ditut.', 'Me cepillo los dientes.'],
      ['🚰', 'Eskuila garbitu eta bere lekuan uzten dut.', 'Enjuago el cepillo y lo guardo.'],
    ]),
    story('Elurrezko panpina', 'El muñeco de nieve', [
      ['❄️', 'Elurra eskuekin bildu eta bola bat egiten dut.', 'Junto nieve y hago una bola.'],
      ['⚪', 'Bola lurrean biratzen dut handiagoa izan arte.', 'Ruedo la bola por el suelo hasta que crece.'],
      ['⛄', 'Bola txikiago bat jartzen dut handiaren gainean.', 'Pongo una bola pequeña sobre la grande.'],
      ['🥕', 'Azenario bat jartzen diot sudur gisa.', 'Le pongo una zanahoria de nariz.'],
    ]),
    story('Fruta-mazedonia', 'La macedonia', [
      ['🍎', 'Fruta aukeratzen dut.', 'Elijo la fruta.'],
      ['🚰', 'Fruta garbitzen dut.', 'Lavo la fruta.'],
      ['🥣', 'Fruta zatitu eta katilu batean nahasten dut.', 'Corto la fruta y la mezclo en un bol.'],
      ['🥄', 'Mazedonia koilararekin jaten dut.', 'Me como la macedonia con una cuchara.'],
    ]),
    story('Kometa airean', 'La cometa', [
      ['🧵', 'Haria kometari lotzen diot.', 'Ato el hilo a la cometa.'],
      ['🏃', 'Haizeari begira korrika hasten naiz.', 'Empiezo a correr de cara al viento.'],
      ['🪁', 'Kometak gora egiten du.', 'La cometa sube al cielo.'],
      ['🖐️', 'Bukatzeko, haria bildu eta kometa jaitsi egiten da.', 'Al acabar, recojo el hilo y la cometa baja.'],
    ]),
    story('Puzzlea', 'El puzle', [
      ['📦', 'Puzzlearen kutxa irekitzen dut.', 'Abro la caja del puzle.'],
      ['🧩', 'Piezak mahai gainean zabaltzen ditut.', 'Extiendo las piezas sobre la mesa.'],
      ['🖼️', 'Piezak elkartzen ditut irudia osatu arte.', 'Uno las piezas hasta completar el dibujo.'],
      ['🤩', 'Amaitutako puzzlea erakusten dut.', 'Enseño el puzle terminado.'],
    ]),
    story('Esku garbiak', 'Las manos limpias', [
      ['🚰', 'Eskuak urez bustitzen ditut.', 'Me mojo las manos con agua.'],
      ['🧼', 'Xaboia hartu eta eskuak igurzten ditut.', 'Cojo jabón y me froto las manos.'],
      ['💦', 'Xaboia urarekin kentzen dut.', 'Me aclaro el jabón con agua.'],
      ['🧻', 'Eskuak lehortzen ditut.', 'Me seco las manos.'],
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
    story('Hegaztientzako jantokia', 'El comedero de pájaros', [
      ['🧃', 'Esne-kartoi hutsa garbitzen dugu.', 'Lavamos un cartón de leche vacío.'],
      ['✂️', 'Heldu batek zulo bat egiten dio alboan.', 'Una persona adulta le hace una abertura lateral.'],
      ['🌾', 'Zulotik haziak sartzen ditugu.', 'Echamos semillas por la abertura.'],
      ['🌳', 'Jantokia adar batean zintzilikatzen dugu.', 'Colgamos el comedero en una rama.'],
      ['🐦', 'Urrutitik ikusten dugu txori bat jatera hurbiltzen.', 'Observamos desde lejos cómo se acerca un pájaro a comer.'],
    ]),
    story('Antzerki-eguna', 'El día del teatro', [
      ['📜', 'Antzezlan labur bat aukeratzen dugu.', 'Elegimos una obra corta.'],
      ['🎭', 'Pertsonaiak banatzen ditugu.', 'Repartimos los personajes.'],
      ['🗣️', 'Bakoitzak bere zatia ikasi eta elkarrekin entseatzen dugu.', 'Cada cual aprende su parte y ensayamos en grupo.'],
      ['🎟️', 'Publikoa sartzen da eta antzezlana egiten dugu.', 'Entra el público y representamos la obra.'],
      ['👏', 'Amaieran agurtu egiten dugu, txalo artean.', 'Al terminar, saludamos entre aplausos.'],
    ]),
    story('Motxilaren kremailera', 'La cremallera de la mochila', [
      ['🎒', 'Motxila ixtera noa, baina kremailera trabatu da.', 'Voy a cerrar la mochila, pero la cremallera se ha atascado.'],
      ['🔎', 'Begiratu eta oihal zati bat hortzen artean ikusten dut.', 'Miro y veo que hay tela entre los dientes.'],
      ['↩️', 'Kremailera pixka bat atzerantz mugitzen dut.', 'Muevo la cremallera un poco hacia atrás.'],
      ['🤏', 'Harrapatutako oihala askatzen dut.', 'Saco la tela que estaba atrapada.'],
      ['✅', 'Motxila berriro ixten dut, oraingoan arazorik gabe.', 'Vuelvo a cerrar la mochila, esta vez sin problemas.'],
    ]),
    story('Izozkiak etxean', 'Polos en casa', [
      ['🍊', 'Laranjak estutzen ditugu zukua ateratzeko.', 'Exprimimos las naranjas para sacarles el zumo.'],
      ['🧃', 'Zukua izozki-moldeetara isurtzen dugu.', 'Vertemos el zumo en los moldes.'],
      ['🥄', 'Molde bakoitzari makilatxoa jartzen diogu.', 'Ponemos un palito en cada molde.'],
      ['🧊', 'Moldeak izozkailuan uzten ditugu zukua gogortu arte.', 'Dejamos los moldes en el congelador hasta que se endurece el zumo.'],
      ['🍧', 'Izozkiak moldetik atera eta jaten ditugu.', 'Sacamos los polos de los moldes y los comemos.'],
    ]),
    story('Makilaren itzala', 'La sombra del palo', [
      ['🥢', 'Makila bat tente jartzen dugu leku eguzkitsu batean.', 'Colocamos un palo vertical en un lugar soleado.'],
      ['✏️', 'Goizean itzalaren punta lurrean markatzen dugu.', 'Por la mañana marcamos en el suelo la punta de la sombra.'],
      ['⏳', 'Makila mugitu gabe, ordu batzuk itxaroten dugu.', 'Esperamos unas horas sin mover el palo.'],
      ['📏', 'Eguerdian itzalaren punta berriz markatzen dugu.', 'Al mediodía volvemos a marcar la punta de la sombra.'],
      ['🤔', 'Bi markak alderatzen ditugu itzala nola aldatu den ikusteko.', 'Comparamos las dos marcas para ver cómo ha cambiado la sombra.'],
    ]),
    story('Gelako egunkaria', 'El periódico de clase', [
      ['💡', 'Zeri buruz idatziko dugun erabakitzen dugu.', 'Decidimos sobre qué vamos a escribir.'],
      ['🎤', 'Gaiari buruzko informazioa biltzen dugu.', 'Recogemos información sobre el tema.'],
      ['✍️', 'Informazioarekin albiste bat idazten dugu.', 'Con la información escribimos una noticia.'],
      ['📰', 'Albisteak bildu eta egunkaria inprimatzen dugu.', 'Juntamos las noticias e imprimimos el periódico.'],
      ['📮', 'Aleak ikaskideen artean banatzen ditugu.', 'Repartimos los ejemplares entre la clase.'],
    ]),
  ],
};

const label = (lang: Language, eu: string, es: string) => lang === 'eu' ? eu : es;

function makeRounds(level: SchoolLevel, recent: readonly string[]) {
  return pickExercises(stories[level], 4, recent, story => story.eu).map(story => {
    const choices = shuffle(story.cards.map((_, index) => index));
    if (choices.every((card, index) => card === index)) choices.push(choices.shift()!);
    return { story, choices };
  });
}

export function StoryOrder({ lang, level, profile, onComplete }: { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (r: GameResult) => void }) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const rounds = useExerciseRound(`stories:${profile}:${level}`,
    recent => makeRounds(level, recent), round => round.map(({ story }) => story.eu));
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [mistake, setMistake] = useState(false);
  const total = rounds.length;
  const { story, choices } = rounds[round];

  const choose = (card: number) => {
    if (advancing || sequence.includes(card) || sequence.length >= story.cards.length) return;
    setSequence([...sequence, card]);
  };

  const check = () => {
    if (advancing) return;
    const isCorrect = sequence.every((card, index) => card === index) && sequence.length === story.cards.length;
    if (!isCorrect) {
      setMistake(true);
      setSequence([]);
      showFeedback(false, label(lang, 'Pentsatu zer gertatu den pauso bakoitzean.', 'Piensa qué ocurrió en cada paso.'));
      return;
    }

    const nextCorrect = correct + (mistake ? 0 : 1);
    showFeedback(true, label(lang, 'Istorioa osatu duzu.', 'Has ordenado la historia.'), () => {
      if (round + 1 === total) {
        onComplete({ game: 'stories', score: nextCorrect, correct: nextCorrect, total, stars: calculateStars(nextCorrect, total) });
        return;
      }
      setCorrect(nextCorrect);
      setRound(round + 1);
      setSequence([]);
      setMistake(false);
    });
  };

  const removeLast = () => {
    setSequence(sequence.slice(0, -1));
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
            disabled={advancing || selectedAt >= 0}
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
    </div>
    <p className="learning-note">{label(lang, 'Ez dago presarik. Saiatu istorioaren urratsei begiratzen.', 'No hay prisa. Piensa en los pasos de la historia.')}</p>
  </section>;
}
