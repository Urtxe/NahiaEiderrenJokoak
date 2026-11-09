import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { useExerciseRound } from '../hooks/useExerciseRound';
import { answerChoices, calculateStars, numberChoices, pickExercises, shuffle } from '../utils/gameLogic';
import { makeWordGrid, wordSearchCount } from '../utils/wordSearch';

type Word = { text: string; clue: string; icon: string };
type WordGameProps = { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (result: GameResult) => void };
const wordId = (word: { text: string }) => word.text;
const wordSets: Record<SchoolLevel, Word[]> = {
  lh1: [
    { text: 'KATU', clue: 'Etxeko animalia, “miau” egiten du.', icon: '🐱' },
    { text: 'LUR', clue: 'Oinen azpian dago.', icon: '🌱' },
    { text: 'EGUZKI', clue: 'Egunez zeruan distira egiten du.', icon: '☀️' },
    { text: 'TXAKUR', clue: 'Zaunka egiten duen animalia.', icon: '🐶' },
    { text: 'ETXE', clue: 'Bizitzeko erabiltzen dugun eraikina.', icon: '🏠' },
    { text: 'MENDI', clue: 'Tontorra duen lur garaia.', icon: '⛰️' },
    { text: 'ITSASO', clue: 'Ur gaziz betetako eremu handia.', icon: '🌊' },
    { text: 'SAGAR', clue: 'Gorria edo berdea izan daitekeen fruta.', icon: '🍎' },
    { text: 'OGI', clue: 'Irinarekin egiten den janaria.', icon: '🍞' },
    { text: 'ESNE', clue: 'Behiek ematen duten edari zuria.', icon: '🥛' },
    { text: 'LORE', clue: 'Petaloak dituen landarearen zatia.', icon: '🌷' },
    { text: 'HODEI', clue: 'Zeruan dago, eta zuria edo grisa izan daiteke.', icon: '☁️' },
    { text: 'ATE', clue: 'Gela batera sartzeko irekitzen dugu.', icon: '🚪' },
    { text: 'LIBURU', clue: 'Orrialdeak ditu eta irakurtzeko balio du.', icon: '📘' },
    { text: 'ILARGI', clue: 'Gauez zeruan ikusten dugu, batzuetan biribil-biribila.', icon: '🌙' },
    { text: 'ZALDI', clue: 'Lau hanka eta zurda ditu. Trostan ibil daiteke.', icon: '🐴' },
    { text: 'GAZTA', clue: 'Esnearekin egiten den janaria.', icon: '🧀' },
    { text: 'OIN', clue: 'Ibiltzeko lurrean jartzen dugun gorputz-atala.', icon: '🦶' },
    { text: 'ERLE', clue: 'Lorez lore ibiltzen da eta eztia egiten du.', icon: '🐝' },
    { text: 'GILTZA', clue: 'Sarraila irekitzeko erabiltzen dugu.', icon: '🔑' },
    { text: 'AHATE', clue: 'Urmaelean igeri egiten duen hegaztia.', icon: '🦆' },
    { text: 'UDA', clue: 'Urteko sasoirik beroena.', icon: '🏖️' },
    { text: 'BELAR', clue: 'Zelaietan hazten da eta berdea da.', icon: '🌿' },
    { text: 'ERRATZ', clue: 'Lurreko hautsa biltzeko erabiltzen dugu.', icon: '🧹' },
  ],
  lh3: [
    { text: 'TXIMELETA', clue: 'Hego koloretsuak dituen intsektua.', icon: '🦋' },
    { text: 'ORTZADAR', clue: 'Euriaren ondoren ager daitekeen kolore arkua.', icon: '🌈' },
    { text: 'BASOA', clue: 'Zuhaitz asko dauden lekua.', icon: '🌳' },
    { text: 'ITSASARGI', clue: 'Kostaldean itsasontziak argiz gidatzen dituen dorrea.', icon: '🗼' },
    { text: 'TRIKUA', clue: 'Bizkarrean arantzak dituen animalia txikia.', icon: '🦔' },
    { text: 'ARKATZA', clue: 'Idazteko edo marrazteko erabiltzen dugu; egindakoa ezabatu daiteke.', icon: '✏️' },
    { text: 'EGUTEGIA', clue: 'Urteko egunak eta hilabeteak erakusten ditu.', icon: '📅' },
    { text: 'MENDIZALE', clue: 'Mendira joatea gustuko duen pertsona.', icon: '🥾' },
    { text: 'ELURRA', clue: 'Hotz egiten duenean zerutik malutatan erortzen da.', icon: '❄️' },
    { text: 'URTXINTXA', clue: 'Isats luzea duen animalia, zuhaitzetara igotzen dena.', icon: '🐿️' },
    { text: 'ILUNTZEA', clue: 'Eguzkia sartu eta gaua hasi aurreko unea.', icon: '🌆' },
    { text: 'SUKALDEA', clue: 'Janaria prestatzen dugun etxeko gela.', icon: '🍳' },
    { text: 'ARGAZKIA', clue: 'Kamerarekin ateratzen dugun irudia.', icon: '📷' },
    { text: 'ZUBIA', clue: 'Ibaia gainetik zeharkatzeko eraikuntza.', icon: '🌉' },
    { text: 'UDAZKENA', clue: 'Hosto asko lurrera erortzen diren urte-sasoia.', icon: '🍂' },
    { text: 'EGUNSENTI', clue: 'Eguzkia ateratzen hasten den unea.', icon: '🌅' },
    { text: 'ATERKIA', clue: 'Irekitzen dugunean, euritik babesten gaitu.', icon: '☂️' },
    { text: 'BARRASKILO', clue: 'Oso poliki dabil eta oskola bizkarrean darama.', icon: '🐌' },
    { text: 'SUMENDIA', clue: 'Barrutik laba atera dakiokeen mendia.', icon: '🌋' },
    { text: 'IPUINA', clue: 'Irakurri edo kontatu daitekeen istorio laburra.', icon: '📖' },
    { text: 'TXISTUA', clue: 'Putz eginez jotzen den euskal musika-tresna.', icon: '🪈' },
    { text: 'ERREKA', clue: 'Ibaia baino txikiagoa den ur-lasterra.', icon: '💧' },
    { text: 'KOADERNOA', clue: 'Oharrak idazteko erabiltzen dugun orri multzoa.', icon: '📓' },
    { text: 'ESKULARRU', clue: 'Hotza egiten duenean, eskua estaltzeko janzten dugu.', icon: '🧤' },
  ],
};
const tr = (lang: Language, eu: string, es: string) => lang === 'eu' ? eu : es;

