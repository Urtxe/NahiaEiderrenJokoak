import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { applyCheckersMove, checkersContinuation, checkersPositionKey, initialCheckersBoard, legalCheckersMoves, type CheckersBoard, type CheckersMove, type CheckersSide } from '../utils/boardGames';
import { useAnswerFeedback } from './AnswerFeedback';
import { TeamMatchControls, type TeamScore } from './TeamMatchControls';
import './board-games.css';

type Outcome = { winner: CheckersSide | null; draw: boolean };

function cpuMove(board: CheckersBoard, moves: CheckersMove[], level: SchoolLevel): CheckersMove {
  if (level === 'lh1') return moves[Math.floor(Math.random() * moves.length)];
  const ranked = moves.map(move => {
    const piece = board[move.from]!;
    const next = applyCheckersMove(board, move);
    const enemyMoves = legalCheckersMoves(next, piece.side === 'nahia' ? 'eider' : 'nahia');
    const danger = enemyMoves.some(m => m.captures.includes(move.to));
    return { move, value: move.captures.length * 8 + (next[move.to]?.king && !piece.king ? 4 : 0) - (danger ? 5 : 0) + Math.random() };
  });
  return ranked.sort((a, b) => b.value - a.value)[0].move;
}

export function Checkers({ lang, level, profile, onComplete }: { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (result: GameResult) => void }) {
  const eu = lang === 'eu';
  const team = profile === 'team';
  const { advancing } = useAnswerFeedback();
  const userSide: CheckersSide = profile === 'eider' ? 'eider' : 'nahia';
  const sideName = (side: CheckersSide) => !team && side !== userSide ? (eu ? 'Ordenagailua' : 'Ordenador') : side === 'nahia' ? 'Nahia' : 'Eider';
  const [board, setBoard] = useState(initialCheckersBoard);
  const [turn, setTurn] = useState<CheckersSide>(profile === 'team' ? 'nahia' : userSide);
  const [selected, setSelected] = useState<number | null>(null);
  const [chain, setChain] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [plies, setPlies] = useState(0);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [choosingStarter, setChoosingStarter] = useState(team);
  const [score, setScore] = useState<TeamScore>({ nahia: 0, eider: 0, draws: 0 });
  const completed = useRef(false);
  const cpuTurn = profile !== 'team' && turn !== userSide;
  const legal = useMemo(() => {
    const moves = legalCheckersMoves(board, turn);
    return chain ? moves.filter(move => move.from === selected) : moves;
  }, [board, turn, chain, selected]);
  const choices = selected === null ? [] : legal.filter(m => m.from === selected);

  useEffect(() => {
    if (choosingStarter || outcome || legal.length) return;
    const winner = turn === 'nahia' ? 'eider' : 'nahia';
    setOutcome({ winner, draw: false });
  }, [choosingStarter, legal.length, outcome, turn]);

  useEffect(() => {
    if (!cpuTurn || outcome || advancing || !legal.length) return;
    const timer = window.setTimeout(() => makeMove(cpuMove(board, legal, level)), 550);
    return () => window.clearTimeout(timer);
  // legal and board represent this exact CPU position.
  }, [cpuTurn, outcome, board, legal, level, advancing]);

  useEffect(() => {
    if (!outcome || completed.current || advancing) return;
    completed.current = true;
    if (team) {
      const key = outcome.draw ? 'draws' : outcome.winner!;
      setScore(current => ({ ...current, [key]: current[key] + 1 }));
    }
    const message = outcome.draw
      ? (eu ? 'Berdinketa izan da.' : 'La partida ha terminado en empate.')
      : (eu ? `${sideName(outcome.winner!)}k irabazi du!` : `¡Ha ganado ${sideName(outcome.winner!)}!`);
    const won = profile === 'team' ? !!outcome.winner : outcome.winner === userSide;
    onComplete({ game: 'checkers', score: won ? 1 : 0, correct: won ? 1 : 0, total: 1, stars: won ? 2 : 1, teamWin: profile === 'team' && !!outcome.winner, summary: message });
  }, [advancing, eu, onComplete, outcome, profile, userSide]);

  function makeMove(move: CheckersMove) {
    if (choosingStarter || outcome || advancing) return;
    const next = applyCheckersMove(board, move);
    const nextPlies = plies + 1;
    const sameTurn = checkersContinuation(next, move).length > 0;
    const nextTurn = sameTurn ? turn : turn === 'nahia' ? 'eider' : 'nahia';
    const key = checkersPositionKey(next, nextTurn);
    const count = (positions[key] ?? 0) + 1;
    setBoard(next); setPlies(nextPlies); setPositions(current => ({ ...current, [key]: count }));
    if (count >= 3 || nextPlies >= 100) setOutcome({ winner: null, draw: true });
    setTurn(nextTurn);
    setSelected(sameTurn ? move.to : null);
    setChain(sameTurn);
  }

  function activate(index: number) {
    if (choosingStarter || outcome || cpuTurn || advancing) return;
    const move = choices.find(item => item.to === index);
    if (move) { makeMove(move); return; }
    if (!chain && legal.some(item => item.from === index)) setSelected(index);
  }

  function replay() {
    setBoard(initialCheckersBoard());
    setTurn(team ? 'nahia' : userSide);
    setSelected(null);
    setChain(false);
    setOutcome(null);
    setPlies(0);
    setPositions({});
    setChoosingStarter(team);
    completed.current = false;
  }

  const turnText = choosingStarter ? (eu ? 'Aukeratu nor hasiko den' : 'Elegid quién empieza') : outcome
    ? (outcome.draw ? (eu ? 'Berdinketa!' : '¡Empate!') : (eu ? `${sideName(outcome.winner!)}k irabazi du!` : `¡Ha ganado ${sideName(outcome.winner!)}!`))
    : chain
    ? (eu ? 'Jokalari berarekin jarraitu behar duzu.' : 'Debes seguir saltando con la misma ficha.')
    : (eu ? `Txanda: ${sideName(turn)}` : `Turno de ${sideName(turn)}`);

  return <section className="game-shell board-game checkers-game">
    <div className="game-top"><div><span className="eyebrow">♟️ {eu ? 'DAMAK' : 'DAMAS'}</span><h2>{eu ? 'Jokatu txandaka' : 'Jugad por turnos'}</h2></div><span className="counter">{turnText}</span></div>
    <p className="board-game-help">{eu ? 'Mugitu diagonalean. Jauzi egin dezakezunean, derrigorrezkoa da; pieza bera erabiliz beste jauzi bat egin behar baduzu, jarraitu. Azken ilarara iristean dama bihurtuko da. Hiru posizio berdin edo 100 mugimenduren ondoren berdinketa da.' : 'Muévete en diagonal. Si puedes saltar, es obligatorio; si la misma ficha puede volver a saltar, continúa. Al llegar al otro extremo, la ficha se convierte en dama. Hay empate si se repite tres veces una posición o tras 100 movimientos.'}</p>
    {team && <TeamMatchControls lang={lang} score={score} choosingStarter={choosingStarter} disabled={advancing} onStart={side => { setTurn(side); setChoosingStarter(false); }} />}
    <div className="checkers-board" role="group" aria-label={eu ? 'Dama-taula' : 'Tablero de damas'}>
      {board.map((piece, index) => {
        const dest = choices.find(m => m.to === index);
        const row = Math.floor(index / 8), col = index % 8;
        const tile = `(${row + 1}, ${col + 1})`;
        const description = piece ? `${sideName(piece.side)}${piece.king ? ', dama' : (eu ? ', fitxa' : ', ficha')}` : (eu ? 'hutsik' : 'vacía');
        return <button key={index} className={`checkers-square ${(row + col) % 2 ? 'dark' : 'light'} ${selected === index ? 'selected' : ''} ${dest ? 'destination' : ''}`} onClick={() => activate(index)} disabled={choosingStarter || !!outcome || cpuTurn || advancing || (row + col) % 2 === 0} aria-label={`${tile}, ${description}${dest ? (eu ? ', helmuga' : ', destino') : ''}`} aria-pressed={selected === index}>
          {dest && <span className="checkers-dot" aria-hidden="true" />}
          {piece && <span aria-hidden="true" className={`checker-piece ${piece.side} ${piece.king ? 'king' : ''}`}>{piece.king ? '♛' : ''}</span>}
        </button>;
      })}
    </div>
    <div className="board-game-legend"><span><i className="checker-swatch nahia" />{sideName('nahia')}</span><span><i className="checker-swatch eider" />{sideName('eider')}</span></div>
    {outcome && <div className="board-game-result" role="status"><strong>{turnText}</strong>{team && <button className="primary" onClick={replay} disabled={advancing}>{eu ? 'Berriro jolastu' : 'Volver a jugar'}</button>}</div>}
  </section>;
}
