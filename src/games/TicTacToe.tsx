import { useEffect, useRef, useState } from 'react';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { chooseTicCpuMove, initialTicBoard, ticWinner, type TicBoard, type TicCell } from '../utils/boardGames';
import { useAnswerFeedback } from './AnswerFeedback';
import './board-games.css';

export function TicTacToe({ lang, level, profile, onComplete }: { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (result: GameResult) => void }) {
  const eu = lang === 'eu';
  const team = profile === 'team';
  const { advancing } = useAnswerFeedback();
  const [board, setBoard] = useState<TicBoard>(initialTicBoard);
  const [turn, setTurn] = useState<TicCell>('X');
  const [result, setResult] = useState<{ winner: TicCell; draw: boolean } | null>(null);
  const completed = useRef(false);
  const cpuTurn = !team && turn === 'O' && !result;
  function place(index: number, mark: TicCell) {
    if (board[index] || result || advancing) return;
    const next = [...board]; next[index] = mark;
    const won = ticWinner(next);
    const tied = !won && next.every(Boolean);
    setBoard(next);
    if (won || tied) setResult({ winner: won, draw: tied });
    else setTurn(mark === 'X' ? 'O' : 'X');
  }

  useEffect(() => {
    if (!cpuTurn || advancing) return;
    const timer = window.setTimeout(() => place(chooseTicCpuMove(board, level), 'O'), 450);
    return () => window.clearTimeout(timer);
  // The timer is tied to the current board and CPU turn.
  }, [cpuTurn, board, level, advancing]);

  useEffect(() => {
    if (!result || completed.current || advancing) return;
    completed.current = true;
    const userMark = 'X';
    const userWon = result.winner === userMark;
    const winningName = team ? (result.winner === 'X' ? 'Nahia' : 'Eider') : (profile === 'eider' ? 'Eider' : 'Nahia');
    const summary = result.draw
      ? (eu ? 'Berdinketa izan da.' : 'La partida ha terminado en empate.')
      : team
        ? (eu ? `${winningName}k irabazi du!` : `¡Ha ganado ${winningName}!`)
        : userWon
          ? (eu ? 'Oso ondo jokatu duzu. Irabazi duzu!' : '¡Muy bien jugado, has ganado!')
          : (eu ? 'Aurkariak irabazi du. Beste partida bat?' : 'Ha ganado el ordenador. ¿Otra partida?');
    const won = team ? !!result.winner : userWon;
    onComplete({ game: 'ticTacToe', score: won ? 1 : 0, correct: won ? 1 : 0, total: 1, stars: won ? 2 : 1, teamWin: team && !!result.winner, summary });
  }, [advancing, eu, onComplete, profile, result, team]);

  const status = result
    ? result.draw ? (eu ? 'Berdinketa!' : '¡Empate!') : team
      ? (eu ? `${result.winner === 'X' ? 'Nahia' : 'Eider'}k irabazi du!` : `¡Ha ganado ${result.winner === 'X' ? 'Nahia' : 'Eider'}!`)
      : result.winner === 'X' ? (eu ? 'Irabazi duzu!' : '¡Has ganado!') : (eu ? 'Ordenagailuak irabazi du.' : 'Ha ganado el ordenador.')
    : team
      ? (eu ? `Txanda: ${turn === 'X' ? 'Nahia' : 'Eider'}` : `Turno de ${turn === 'X' ? 'Nahia' : 'Eider'}`)
      : cpuTurn ? (eu ? 'Ordenagailuaren txanda…' : 'Turno del ordenador…') : (eu ? 'Zure txanda' : 'Tu turno');

  return <section className="game-shell board-game tic-game">
    <div className="game-top"><div><span className="eyebrow">⭕ {eu ? 'HIRU ILARAN' : 'TRES EN RAYA'}</span><h2>{eu ? 'Lerrokatu hiru!' : '¡Alinea tres!'}</h2></div><span className="counter">{status}</span></div>
    <p className="board-game-help">{team ? (eu ? 'Nahiak X erabiltzen du eta Eiderrek O. Txandaka jarri ikurrak hiru lerrokatzeko.' : 'Nahia juega con X y Eider con O. Poned los símbolos por turnos para alinear tres.') : (eu ? 'Zu X zara. Jarri hiru ikur lerroan ordenagailua baino lehen.' : 'Tú juegas con X. Coloca tres símbolos en línea antes que el ordenador.')}</p>
    <div className="tic-board" role="group" aria-label={eu ? 'Hiru ilaran taula' : 'Tablero de tres en raya'}>
      {board.map((cell, index) => <button key={index} className={`tic-cell ${cell ? `mark-${cell.toLowerCase()}` : ''}`} onClick={() => place(index, turn)} disabled={!!result || cpuTurn || advancing || !!cell} aria-label={`${eu ? 'Gelaxka' : 'Casilla'} ${index + 1}${cell ? `, ${cell}` : eu ? ', hutsik' : ', vacía'}`}>
        {cell === 'X' ? '×' : cell === 'O' ? '○' : ''}
      </button>)}
    </div>
    <div className="board-game-legend"><span><b className="tic-x">×</b> {team ? 'Nahia' : (eu ? 'Zu' : 'Tú')}</span><span><b className="tic-o">○</b> {team ? 'Eider' : (eu ? 'Ordenagailua' : 'Ordenador')}</span></div>
    {result && <div className="board-game-result" role="status"><strong>{status}</strong></div>}
  </section>;
}
