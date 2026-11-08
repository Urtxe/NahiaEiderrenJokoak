import { useEffect, useState } from 'react';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { answerChoices, calculateStars, numberChoices } from '../utils/gameLogic';
import { makeWordGrid, shuffleSearchWords, wordSearchCount } from '../utils/wordSearch';

type Word = { text: string; clue: string; icon: string };
type WordGameProps = { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (result: GameResult) => void };
const lastBasqueWords = new Map<string, Word[]>();
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
  ],
};
const tr = (lang: Language, eu: string, es: string) => lang === 'eu' ? eu : es;

export function WordSearch({ lang, level, profile, onComplete }: WordGameProps) {
  const puzzleKey = `${profile}:${level}`;
  const [{ words, grid }] = useState(() => {
    const words = shuffleSearchWords(wordSets[level], lastBasqueWords.get(puzzleKey)).slice(0, wordSearchCount);
    return { words, grid: makeWordGrid(level, words) };
  });
  useEffect(() => { lastBasqueWords.set(puzzleKey, words); }, [puzzleKey, words]);
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const size = grid.length;
  const selectedWord = selected.map(i => grid[Math.floor(i / size)][i % size].letter).join('');
  const selectCell = (i: number) => {
    if (selected.includes(i)) setSelected(selected.slice(0, selected.indexOf(i)));
    else if (selected.length < (level === 'lh1' ? 6 : 9)) setSelected([...selected, i]);
  };
  const checkWord = () => {
    const start = selected[0];
    const end = selected[selected.length - 1];
    if (selected.length < 2) return;
    const r1 = Math.floor(start / size), c1 = start % size, r2 = Math.floor(end / size), c2 = end % size;
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    const straight = r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1);
    const contiguous = straight && selected.every((cell, index) => cell === (r1 + dr * index) * size + c1 + dc * index);
    const wordIndex = words.findIndex((word, index) => !found.includes(index) && (word.text === selectedWord || word.text === [...selectedWord].reverse().join('')));
    if (contiguous && wordIndex >= 0 && selected.length === words[wordIndex].text.length) {
      const next = [...found, wordIndex]; setFound(next); setSelected([]);
      setMessage(tr(lang, 'Hitza aurkitu duzu! Oso ondo!', '¡Has encontrado la palabra! ¡Muy bien!'));
      if (next.length === words.length) onComplete({ game: 'words', score: next.length, correct: next.length, total: words.length, stars: calculateStars(next.length, words.length) });
    } else setMessage(tr(lang, 'Saiatu hitz zuzen batekin.', 'Prueba con una palabra de la lista.'));
  };
  return <section className="game-shell learning-game"><div className="game-top"><div><span className="eyebrow">🔎 EUSKARAZKO HITZAK</span><h2>{tr(lang, 'Letra zopa', 'Sopa de letras')}</h2><p>{tr(lang, 'Aurkitu hitzak; letraz letra hautatu, lerro zuzenean.', 'Encuentra las palabras; selecciona sus letras en línea recta.')}</p></div><span className="counter">{found.length} / {words.length}</span></div>
    <div className="word-search-layout"><div className="letter-grid" style={{ '--grid-size': size } as React.CSSProperties} aria-label={tr(lang, 'Letren taula', 'Cuadrícula de letras')}>{grid.flatMap((row, r) => row.map((cell, c) => { const i = r * size + c; return <button key={i} className={`letter-cell ${selected.includes(i) ? 'chosen' : ''} ${found.some(w => cell.word === w) && cell.word >= 0 ? 'word-found' : ''}`} onClick={() => selectCell(i)} aria-label={`${cell.letter}, ${r + 1}, ${c + 1}`}>{cell.letter}</button>; }))}</div>
    <div className="word-clues"><h3>{tr(lang, 'Bilatu irudien pistak erabiliz', 'Busca con ayuda de las pistas')}</h3><p className="word-preview">{selectedWord || tr(lang, 'Hautatutako letrak hemen', 'Letras seleccionadas')}</p><button className="primary" onClick={checkWord} disabled={selected.length < 2}>{tr(lang, 'Hitza egiaztatu', 'Comprobar palabra')} →</button>{message && <p role="status" className="good-feedback">{message}</p>}{words.map((word, i) => <div className={`word-clue ${found.includes(i) ? 'done' : ''}`} key={word.text}><span>{word.icon}</span><div><strong>{found.includes(i) ? word.text : '•••••••••'.slice(0, word.text.length)}</strong><small>{word.clue}</small></div>{found.includes(i) && <b>✓</b>}</div>)}</div></div>
  </section>;
}

