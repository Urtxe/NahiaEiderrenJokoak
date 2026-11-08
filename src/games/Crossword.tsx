import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import './Crossword.css';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { calculateStars } from '../utils/gameLogic';
import { makeCrossword, type CrosswordBoard } from '../utils/crossword';

type Props = { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (result: GameResult) => void };
const tr = (lang: Language, eu: string, es: string) => lang === 'eu' ? eu : es;
const previousBoards = new Map<string, string[]>();
const normalize = (word: string) => word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase();

export function Crossword({ lang, level, profile, onComplete }: Props) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const key = `${lang}:${level}:${profile}`;
  const [board] = useState<CrosswordBoard>(() => makeCrossword(lang, level, previousBoards.get(key)));
  const [answers, setAnswers] = useState<string[]>(() => board.entries.map(() => ''));
  const [solved, setSolved] = useState<number[]>([]);
  const [active, setActive] = useState(0);
  const [teamTurn, setTeamTurn] = useState<'nahia' | 'eider'>('nahia');
  const [teamScores, setTeamScores] = useState({ nahia: 0, eider: 0 });
  const [correctCount, setCorrectCount] = useState(0);
  const isTeam = profile === 'team';
  const activeEntry = board.entries[active];
  const submit = () => {
    if (advancing || solved.includes(active) || !answers[active].trim()) return;
    const correct = normalize(answers[active]) === normalize(activeEntry.answer);
    if (correct) {
      const nextSolved = [...solved, active];
      const nextCorrect = correctCount + 1;
      const nextScores = { ...teamScores, ...(isTeam ? { [teamTurn]: teamScores[teamTurn] + 1 } : {}) };
      setSolved(nextSolved); setCorrectCount(nextCorrect); setTeamScores(nextScores);
      setAnswers(current => current.map((answer, index) => index === active ? activeEntry.answer : answer));
      const detail = tr(lang, 'Hitza ondo asmatu duzu!', '¡Has acertado la palabra!');
      if (nextSolved.length === board.entries.length) {
        previousBoards.set(key, board.entries.map(entry => entry.answer));
        let summary = '';
        let teamWin: boolean | undefined;
        if (isTeam) {
          const tie = nextScores.nahia === nextScores.eider;
          summary = tie ? tr(lang, 'Berdinketa! Nahia eta Eider: ', '¡Empate! Nahia y Eider: ') + `${nextScores.nahia}-${nextScores.eider}`
            : `${nextScores.nahia > nextScores.eider ? 'Nahia' : 'Eider'} ${tr(lang, 'irabazi du!', 'ha ganado!')} (${nextScores.nahia}-${nextScores.eider})`;
          teamWin = !tie;
        }
        showFeedback(true, detail, () => onComplete({ game: 'crossword', score: nextCorrect, correct: nextCorrect, total: board.entries.length, stars: calculateStars(nextCorrect, board.entries.length), ...(isTeam ? { teamWin, summary } : {}) }));
      } else {
        setActive(board.entries.findIndex((_, index) => !nextSolved.includes(index)));
        showFeedback(true, detail);
      }
    } else showFeedback(false, tr(lang, 'Begiratu pistari eta saiatu berriro.', 'Mira la pista e inténtalo otra vez.'));
    if (isTeam) setTeamTurn(current => current === 'nahia' ? 'eider' : 'nahia');
  };
  const activeCells = new Set<number>();
  if (activeEntry) [...activeEntry.answer].forEach((_, offset) => activeCells.add((activeEntry.row + (activeEntry.direction === 'down' ? offset : 0)) * board.cells[0].length + activeEntry.column + (activeEntry.direction === 'across' ? offset : 0)));
  const solvedCells = new Set<number>();
  solved.forEach(index => { const entry = board.entries[index]; [...entry.answer].forEach((_, offset) => solvedCells.add((entry.row + (entry.direction === 'down' ? offset : 0)) * board.cells[0].length + entry.column + (entry.direction === 'across' ? offset : 0))); });
  const letters = new Map<number, string>();
  solved.forEach(index => { const entry = board.entries[index]; [...entry.answer].forEach((letter, offset) => letters.set((entry.row + (entry.direction === 'down' ? offset : 0)) * board.cells[0].length + entry.column + (entry.direction === 'across' ? offset : 0), letter)); });
  const startCell = (entry: typeof activeEntry) => entry.row * board.cells[0].length + entry.column;
  const starts = [...new Set(board.entries.map(startCell))].sort((a, b) => a - b);
  const numbers = new Map(starts.map((cell, index) => [cell, index + 1]));
  const across = board.entries.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.direction === 'across');
  const down = board.entries.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.direction === 'down');
  return <section className="game-shell learning-game">
    <div className="game-top"><div><span className="eyebrow">🧩 {tr(lang, 'HITZAK GURUTZATZEN', 'PALABRAS CRUZADAS')}</span><h2>{tr(lang, 'Gurutzatu hitzak', 'Crucigrama')}</h2><p>{tr(lang, 'Aukeratu pista, idatzi hitza eta bete gurutzea.', 'Elige una pista, escribe la palabra y completa el crucigrama.')}</p></div><span className="counter">{solved.length} / {board.entries.length}</span></div>
    {isTeam && <div className="crossword-scores"><span>🌟 Nahia: {teamScores.nahia}</span><span>🌟 Eider: {teamScores.eider}</span><span className="crossword-turn">{tr(lang, 'Txanda:', 'Turno:')} {teamTurn === 'nahia' ? 'Nahia' : 'Eider'}</span></div>}
    <div className="crossword-layout">
      <div className="crossword-board" style={{ gridTemplateColumns: `repeat(${board.cells[0].length}, auto)` }} aria-label={tr(lang, 'Gurutzegramaren taula', 'Cuadrícula del crucigrama')}>
        {board.cells.flatMap((row, r) => row.map((cell, c) => { const i = r * row.length + c; return <div key={`${r}-${c}`} className={`crossword-cell ${cell ? '' : 'empty'} ${activeCells.has(i) ? 'active' : ''} ${solvedCells.has(i) ? 'filled' : ''}`} aria-hidden="true">{cell && numbers.has(i) && <small>{numbers.get(i)}</small>}{cell ? letters.get(i) ?? '' : ''}</div>; }))}
      </div>
      <div className="crossword-clues">
        <p className="crossword-active-clue">{activeEntry.clue}</p>
        {!solved.includes(active) && <form className="crossword-answer" onSubmit={event => { event.preventDefault(); submit(); }}><input autoComplete="off" autoCapitalize="characters" aria-label={tr(lang, 'Idatzi erantzuna', 'Escribe la respuesta')} value={answers[active]} onChange={event => setAnswers(current => current.map((answer, index) => index === active ? event.target.value : answer))} placeholder={tr(lang, 'Idatzi hitza', 'Escribe la palabra')} /><button className="primary" disabled={advancing || !answers[active]?.trim()}>{tr(lang, 'Egiaztatu', 'Comprobar')} →</button></form>}
        <h3>{tr(lang, 'Horizontalak', 'Horizontales')}</h3>
        {across.map(({ entry, index }) => <button type="button" key={index} className={`crossword-clue ${active === index ? 'selected' : ''} ${solved.includes(index) ? 'solved' : ''}`} onClick={() => setActive(index)} disabled={advancing || solved.includes(index)}><strong>{tr(lang, 'Horizontala', 'Horizontal')} {numbers.get(startCell(entry))}</strong><span>{entry.clue}</span></button>)}
        <h3>{tr(lang, 'Bertikalak', 'Verticales')}</h3>
        {down.map(({ entry, index }) => <button type="button" key={index} className={`crossword-clue ${active === index ? 'selected' : ''} ${solved.includes(index) ? 'solved' : ''}`} onClick={() => setActive(index)} disabled={advancing || solved.includes(index)}><strong>{tr(lang, 'Bertikala', 'Vertical')} {numbers.get(startCell(entry))}</strong><span>{entry.clue}</span></button>)}
      </div>
    </div>
  </section>;
}