export function WordSearch({ lang, level, profile, onComplete }: WordGameProps) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const words = useExerciseRound(`words:${profile}:${level}`,
    recent => pickExercises(wordSets[level], wordSearchCount, recent, wordId), round => round.map(wordId));
  const [grid] = useState(() => makeWordGrid(level, words));
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const size = grid.length;
  const selectedWord = selected.map(i => grid[Math.floor(i / size)][i % size].letter).join('');
  const selectCell = (i: number) => {
    if (advancing) return;
    if (selected.includes(i)) setSelected(selected.slice(0, selected.indexOf(i)));
    else if (selected.length < size) setSelected([...selected, i]);
  };
  const checkWord = () => {
    const start = selected[0];
    const end = selected[selected.length - 1];
    if (advancing || selected.length < 2) return;
    const r1 = Math.floor(start / size), c1 = start % size, r2 = Math.floor(end / size), c2 = end % size;
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    const straight = r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1);
    const contiguous = straight && selected.every((cell, index) => cell === (r1 + dr * index) * size + c1 + dc * index);
    const wordIndex = words.findIndex((word, index) => !found.includes(index) && (word.text === selectedWord || word.text === [...selectedWord].reverse().join('')));
    if (contiguous && wordIndex >= 0 && selected.length === words[wordIndex].text.length) {
      const next = [...found, wordIndex]; setFound(next); setSelected([]);
      const detail = tr(lang, 'Hitza aurkitu duzu!', '¡Has encontrado la palabra!');
      if (next.length === words.length) {
        showFeedback(true, detail, () => onComplete({ game: 'words', score: next.length, correct: next.length, total: words.length, stars: calculateStars(next.length, words.length) }));
      } else {
        showFeedback(true, detail);
      }
    } else {
      showFeedback(false, tr(lang, 'Aukeratu letrak lerro zuzenean.', 'Selecciona las letras en línea recta.'));
    }
  };
  return <section className="game-shell learning-game"><div className="game-top"><div><span className="eyebrow">🔎 EUSKARAZKO HITZAK</span><h2>{tr(lang, 'Letra zopa', 'Sopa de letras')}</h2><p>{tr(lang, 'Aurkitu hitzak; letraz letra hautatu, lerro zuzenean.', 'Encuentra las palabras; selecciona sus letras en línea recta.')}</p></div><span className="counter">{found.length} / {words.length}</span></div>
    <div className="word-search-layout"><div className="letter-grid" style={{ '--grid-size': size } as React.CSSProperties} aria-label={tr(lang, 'Letren taula', 'Cuadrícula de letras')}>{grid.flatMap((row, r) => row.map((cell, c) => { const i = r * size + c; return <button key={i} className={`letter-cell ${selected.includes(i) ? 'chosen' : ''} ${found.some(w => cell.word === w) && cell.word >= 0 ? 'word-found' : ''}`} onClick={() => selectCell(i)} disabled={advancing} aria-label={`${cell.letter}, ${r + 1}, ${c + 1}`}>{cell.letter}</button>; }))}</div>
    <div className="word-clues"><h3>{tr(lang, 'Bilatu irudien pistak erabiliz', 'Busca con ayuda de las pistas')}</h3><p className="word-preview">{selectedWord || tr(lang, 'Hautatutako letrak hemen', 'Letras seleccionadas')}</p><button className="primary" onClick={checkWord} disabled={advancing || selected.length < 2}>{tr(lang, 'Hitza egiaztatu', 'Comprobar palabra')} →</button>{words.map((word, i) => <div className={`word-clue ${found.includes(i) ? 'done' : ''}`} key={word.text}><span>{word.icon}</span><div><strong>{found.includes(i) ? word.text : '•'.repeat(word.text.length)}</strong><small>{word.clue}</small></div>{found.includes(i) && <b>✓</b>}</div>)}</div></div>
  </section>;
}

