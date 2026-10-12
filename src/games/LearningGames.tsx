import { useMemo, useState } from 'react';
import type { GameResult, Language, SchoolLevel } from '../types';
import { calculateStars, shuffle } from '../utils/gameLogic';

type Cell = { letter: string; word: number };
type Word = { text: string; clue: string; icon: string };
const wordSets: Record<SchoolLevel, Word[]> = {
  lh1: [
    { text: 'KATU', clue: 'Etxeko animalia, “miau” egiten du.', icon: '🐱' },
    { text: 'LUR', clue: 'Oinen azpian dago.', icon: '🌱' },
    { text: 'EGUZKI', clue: 'Egunez zeruan distira egiten du.', icon: '☀️' },
  ],
  lh3: [
    { text: 'TXIMELETA', clue: 'Hego koloretsuak dituen intsektua.', icon: '🦋' },
    { text: 'ORTZADAR', clue: 'Euriaren ondoren ager daitekeen kolore arkua.', icon: '🌈' },
    { text: 'BASOA', clue: 'Zuhaitz asko dauden lekua.', icon: '🌳' },
  ],
};
const tr = (lang: Language, eu: string, es: string) => lang === 'eu' ? eu : es;

function makeWordGrid(level: SchoolLevel, words: Word[]): Cell[][] {
  const size = level === 'lh1' ? 7 : 10;
  const grid: Cell[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ letter: '', word: -1 })));
  words.forEach((word, wordIndex) => {
    let placed = false;
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const vertical = Math.random() > .5;
      const dr = vertical ? 1 : 0;
      const dc = vertical ? 0 : 1;
      const r = Math.floor(Math.random() * (size - (vertical ? word.text.length : 0)));
      const c = Math.floor(Math.random() * (size - (vertical ? 0 : word.text.length)));
      const fits = [...word.text].every((letter, i) => {
        const cell = grid[r + dr * i][c + dc * i];
        return !cell.letter;
      });
      if (fits) {
        [...word.text].forEach((letter, i) => { grid[r + dr * i][c + dc * i] = { letter, word: wordIndex }; });
        placed = true;
      }
    }
    if (!placed) {
      const row = grid.findIndex(cells => cells.slice(0, word.text.length).every(cell => !cell.letter));
      [...word.text].forEach((letter, i) => { grid[row][i] = { letter, word: wordIndex }; });
    }
  });
  const filler = 'AEIORNTSL';
  return grid.map(row => row.map(cell => cell.letter ? cell : { letter: filler[Math.floor(Math.random() * filler.length)], word: -1 }));
}