type MathQuestion = { a: number; b: number; op: '+' | '−' | '×'; answer: number };
function makeMathQuestion(level: SchoolLevel): MathQuestion {
  const op: MathQuestion['op'] = level === 'lh1' ? (Math.random() > .35 ? '+' : '−') : (['+', '−', '×'] as const)[Math.floor(Math.random() * 3)];
  const max = level === 'lh1' ? 10 : 100;
  if (op === '×') { const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 10); return { a, b, op, answer: a * b }; }
  const a = 1 + Math.floor(Math.random() * max), b = 1 + Math.floor(Math.random() * (op === '+' ? Math.max(1, max - a) : a));
  return { a, b, op, answer: op === '+' ? a + b : a - b };
}
export function MathAdventure({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const [round, setRound] = useState(0); const [question, setQuestion] = useState(() => makeMathQuestion(level)); const [choices, setChoices] = useState(() => numberChoices(question.answer).options);
  const [correct, setCorrect] = useState(0); const [mistake, setMistake] = useState(false); const [message, setMessage] = useState(''); const total = 8;
  const choose = (value: number) => {
    if (value !== question.answer) { setMistake(true); setMessage(tr(lang, 'Zenbatu edo kalkulatu berriro lasai.', 'Cuenta o calcula otra vez con calma.')); return; }
    const score = correct + (mistake ? 0 : 1); setMessage(tr(lang, 'Bai! Aurrera izarretara!', '¡Sí! ¡A por las estrellas!'));
    window.setTimeout(() => {
      if (round + 1 === total) onComplete({ game: 'math', score, correct: score, total, stars: calculateStars(score, total) });
      else { const next = makeMathQuestion(level); setRound(round + 1); setCorrect(score); setQuestion(next); setChoices(numberChoices(next.answer).options); setMistake(false); setMessage(''); }
    }, 550);
  };
  const visualCount = level === 'lh1' && question.answer <= 20;
  return <section className="game-shell learning-game"><div className="game-top"><div><span className="eyebrow">🔢 {tr(lang, 'MATEMATIKA', 'MATEMÁTICAS')} · {level.toUpperCase()}</span><h2>{tr(lang, 'Altxorraren zenbakiak', 'Los números del tesoro')}</h2><p>{tr(lang, 'Ebatzi eragiketa eta bildu harribitxiak.', 'Resuelve la operación y reúne las joyas.')}</p></div><span className="counter">{round + 1} / {total}</span></div>
    <div className="math-board"><div className="treasure-art" aria-hidden="true">🗺️　💎　🦜</div><div className="math-question">{question.a} {question.op} {question.b} = <span>?</span></div>{visualCount && <div className="math-visual" aria-label={`${question.a} más ${question.b}`}>{'🟡'.repeat(question.a)} {question.op === '+' ? '＋' : '−'} {'🔵'.repeat(question.b)}</div>}<div className="answers">{choices.map((n, i) => <button key={`${n}-${i}`} className="answer" onClick={() => choose(n)}>{n}</button>)}</div>{message && <p role="status" className={mistake ? 'gentle-feedback' : 'good-feedback'}>{message}</p>}</div>
    <p className="learning-note">{level === 'lh1' ? tr(lang, 'LH1: zenbakiak 20ra arte, batuketak eta kenketak irudiekin.', 'LH1: números hasta 20, sumas y restas con apoyo visual.') : tr(lang, 'LH3: batuketak eta kenketak 100era arte, eta biderketa taulak.', 'LH3: sumas y restas hasta 100 y tablas de multiplicar.')}</p>
  </section>;
}

type EnglishWord = { text: string; image: string; category: string };
type VocabRound = { kind: 'picture-word' | 'word-picture' | 'listen-picture'; word: EnglishWord; options: EnglishWord[] };
const lastEnglishWords = new Map<string, EnglishWord[]>();
const englishWords: Record<SchoolLevel, EnglishWord[]> = {
  lh1: [
    { text: 'CAT', image: '🐱', category: 'animals' }, { text: 'DOG', image: '🐶', category: 'animals' },
    { text: 'FISH', image: '🐟', category: 'animals' }, { text: 'BIRD', image: '🐦', category: 'animals' },
    { text: 'RED', image: '🔴', category: 'colours' }, { text: 'BLUE', image: '🔵', category: 'colours' },
    { text: 'GREEN', image: '🟢', category: 'colours' }, { text: 'SUN', image: '☀️', category: 'nature' },
    { text: 'MOON', image: '🌙', category: 'nature' }, { text: 'APPLE', image: '🍎', category: 'food' },
    { text: 'BOOK', image: '📘', category: 'school' }, { text: 'PENCIL', image: '✏️', category: 'school' },
  ],
  lh3: [
    { text: 'FAMILY', image: '👨‍👩‍👧', category: 'family' }, { text: 'SISTER', image: '👧', category: 'family' },
    { text: 'BROTHER', image: '👦', category: 'family' }, { text: 'TEACHER', image: '👩‍🏫', category: 'school' },
    { text: 'PENCIL', image: '✏️', category: 'school' }, { text: 'SCHOOL', image: '🏫', category: 'school' },
    { text: 'ORANGE', image: '🍊', category: 'food' }, { text: 'BREAD', image: '🍞', category: 'food' },
    { text: 'BANANA', image: '🍌', category: 'food' }, { text: 'CLOUD', image: '☁️', category: 'weather' },
    { text: 'RAINY', image: '🌧️', category: 'weather' }, { text: 'SUNNY', image: '🌞', category: 'weather' },
    { text: 'JACKET', image: '🧥', category: 'clothes' }, { text: 'SHOES', image: '👟', category: 'clothes' },
  ],
};
const makeVocabRounds = (level: SchoolLevel, previous?: EnglishWord[]): VocabRound[] => {
  const selected = shuffleSearchWords(englishWords[level], previous).slice(0, 7);
  return selected.map((word, index) => ({
    kind: index < 3 ? 'picture-word' : index < 5 ? 'word-picture' : 'listen-picture',
    word,
    options: answerChoices(word, englishWords[level]).options,
  }));
};

function EnglishWordSearch({ lang, level, words, onFound }: { lang: Language; level: SchoolLevel; words: EnglishWord[]; onFound: () => void }) {
  const [grid] = useState(() => makeWordGrid(level, words));
  const [selected, setSelected] = useState<number[]>([]); const [found, setFound] = useState<number[]>([]); const [message, setMessage] = useState('');
  const size = grid.length;
  const selectedWord = selected.map(i => grid[Math.floor(i / size)][i % size].letter).join('');
  const check = () => {
    if (selected.length < 2) return;
    const start = selected[0], end = selected[selected.length - 1];
    const r1 = Math.floor(start / size), c1 = start % size, r2 = Math.floor(end / size), c2 = end % size;
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    const straight = r1 === r2 || c1 === c2;
    const contiguous = straight && selected.every((cell, index) => cell === (r1 + dr * index) * size + c1 + dc * index);
    const wordIndex = words.findIndex((word, index) => !found.includes(index) && (word.text === selectedWord || word.text === [...selectedWord].reverse().join('')));
    if (contiguous && wordIndex >= 0 && selected.length === words[wordIndex].text.length) {
      const next = [...found, wordIndex]; setFound(next); setSelected([]); setMessage('Great! Word found!');
      if (next.length === words.length) onFound();
    } else setMessage(tr(lang, 'Saiatu berriro; begiratu hitzen zerrenda.', 'Prueba otra vez; mira la lista de palabras.'));
  };
  return <div className="english-search"><h3>🔎 Word search</h3><p>{tr(lang, 'Aurkitu hitz hauek letrez letra.', 'Encuentra estas palabras letra a letra.')}</p><div className="english-search-layout"><div className="letter-grid" style={{ '--grid-size': size } as React.CSSProperties}>{grid.flatMap((row, r) => row.map((cell, c) => { const i = r * size + c; return <button key={i} className={`letter-cell ${selected.includes(i) ? 'chosen' : ''} ${found.some(w => cell.word === w) && cell.word >= 0 ? 'word-found' : ''}`} onClick={() => setSelected(current => current.includes(i) ? current.slice(0, current.indexOf(i)) : [...current, i])} aria-label={`${cell.letter}, ${r + 1}, ${c + 1}`}>{cell.letter}</button>; }))}</div><div className="english-word-list"><p className="word-preview">{selectedWord}</p><button className="primary" disabled={selected.length < 2} onClick={check}>{tr(lang, 'Egiaztatu', 'Comprobar')} →</button>{message && <p className="good-feedback" role="status">{message}</p>}{words.map((word, i) => <div className={found.includes(i) ? 'done' : ''} key={word.text}><span>{word.image}</span><strong>{word.text}</strong>{found.includes(i) && <b>✓</b>}</div>)}</div></div></div>;
}

export function EnglishQuest({ lang, level, profile, onComplete }: WordGameProps) {
  const puzzleKey = `${profile}:${level}`;
  const [{ rounds, searchWords }] = useState(() => {
    const rounds = makeVocabRounds(level, lastEnglishWords.get(puzzleKey));
    return { rounds, searchWords: rounds.slice(0, wordSearchCount).map(round => round.word) };
  });
  const [step, setStep] = useState(0); const [correct, setCorrect] = useState(0); const [mistake, setMistake] = useState(false); const [message, setMessage] = useState(''); const [searchDone, setSearchDone] = useState(false);
  useEffect(() => { if (step === rounds.length) lastEnglishWords.set(puzzleKey, searchWords); }, [puzzleKey, rounds.length, searchWords, step]);
  const card = rounds[step]; const total = rounds.length + searchWords.length;
  const speak = (word: EnglishWord) => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(word.text.toLowerCase()); utterance.lang = 'en-GB'; window.speechSynthesis.speak(utterance); } };
  const choose = (word: EnglishWord) => {
    if (word.text !== card.word.text) { setMistake(true); setMessage(tr(lang, 'Saiatu berriro; begiratu irudia edo entzun hitza.', 'Prueba otra vez; mira la imagen o escucha la palabra.')); return; }
    const score = correct + (mistake ? 0 : 1); setCorrect(score); setMessage('Great job!'); speak(card.word);
    window.setTimeout(() => { setStep(step + 1); setMistake(false); setMessage(''); }, 650);
  };
  const finishSearch = () => { setSearchDone(true); const score = correct + searchWords.length; onComplete({ game: 'english', score, correct: score, total, stars: calculateStars(score, total) }); };
  const progress = step < rounds.length ? step + 1 : rounds.length + (searchDone ? searchWords.length : 0);
  return <section className="game-shell learning-game"><div className="game-top"><div><span className="eyebrow">🇬🇧 ENGLISH VOCABULARY · {level.toUpperCase()}</span><h2>{level === 'lh1' ? 'Picture & Word Adventure' : 'Vocabulary Explorer'}</h2><p>{tr(lang, 'Irudia ikusi, hitza irakurri eta ingelesez entzun.', 'Mira la imagen, lee la palabra y escúchala en inglés.')}</p></div><span className="counter">{progress} / {total}</span></div>
    {step < rounds.length ? <div className="english-card"><span className="exercise-type">{card.kind === 'picture-word' ? tr(lang, 'IRUDIA → HITZA', 'IMAGEN → PALABRA') : card.kind === 'word-picture' ? tr(lang, 'HITZA → IRUDIA', 'PALABRA → IMAGEN') : tr(lang, 'ENTZUN → IRUDIA', 'ESCUCHA → IMAGEN')}</span>{card.kind === 'picture-word' ? <><div className="english-picture" aria-hidden="true">{card.word.image}</div><h3>What is it?</h3></> : card.kind === 'word-picture' ? <><h3 className="english-target">{card.word.text}</h3><p>{tr(lang, 'Aukeratu hitzari dagokion irudia.', 'Elige la imagen que corresponde a la palabra.')}</p></> : <><div className="english-listen">🎧</div><h3>Listen and choose the picture</h3></>}
      <div className={card.kind === 'picture-word' ? 'english-answers' : 'english-image-options'}>{card.options.map(option => <button className="answer" key={option.text} onClick={() => choose(option)}>{card.kind === 'picture-word' ? option.text : <><span>{option.image}</span><small>{option.text}</small></>}</button>)}</div><button className="read-button" onClick={() => speak(card.word)}>🔊 Listen</button>{message && <p role="status" className={mistake ? 'gentle-feedback' : 'good-feedback'}>{message}</p>}</div> : <EnglishWordSearch lang={lang} level={level} words={searchWords} onFound={finishSearch} />}
    <p className="learning-note">{level === 'lh1' ? tr(lang, 'LH1: animaliak, koloreak, natura, janaria eta eskolako hitzak.', 'LH1: animales, colores, naturaleza, comida y vocabulario escolar.') : tr(lang, 'LH3: familia, eskola, janaria, eguraldia eta arropa.', 'LH3: familia, escuela, comida, tiempo atmosférico y ropa.')}</p>
  </section>;
}