type MathQuestion = { a: number; b: number; op: '+' | '−' | '×'; answer: number };
const mathId = ({ a, b, op }: MathQuestion) => `${a}${op}${b}`;
function mathQuestions(level: SchoolLevel, recent: readonly string[]) {
  const max = level === 'lh1' ? 20 : 100;
  const sums: MathQuestion[] = [];
  const differences: MathQuestion[] = [];
  const products: MathQuestion[] = [];
  for (let a = 1; a <= max; a++) {
    for (let b = 1; b <= a; b++) {
      if (a + b <= max) sums.push({ a, b, op: '+', answer: a + b });
      differences.push({ a, b, op: '−', answer: a - b });
    }
  }
  if (level === 'lh3') {
    for (let a = 2; a <= 10; a++) {
      for (let b = 2; b <= a; b++) products.push({ a, b, op: '×', answer: a * b });
    }
  }
  return shuffle([
    ...pickExercises(sums, level === 'lh1' ? 5 : 3, recent, mathId),
    ...pickExercises(differences, 3, recent, mathId),
    ...pickExercises(products, level === 'lh1' ? 0 : 2, recent, mathId),
  ]).map(question => ({ ...question, choices: numberChoices(question.answer).options }));
}
export function MathAdventure({ lang, level, profile, onComplete }: WordGameProps) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const questions = useExerciseRound(`math:${profile}:${level}`,
    recent => mathQuestions(level, recent), round => round.map(mathId));
  const [round, setRound] = useState(0);
  const { choices, ...question } = questions[round];
  const [correct, setCorrect] = useState(0); const [mistake, setMistake] = useState(false); const total = questions.length;
  const choose = (value: number) => {
    if (advancing) return;
    if (value !== question.answer) {
      setMistake(true);
      showFeedback(false, tr(lang, 'Kalkulatu berriro lasai.', 'Vuelve a calcular con calma.'));
      return;
    }
    const score = correct + (mistake ? 0 : 1);
    showFeedback(true, undefined, () => {
      if (round + 1 === total) onComplete({ game: 'math', score, correct: score, total, stars: calculateStars(score, total) });
      else { setRound(round + 1); setCorrect(score); setMistake(false); }
    });
  };
  const visualCount = level === 'lh1' && question.answer <= 20;
  return <section className="game-shell learning-game"><div className="game-top"><div><span className="eyebrow">🔢 {tr(lang, 'MATEMATIKA', 'MATEMÁTICAS')} · {level.toUpperCase()}</span><h2>{tr(lang, 'Altxorraren zenbakiak', 'Los números del tesoro')}</h2><p>{tr(lang, 'Ebatzi eragiketa eta bildu harribitxiak.', 'Resuelve la operación y reúne las joyas.')}</p></div><span className="counter">{round + 1} / {total}</span></div>
    <div className="math-board"><div className="treasure-art" aria-hidden="true">🗺️　💎　🦜</div><div className="math-question">{question.a} {question.op} {question.b} = <span>?</span></div>{visualCount && <div className="math-visual" aria-label={`${question.a} más ${question.b}`}>{'🟡'.repeat(question.a)} {question.op === '+' ? '＋' : '−'} {'🔵'.repeat(question.b)}</div>}<div className="answers">{choices.map((n, i) => <button key={`${n}-${i}`} className="answer" disabled={advancing} onClick={() => choose(n)}>{n}</button>)}</div></div>
    <p className="learning-note">{level === 'lh1' ? tr(lang, 'LH1: zenbakiak 20ra arte, batuketak eta kenketak irudiekin.', 'LH1: números hasta 20, sumas y restas con apoyo visual.') : tr(lang, 'LH3: batuketak eta kenketak 100era arte, eta biderketa taulak.', 'LH3: sumas y restas hasta 100 y tablas de multiplicar.')}</p>
  </section>;
}