export function WordSearch({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const words = wordSets[level];
  const [grid] = useState(() => makeWordGrid(level, words));
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
    <div className="word-clues"><h3>{tr(lang, 'Bilatu irudien pistak erabiliz', 'Busca con ayuda de las pistas')}</h3>{words.map((word, i) => <div className={`word-clue ${found.includes(i) ? 'done' : ''}`} key={word.text}><span>{word.icon}</span><div><strong>{found.includes(i) ? word.text : '•••••••••'.slice(0, word.text.length)}</strong><small>{word.clue}</small></div>{found.includes(i) && <b>✓</b>}</div>)}<p className="word-preview">{selectedWord || tr(lang, 'Hautatutako letrak hemen', 'Letras seleccionadas')}</p><button className="primary" onClick={checkWord} disabled={selected.length < 2}>{tr(lang, 'Hitza egiaztatu', 'Comprobar palabra')} →</button>{message && <p role="status" className="good-feedback">{message}</p>}</div></div>
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
function optionsFor(answer: number): number[] {
  const choices = new Set([answer]);
  for (const offset of shuffle([-3, -2, -1, 1, 2, 3, 4])) {
    if (answer + offset >= 0) choices.add(answer + offset);
    if (choices.size === 4) break;
  }
  return shuffle([...choices]);
}

export function MathAdventure({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const [round, setRound] = useState(0); const [question, setQuestion] = useState(() => makeMathQuestion(level)); const [choices, setChoices] = useState(() => optionsFor(question.answer));
  const [correct, setCorrect] = useState(0); const [mistake, setMistake] = useState(false); const [message, setMessage] = useState(''); const total = 8;
  const choose = (value: number) => {
    if (value !== question.answer) { setMistake(true); setMessage(tr(lang, 'Zenbatu edo kalkulatu berriro lasai.', 'Cuenta o calcula otra vez con calma.')); return; }
    const score = correct + (mistake ? 0 : 1); setMessage(tr(lang, 'Bai! Aurrera izarretara!', '¡Sí! ¡A por las estrellas!'));
    window.setTimeout(() => {
      if (round + 1 === total) onComplete({ game: 'math', score, correct: score, total, stars: calculateStars(score, total) });
      else { const next = makeMathQuestion(level); setRound(round + 1); setCorrect(score); setQuestion(next); setChoices(optionsFor(next.answer)); setMistake(false); setMessage(''); }
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
const makeVocabRounds = (level: SchoolLevel): VocabRound[] => {
  const selected = shuffle(englishWords[level]).slice(0, 7);
  return selected.map((word, index) => ({
    kind: index < 3 ? 'picture-word' : index < 5 ? 'word-picture' : 'listen-picture',
    word,
    options: shuffle([word, ...shuffle(englishWords[level].filter(item => item.text !== word.text)).slice(0, 2)]),
  }));
};

function EnglishWordSearch({ lang, level, words, onFound }: { lang: Language; level: SchoolLevel; words: EnglishWord[]; onFound: () => void }) {
  const puzzleWords: Word[] = words.map(word => ({ text: word.text, clue: word.text, icon: word.image }));
  const [grid] = useState(() => makeWordGrid(level, puzzleWords));
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
    const wordIndex = puzzleWords.findIndex((word, index) => !found.includes(index) && (word.text === selectedWord || word.text === [...selectedWord].reverse().join('')));
    if (contiguous && wordIndex >= 0 && selected.length === puzzleWords[wordIndex].text.length) {
      const next = [...found, wordIndex]; setFound(next); setSelected([]); setMessage('Great! Word found!');
      if (next.length === puzzleWords.length) onFound();
    } else setMessage(tr(lang, 'Saiatu berriro; begiratu hitzen zerrenda.', 'Prueba otra vez; mira la lista de palabras.'));
  };
  return <div className="english-search"><h3>🔎 Word search</h3><p>{tr(lang, 'Aurkitu hitz hauek letrez letra.', 'Encuentra estas palabras letra a letra.')}</p><div className="english-search-layout"><div className="letter-grid" style={{ '--grid-size': size } as React.CSSProperties}>{grid.flatMap((row, r) => row.map((cell, c) => { const i = r * size + c; return <button key={i} className={`letter-cell ${selected.includes(i) ? 'chosen' : ''} ${found.some(w => cell.word === w) && cell.word >= 0 ? 'word-found' : ''}`} onClick={() => setSelected(current => current.includes(i) ? current.slice(0, current.indexOf(i)) : [...current, i])} aria-label={`${cell.letter}, ${r + 1}, ${c + 1}`}>{cell.letter}</button>; }))}</div><div className="english-word-list">{puzzleWords.map((word, i) => <div className={found.includes(i) ? 'done' : ''} key={word.text}><span>{word.icon}</span><strong>{word.text}</strong>{found.includes(i) && <b>✓</b>}</div>)}<p className="word-preview">{selectedWord}</p><button className="primary" disabled={selected.length < 2} onClick={check}>{tr(lang, 'Egiaztatu', 'Comprobar')} →</button>{message && <p className="good-feedback" role="status">{message}</p>}</div></div></div>;
}

export function EnglishQuest({ lang, level, onComplete }: { lang: Language; level: SchoolLevel; onComplete: (r: GameResult) => void }) {
  const rounds = useMemo(() => makeVocabRounds(level), [level]); const [step, setStep] = useState(0); const [correct, setCorrect] = useState(0); const [mistake, setMistake] = useState(false); const [message, setMessage] = useState(''); const [searchDone, setSearchDone] = useState(false);
  const card = rounds[step]; const searchWords = rounds.slice(0, 4).map(round => round.word); const total = rounds.length + searchWords.length;
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