type EnglishWord = { text: string; image: string; category: string };
type VocabRound = { kind: 'picture-word' | 'word-picture' | 'listen-picture'; word: EnglishWord; options: EnglishWord[] };
const englishWords: Record<SchoolLevel, EnglishWord[]> = {
  lh1: [
    { text: 'CAT', image: '🐱', category: 'animals' }, { text: 'DOG', image: '🐶', category: 'animals' },
    { text: 'FISH', image: '🐟', category: 'animals' }, { text: 'BIRD', image: '🐦', category: 'animals' },
    { text: 'RED', image: '🔴', category: 'colours' }, { text: 'BLUE', image: '🔵', category: 'colours' },
    { text: 'GREEN', image: '🟢', category: 'colours' }, { text: 'SUN', image: '☀️', category: 'nature' },
    { text: 'MOON', image: '🌙', category: 'nature' }, { text: 'APPLE', image: '🍎', category: 'food' },
    { text: 'BOOK', image: '📘', category: 'school' }, { text: 'PENCIL', image: '✏️', category: 'school' },
    { text: 'DUCK', image: '🦆', category: 'animals' }, { text: 'FROG', image: '🐸', category: 'animals' },
    { text: 'YELLOW', image: '🟡', category: 'colours' }, { text: 'PINK', image: '🩷', category: 'colours' },
    { text: 'STAR', image: '⭐', category: 'nature' }, { text: 'TREE', image: '🌳', category: 'nature' },
    { text: 'MILK', image: '🥛', category: 'food' }, { text: 'EGG', image: '🥚', category: 'food' },
    { text: 'RULER', image: '📏', category: 'school' },
  ],
  lh3: [
    { text: 'FAMILY', image: '👨‍👩‍👧', category: 'family' }, { text: 'SISTER', image: '👧', category: 'family' },
    { text: 'BROTHER', image: '👦', category: 'family' }, { text: 'TEACHER', image: '👩‍🏫', category: 'school' },
    { text: 'PENCIL', image: '✏️', category: 'school' }, { text: 'SCHOOL', image: '🏫', category: 'school' },
    { text: 'ORANGE', image: '🍊', category: 'food' }, { text: 'BREAD', image: '🍞', category: 'food' },
    { text: 'BANANA', image: '🍌', category: 'food' }, { text: 'CLOUD', image: '☁️', category: 'weather' },
    { text: 'RAINY', image: '🌧️', category: 'weather' }, { text: 'SUNNY', image: '🌞', category: 'weather' },
    { text: 'JACKET', image: '🧥', category: 'clothes' }, { text: 'SHOES', image: '👟', category: 'clothes' },
    { text: 'GRANDMA', image: '👵', category: 'family' }, { text: 'GRANDPA', image: '👴', category: 'family' },
    { text: 'NOTEBOOK', image: '📓', category: 'school' }, { text: 'CHEESE', image: '🧀', category: 'food' },
    { text: 'SNOWY', image: '🌨️', category: 'weather' }, { text: 'SCARF', image: '🧣', category: 'clothes' },
    { text: 'GLOVES', image: '🧤', category: 'clothes' },
  ],
};
const makeVocabRounds = (level: SchoolLevel, recent: readonly string[]): VocabRound[] => {
  const selected = pickExercises(englishWords[level], 7, recent, wordId);
  return selected.map((word, index) => ({
    kind: index < 3 ? 'picture-word' : index < 5 ? 'word-picture' : 'listen-picture',
    word,
    options: answerChoices(word, englishWords[level]).options,
  }));
};

function EnglishWordSearch({ lang, level, words, onFound }: { lang: Language; level: SchoolLevel; words: EnglishWord[]; onFound: () => void }) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const [grid] = useState(() => makeWordGrid(level, words));
  const [selected, setSelected] = useState<number[]>([]); const [found, setFound] = useState<number[]>([]);
  const size = grid.length;
  const selectedWord = selected.map(i => grid[Math.floor(i / size)][i % size].letter).join('');
  const check = () => {
    if (advancing || selected.length < 2) return;
    const start = selected[0], end = selected[selected.length - 1];
    const r1 = Math.floor(start / size), c1 = start % size, r2 = Math.floor(end / size), c2 = end % size;
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    const straight = r1 === r2 || c1 === c2;
    const contiguous = straight && selected.every((cell, index) => cell === (r1 + dr * index) * size + c1 + dc * index);
    const wordIndex = words.findIndex((word, index) => !found.includes(index) && (word.text === selectedWord || word.text === [...selectedWord].reverse().join('')));
    if (contiguous && wordIndex >= 0 && selected.length === words[wordIndex].text.length) {
      const next = [...found, wordIndex];
      setFound(next);
      setSelected([]);
      showFeedback(true, 'Word found!', next.length === words.length ? onFound : undefined);
    } else {
      showFeedback(false, tr(lang, 'Begiratu hitzen zerrenda.', 'Mira la lista de palabras.'));
    }
  };
  return <div className="english-search"><h3>🔎 Word search</h3><p>{tr(lang, 'Aurkitu hitz hauek letrez letra.', 'Encuentra estas palabras letra a letra.')}</p><div className="english-search-layout"><div className="letter-grid" style={{ '--grid-size': size } as React.CSSProperties}>{grid.flatMap((row, r) => row.map((cell, c) => { const i = r * size + c; return <button key={i} className={`letter-cell ${selected.includes(i) ? 'chosen' : ''} ${found.some(w => cell.word === w) && cell.word >= 0 ? 'word-found' : ''}`} disabled={advancing} onClick={() => setSelected(current => current.includes(i) ? current.slice(0, current.indexOf(i)) : [...current, i])} aria-label={`${cell.letter}, ${r + 1}, ${c + 1}`}>{cell.letter}</button>; }))}</div><div className="english-word-list"><p className="word-preview">{selectedWord}</p><button className="primary" disabled={advancing || selected.length < 2} onClick={check}>{tr(lang, 'Egiaztatu', 'Comprobar')} →</button>{words.map((word, i) => <div className={found.includes(i) ? 'done' : ''} key={word.text}><span>{word.image}</span><strong>{word.text}</strong>{found.includes(i) && <b>✓</b>}</div>)}</div></div></div>;
}

export function EnglishQuest({ lang, level, profile, onComplete }: WordGameProps) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const rounds = useExerciseRound(`english:${profile}:${level}`,
    recent => makeVocabRounds(level, recent), round => round.map(({ word }) => word.text));
  const searchWords = rounds.slice(0, wordSearchCount).map(round => round.word);
  const [step, setStep] = useState(0); const [correct, setCorrect] = useState(0); const [mistake, setMistake] = useState(false); const [searchDone, setSearchDone] = useState(false);
  const card = rounds[step]; const total = rounds.length + searchWords.length;
  const speak = (word: EnglishWord) => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(word.text.toLowerCase()); utterance.lang = 'en-GB'; window.speechSynthesis.speak(utterance); } };
  const choose = (word: EnglishWord) => {
    if (advancing) return;
    if (word.text !== card.word.text) {
      setMistake(true);
      showFeedback(false, tr(lang, 'Begiratu irudia edo entzun hitza.', 'Mira la imagen o escucha la palabra.'));
      return;
    }
    const score = correct + (mistake ? 0 : 1);
    speak(card.word);
    showFeedback(true, undefined, () => {
      setCorrect(score);
      setStep(step + 1);
      setMistake(false);
    });
  };
  const finishSearch = () => { setSearchDone(true); const score = correct + searchWords.length; onComplete({ game: 'english', score, correct: score, total, stars: calculateStars(score, total) }); };
  const progress = step < rounds.length ? step + 1 : rounds.length + (searchDone ? searchWords.length : 0);
  return <section className="game-shell learning-game"><div className="game-top"><div><span className="eyebrow">🇬🇧 ENGLISH VOCABULARY · {level.toUpperCase()}</span><h2>{level === 'lh1' ? 'Picture & Word Adventure' : 'Vocabulary Explorer'}</h2><p>{tr(lang, 'Irudia ikusi, hitza irakurri eta ingelesez entzun.', 'Mira la imagen, lee la palabra y escúchala en inglés.')}</p></div><span className="counter">{progress} / {total}</span></div>
    {step < rounds.length ? <div className="english-card"><span className="exercise-type">{card.kind === 'picture-word' ? tr(lang, 'IRUDIA → HITZA', 'IMAGEN → PALABRA') : card.kind === 'word-picture' ? tr(lang, 'HITZA → IRUDIA', 'PALABRA → IMAGEN') : tr(lang, 'ENTZUN → IRUDIA', 'ESCUCHA → IMAGEN')}</span>{card.kind === 'picture-word' ? <><div className="english-picture" aria-hidden="true">{card.word.image}</div><h3>What is it?</h3></> : card.kind === 'word-picture' ? <><h3 className="english-target">{card.word.text}</h3><p>{tr(lang, 'Aukeratu hitzari dagokion irudia.', 'Elige la imagen que corresponde a la palabra.')}</p></> : <><div className="english-listen">🎧</div><h3>Listen and choose the picture</h3></>}
      <div className={card.kind === 'picture-word' ? 'english-answers' : 'english-image-options'}>{card.options.map(option => <button className="answer" key={option.text} disabled={advancing} onClick={() => choose(option)}>{card.kind === 'picture-word' ? option.text : <><span>{option.image}</span><small>{option.text}</small></>}</button>)}</div><button className="read-button" onClick={() => speak(card.word)}>🔊 Listen</button></div> : <EnglishWordSearch lang={lang} level={level} words={searchWords} onFound={finishSearch} />}
    <p className="learning-note">{level === 'lh1' ? tr(lang, 'LH1: animaliak, koloreak, natura, janaria eta eskolako hitzak.', 'LH1: animales, colores, naturaleza, comida y vocabulario escolar.') : tr(lang, 'LH3: familia, eskola, janaria, eguraldia eta arropa.', 'LH3: familia, escuela, comida, tiempo atmosférico y ropa.')}</p>
  </section>;
}
