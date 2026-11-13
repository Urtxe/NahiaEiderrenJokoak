import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language } from '../types';
import './team-tabletop-games.css';

type Player = 'nahia' | 'eider';
type Game = 'goose' | 'parchis' | 'connect' | 'chess' | 'monopoly';
const games: { id: Game; icon: string; eu: string; es: string }[] = [
  { id: 'goose', icon: '🪿', eu: 'Antzara-jokoa', es: 'La oca' },
  { id: 'parchis', icon: '🎲', eu: 'Parxisa', es: 'Parchís' },
  { id: 'connect', icon: '🔴', eu: 'Lau lerroan', es: 'Cuatro en raya' },
  { id: 'chess', icon: '♟️', eu: 'Xakea', es: 'Ajedrez' },
  { id: 'monopoly', icon: '🏠', eu: 'Monopoly txikia', es: 'Mini Monopoly' },
];
const other = (p: Player): Player => p === 'nahia' ? 'eider' : 'nahia';
const playerName = (p: Player) => p === 'nahia' ? 'Nahia' : 'Eider';
const initialChess = () => ['bR','bN','bB','bQ','bK','bB','bN','bR', ...Array(8).fill('bP'), ...Array(32).fill(''), ...Array(8).fill('wP'), 'wR','wN','wB','wQ','wK','wB','wN','wR'];
type CastleRights = { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
type Move = { from: number; to: number; special?: 'castleK' | 'castleQ' | 'enPassant' };
const xy = (i: number) => [i % 8, Math.floor(i / 8)];
function attacked(board: string[], target: number, by: string) {
  const [tx, ty] = xy(target);
  return board.some((piece, i) => {
    if (!piece || piece[0] !== by) return false;
    const [x, y] = xy(i), dx = tx - x, dy = ty - y, adx = Math.abs(dx), ady = Math.abs(dy);
    switch (piece[1]) {
      case 'P': return adx === 1 && dy === (by === 'w' ? -1 : 1);
      case 'N': return (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
      case 'K': return Math.max(adx, ady) === 1;
      default: {
        const diagonal = adx === ady && adx > 0;
        const straight = (dx === 0) !== (dy === 0);
        if (!(piece[1] === 'B' ? diagonal : piece[1] === 'R' ? straight : diagonal || straight)) return false;
        const sx = Math.sign(dx), sy = Math.sign(dy);
        for (let cx = x + sx, cy = y + sy; cx !== tx || cy !== ty; cx += sx, cy += sy) if (board[cy * 8 + cx]) return false;
        return true;
      }
    }
  });
}
function inCheck(board: string[], side: string) {
  const king = board.indexOf(`${side}K`);
  return king < 0 || attacked(board, king, side === 'w' ? 'b' : 'w');
}
function legalChess(board: string[], side: string, rights: CastleRights, enPassant: number | null): Move[] {
  const result: Move[] = [];
  board.forEach((piece, from) => {
    if (!piece || piece[0] !== side) return;
    const [x, y] = xy(from), kind = piece[1], candidates: number[] = [];
    if (kind === 'P') {
      const d = side === 'w' ? -1 : 1, one = (y + d) * 8 + x;
      if (y + d >= 0 && y + d < 8 && !board[one]) {
        candidates.push(one);
        const two = (y + 2 * d) * 8 + x;
        if (y === (side === 'w' ? 6 : 1) && !board[two]) candidates.push(two);
      }
      for (const dx of [-1, 1]) if (x + dx >= 0 && x + dx < 8 && y + d >= 0 && y + d < 8) {
        const to = (y + d) * 8 + x + dx;
        if (board[to] && board[to][0] !== side) candidates.push(to);
        else if (to === enPassant) candidates.push(to);
      }
    } else if (kind === 'N') {
      for (const [dx, dy] of [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]) if (x + dx >= 0 && x + dx < 8 && y + dy >= 0 && y + dy < 8) candidates.push((y + dy) * 8 + x + dx);
    } else {
      const dirs = kind === 'B' ? [[1,1],[1,-1],[-1,1],[-1,-1]] : kind === 'R' ? [[1,0],[-1,0],[0,1],[0,-1]] : [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dx, dy] of dirs) for (let step = 1; step <= (kind === 'K' ? 1 : 7); step++) {
        const nx = x + dx * step, ny = y + dy * step;
        if (nx < 0 || nx > 7 || ny < 0 || ny > 7) break;
        const to = ny * 8 + nx;
        if (!board[to] || board[to][0] !== side) candidates.push(to);
        if (board[to]) break;
      }
    }
    if (kind === 'K' && !inCheck(board, side)) {
      const home = side === 'w' ? 60 : 4, enemy = side === 'w' ? 'b' : 'w';
      if (from === home) {
        const kingKey = side === 'w' ? 'wK' : 'bK', queenKey = side === 'w' ? 'wQ' : 'bQ';
        const kTransit = home + 1, kDest = home + 2;
        if (rights[kingKey] && board[home + 1] === '' && board[home + 2] === '' && board[home + 3] === `${side}R` && !attacked(board, kTransit, enemy) && !attacked(board, kDest, enemy)) result.push({ from, to: kDest, special: 'castleK' });
        const qTransit = home - 1, qDest = home - 2;
        if (rights[queenKey] && board[home - 1] === '' && board[home - 2] === '' && board[home - 3] === '' && board[home - 4] === `${side}R` && !attacked(board, qTransit, enemy) && !attacked(board, qDest, enemy)) result.push({ from, to: qDest, special: 'castleQ' });
      }
    }
    for (const to of candidates) {
      if (board[to]?.[1] === 'K') continue;
      const next = [...board]; next[to] = piece; next[from] = '';
      if (kind === 'P' && to === enPassant && !board[to]) next[to + (side === 'w' ? 8 : -8)] = '';
      if (kind === 'P' && (Math.floor(to / 8) === 0 || Math.floor(to / 8) === 7)) next[to] = `${side}Q`;
      if (!inCheck(next, side)) result.push({ from, to, ...(kind === 'P' && to === enPassant && !board[to] ? { special: 'enPassant' as const } : {}) });
    }
  });
  return result;
}

export function TeamTabletopGames({ lang, onExit }: { lang: Language; onExit: () => void }) {
  const eu = lang === 'eu', root = useRef<HTMLElement>(null);
  const [game, setGame] = useState<Game>('goose');
  const [starter, setStarter] = useState<Player | null>(null);
  const [turn, setTurn] = useState<Player>('nahia');
  const [wins, setWins] = useState({ nahia: 0, eider: 0, draws: 0 });
  const [goosePos, setGoosePos] = useState({ nahia: -1, eider: -1 });
  const [parchisPos, setParchisPos] = useState({ nahia: -1, eider: -1 });
  const [connectBoard, setConnectBoard] = useState<(Player | null)[]>(Array(42).fill(null));
  const [chessBoard, setChessBoard] = useState(initialChess);
  const [castleRights, setCastleRights] = useState<CastleRights>({ wK: true, wQ: true, bK: true, bQ: true });
  const [enPassant, setEnPassant] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [monopoly, setMonopoly] = useState({ positions: { nahia: 0, eider: 0 }, cash: { nahia: 10000, eider: 10000 }, owners: Array(20).fill(null) as (Player | null)[], lastRoll: 0, pendingBuyer: null as Player | null });
  const [message, setMessage] = useState('');
  const [finished, setFinished] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const legal = useMemo(() => legalChess(chessBoard, turn === 'nahia' ? 'w' : 'b', castleRights, enPassant), [chessBoard, turn, castleRights, enPassant]);
  const label = (en: string, es: string) => eu ? en : es;
  const currentGame = games.find(item => item.id === game)!;
  function chooseGame(next: Game) {
    setGame(next); setStarter(null); setSelected(null); setTurn('nahia'); setMessage('');
    setGoosePos({ nahia: -1, eider: -1 }); setParchisPos({ nahia: -1, eider: -1 }); setConnectBoard(Array(42).fill(null)); setChessBoard(initialChess()); setCastleRights({ wK: true, wQ: true, bK: true, bQ: true }); setEnPassant(null); setFinished(false);
    setMonopoly({ positions: { nahia: 0, eider: 0 }, cash: { nahia: 10000, eider: 10000 }, owners: Array(20).fill(null), lastRoll: 0, pendingBuyer: null });
  }
  function start(p: Player) { setStarter(p); setTurn(p); setMessage(''); setFinished(false); }
  function finish(winner: Player | null, text: string) {
    setFinished(true);
    if (winner) setWins(score => ({ ...score, [winner]: score[winner] + 1 })); else setWins(score => ({ ...score, draws: score.draws + 1 }));
    setMessage(text);
  }
  function rollParchis() {
    if (!starter || message || finished) return;
    const roll = 1 + Math.floor(Math.random() * 6), pos = parchisPos[turn];
    if (pos < 0 && roll !== 6) { setMessage(`${playerName(turn)}: ${roll}. ${label('Sei bat behar dira etxetik ateratzeko.', 'Hace falta un seis para salir de casa.')}`); setTurn(other(turn)); return; }
    const next = pos < 0 ? 0 : pos + roll;
    if (next > 57) { setMessage(`${playerName(turn)}: ${roll}. ${label('Zenbaki zehatza behar da helmugara iristeko.', 'Hace falta el número exacto para llegar a meta.')}`); setTurn(other(turn)); return; }
    const newPos = { ...parchisPos, [turn]: next };
    if (next < 52) {
      const startOffset = turn === 'nahia' ? 0 : 26, absolute = (startOffset + next) % 52;
      const opponentPos = parchisPos[other(turn)];
      const opponentAbsolute = opponentPos >= 0 && opponentPos < 52 ? ((other(turn) === 'nahia' ? 0 : 26) + opponentPos) % 52 : -1;
      if (absolute === opponentAbsolute && ![0, 8, 13, 21, 26, 34, 39, 47].includes(absolute)) { newPos[other(turn)] = -1; setMessage(`${playerName(turn)}: ${roll}. ${label('Aurkaria harrapatu du!', '¡Has comido la ficha rival!')}`); }
      else setMessage(`${playerName(turn)}: ${roll}.`);
    } else setMessage(`${playerName(turn)}: ${roll}.`);
    setParchisPos(newPos);
    if (next === 57) { finish(turn, `${playerName(turn)} ${label('helmugara iritsi da eta irabazi du!', 'ha llegado a meta y ha ganado!')}`); return; }
    if (roll !== 6) setTurn(other(turn));
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (root.current?.requestFullscreen) void root.current.requestFullscreen();
    setFullscreen(!document.fullscreenElement);
  }
  const parchisTrackPosition = (player: Player) => {
    const pos = parchisPos[player];
    return pos >= 0 && pos < 52 ? ((player === 'nahia' ? 0 : 26) + pos) % 52 : -1;
  };
  function rollGoose() {
    if (!starter || message) return;
    const roll = 1 + Math.floor(Math.random() * 6), pos = goosePos[turn];
    let next = pos < 0 ? roll - 1 : pos + roll;
    if (next > 62) next = 62 - (next - 62);
    if (next === 62) { setGoosePos(v => ({ ...v, [turn]: next })); finish(turn, `${playerName(turn)} ${label('irabazi du!', 'ha ganado!')}`); return; }
    const geese = [4, 8, 13, 17, 22, 26, 31, 35, 40, 44, 49, 53, 58];
    const traps: Record<number, number> = { 18: 5, 30: 5, 41: 29, 51: 0, 57: 0 };
    let note = `${playerName(turn)}: ${roll}`;
    if (geese.includes(next)) { next = Math.min(62, next + 4); note += label(' — antzara: aurrera!', ' — ¡oca: avanza!'); }
    else if (traps[next] !== undefined) { next = traps[next]; note += label(' — tranpa!', ' — ¡trampa!'); }
    setGoosePos(v => ({ ...v, [turn]: next })); setMessage(note); setTurn(other(turn));
  }
  function dropConnect(col: number) {
    if (!starter || message) return;
    const row = [5,4,3,2,1,0].find(r => !connectBoard[r * 7 + col]);
    if (row === undefined) return;
    const next = [...connectBoard]; next[row * 7 + col] = turn; setConnectBoard(next);
    const hasWon = next.some((cell, i) => cell === turn && [[1,0],[0,1],[1,1],[1,-1]].some(([dx,dy]) => {
      let count = 1;
      for (const sign of [-1,1]) { let x = i % 7 + dx * sign, y = Math.floor(i / 7) + dy * sign; while (x >= 0 && x < 7 && y >= 0 && y < 6 && next[y * 7 + x] === turn) { count++; x += dx * sign; y += dy * sign; } }
      return count >= 4;
    }));
    if (hasWon) finish(turn, `${playerName(turn)} ${label('irabazi du!', 'ha ganado!')}`);
    else if (next.every(Boolean)) finish(null, label('Berdinketa!', '¡Empate!'));
    else setTurn(other(turn));
  }
  function moveChess(to: number) {
    if (!starter || message) return;
    if (selected === null) { if (chessBoard[to]?.[0] === (turn === 'nahia' ? 'w' : 'b')) setSelected(to); return; }
    const move = legal.find(m => m.from === selected && m.to === to);
    if (!move) { setSelected(chessBoard[to]?.[0] === (turn === 'nahia' ? 'w' : 'b') ? to : null); return; }
    const next = [...chessBoard], piece = next[move.from], taken = next[to]; next[move.from] = ''; next[to] = piece;
    if (move.special === 'enPassant') next[to + (piece[0] === 'w' ? 8 : -8)] = '';
    if (move.special === 'castleK') { next[move.from + 1] = next[move.from + 3]; next[move.from + 3] = ''; }
    if (move.special === 'castleQ') { next[move.from - 1] = next[move.from - 4]; next[move.from - 4] = ''; }
    if (piece[1] === 'P' && (Math.floor(to / 8) === 0 || Math.floor(to / 8) === 7)) next[to] = `${piece[0]}Q`;
    const rights = { ...castleRights };
    if (piece === 'wK') rights.wK = rights.wQ = false;
    if (piece === 'bK') rights.bK = rights.bQ = false;
    if (move.from === 63 || (taken === 'wR' && to === 63)) rights.wK = false;
    if (move.from === 56 || (taken === 'wR' && to === 56)) rights.wQ = false;
    if (move.from === 7 || (taken === 'bR' && to === 7)) rights.bK = false;
    if (move.from === 0 || (taken === 'bR' && to === 0)) rights.bQ = false;
    setCastleRights(rights);
    setEnPassant(piece[1] === 'P' && Math.abs(move.to - move.from) === 16 ? (move.from + move.to) / 2 : null);
    setChessBoard(next); setSelected(null);
    const nextTurn = other(turn), nextMoves = legalChess(next, nextTurn === 'nahia' ? 'w' : 'b', rights, piece[1] === 'P' && Math.abs(move.to - move.from) === 16 ? (move.from + move.to) / 2 : null);
    if (!nextMoves.length) finish(inCheck(next, nextTurn === 'nahia' ? 'w' : 'b') ? turn : null, inCheck(next, nextTurn === 'nahia' ? 'w' : 'b') ? `${playerName(turn)} ${label('irabazi du: xake-mate!', 'gana: ¡jaque mate!')}` : label('Berdinketa: ez dago mugimendurik.', 'Empate: no hay movimientos.'));
    else setTurn(nextTurn);
  }
  function rollMonopoly() {
    if (!starter || message) return;
    const roll = 2 + Math.floor(Math.random() * 11), old = monopoly.positions[turn], nextPos = (old + roll) % 20;
    const passed = old + roll >= 20, cash = { ...monopoly.cash, [turn]: monopoly.cash[turn] + (passed ? 2000 : 0) }, owners = [...monopoly.owners];
    let note = `${playerName(turn)}: ${roll}.`;
    const owner = owners[nextPos];
    if (owner && owner !== turn) { cash[turn] -= 500; cash[owner] += 500; note += label(' Alokairua: 500 txanpon.', ' Alquiler: 500 monedas.'); }
    const buyable = nextPos !== 0 && nextPos % 5 !== 0 && owners[nextPos] === null;
    setMonopoly({ ...monopoly, positions: { ...monopoly.positions, [turn]: nextPos }, cash, owners, lastRoll: roll, pendingBuyer: buyable ? turn : null });
    if (cash[turn] <= 0) { finish(owner, owner ? `${playerName(owner)} ${label('irabazi du!', 'ha ganado!')}` : label('Jokoa amaitu da.', 'La partida ha terminado.')); }
    else { setMessage(note); setTurn(other(turn)); }
  }
  function buyProperty() {
    const buyer = monopoly.pendingBuyer;
    if (!buyer) return;
    const pos = monopoly.positions[buyer], owners = [...monopoly.owners], cash = { ...monopoly.cash };
    if (cash[buyer] < 2000 || owners[pos] !== null) return;
    cash[buyer] -= 2000; owners[pos] = buyer; setMonopoly({ ...monopoly, owners, cash, pendingBuyer: null }); setMessage(`${playerName(buyer)} ${label('etxea erosi du!', 'ha comprado la casa!')}`);
  }
  const boardGame = game === 'parchis' ? (
    <div className="tt-parchis">
      <div className="tt-parchis-yards"><span className={parchisPos.nahia < 0 ? 'token-home nahia' : ''}>🦋 {parchisPos.nahia < 0 ? label('Nahia etxean', 'Nahia en casa') : 'Nahia'}</span><span className={parchisPos.eider < 0 ? 'token-home eider' : ''}>🌼 {parchisPos.eider < 0 ? label('Eider etxean', 'Eider en casa') : 'Eider'}</span></div>
      <div className="tt-parchis-track" role="group" aria-label={label('Parxisaren bidea', 'Recorrido del parchís')}>
        {Array.from({ length: 52 }, (_, i) => <div key={i} className={`tt-parchis-cell ${[0, 8, 13, 21, 26, 34, 39, 47].includes(i) ? 'safe' : ''} ${parchisTrackPosition('nahia') === i ? 'nahia' : ''} ${parchisTrackPosition('eider') === i ? 'eider' : ''}`}><small>{[0, 8, 13, 21, 26, 34, 39, 47].includes(i) ? '🛡️' : i + 1}</small>{parchisTrackPosition('nahia') === i && '🦋'}{parchisTrackPosition('eider') === i && '🌼'}</div>)}
      </div>
      <div className="tt-parchis-lanes"><div><strong>🦋 Nahia</strong><div className="tt-parchis-lane">{Array.from({ length: 6 }, (_, i) => <span key={i} className={parchisPos.nahia === i + 52 ? 'nahia' : ''}>{parchisPos.nahia === i + 52 ? '🦋' : i + 1}</span>)}</div></div><div><strong>🌼 Eider</strong><div className="tt-parchis-lane">{Array.from({ length: 6 }, (_, i) => <span key={i} className={parchisPos.eider === i + 52 ? 'eider' : ''}>{parchisPos.eider === i + 52 ? '🌼' : i + 1}</span>)}</div></div></div>
      {starter && <button className="tt-action" onClick={rollParchis} disabled={!!message || finished}>{label('🎲 Dadoa bota', '🎲 Tirar dado')}</button>}
    </div>
  ) : game === 'monopoly' ? (
    <div className="tt-monopoly"><div className="tt-city-board">{Array.from({ length: 20 }, (_, i) => <div key={i} className={`tt-city-tile ${monopoly.positions.nahia === i ? 'has-nahia' : ''} ${monopoly.positions.eider === i ? 'has-eider' : ''}`}><small>{i === 0 ? '🚩' : i % 5 === 0 ? '🎁' : '🏠'}</small><b>{i === 0 ? label('HASIERA', 'SALIDA') : `${(i * 350) % 1800 + 400}💰`}</b>{monopoly.owners[i] && <i>{playerName(monopoly.owners[i]!)}</i>}{monopoly.positions.nahia === i && <span>🦋</span>}{monopoly.positions.eider === i && <span>🌼</span>}</div>)}</div><div className="tt-cash"><span>🦋 Nahia <b>{monopoly.cash.nahia}💰</b></span><span>🌼 Eider <b>{monopoly.cash.eider}💰</b></span></div>{starter && <button className="tt-action" disabled={!!message} onClick={rollMonopoly}>{label('🎲 Dadoa bota', '🎲 Tirar dado')}</button>}{monopoly.pendingBuyer && monopoly.cash[monopoly.pendingBuyer] >= 2000 && <button className="tt-action secondary" onClick={buyProperty}>{label('🏠 Erosi (2000)', '🏠 Comprar (2000)')}</button>}</div>
  ) : game === 'chess' ? (
    <div className="tt-chess" role="grid" aria-label={label('Xake-taula', 'Tablero de ajedrez')}>{chessBoard.map((piece, i) => <button key={i} role="gridcell" className={`${(Math.floor(i / 8) + i % 8) % 2 ? 'dark' : 'light'} ${selected === i ? 'selected' : ''} ${legal.some(m => m.from === selected && m.to === i) ? 'target' : ''}`} aria-label={`${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)} ${piece}`} disabled={!starter || !!message} onClick={() => moveChess(i)}>{piece && <span className={piece[0] === 'w' ? 'white-piece' : 'black-piece'}>{({ wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟' } as Record<string,string>)[piece]}</span>}</button>)}</div>
  ) : game === 'connect' ? (
    <div className="tt-connect" role="group" aria-label={label('Lau lerroan taula', 'Tablero de cuatro en raya')}>{Array.from({ length: 7 }, (_, col) => <button key={col} className="tt-column" aria-label={`${label('Zutabea', 'Columna')} ${col + 1}`} onClick={() => dropConnect(col)} disabled={!starter || !!message}>{connectBoard.filter((_, i) => i % 7 === col).map((cell, row) => <span key={row} className={`tt-hole ${cell ?? ''}`} />)}</button>)}</div>
  ) : (
    <div className="tt-goose"><div className="tt-track">{Array.from({ length: 63 }, (_, i) => <div key={i} className={`tt-space ${[4,8,13,17,22,26,31,35,40,44,49,53,58].includes(i) ? 'goose' : ''} ${i === 18 || i === 30 || i === 41 || i === 51 || i === 57 ? 'trap' : ''}`}><small>{i + 1}</small>{goosePos.nahia === i && '🦋'}{goosePos.eider === i && '🌼'}{[4,8,13,17,22,26,31,35,40,44,49,53,58].includes(i) && '🪿'}</div>)}</div>{starter && <button className="tt-action" onClick={rollGoose} disabled={!!message}>{label('🎲 Dadoa bota', '🎲 Tirar dado')}</button>}</div>
  );
  const rules: Record<Game, [string,string]> = {
    goose: ['Txandaka dadoa bota eta 63ra iritsi. Antzarak aurrera eramaten zaitu; tranpek atzera.', 'Tirad el dado por turnos y llegad a la casilla 63. Las ocas avanzan; las trampas hacen retroceder.'],
    parchis: ['Bertsio sinplifikatua da: jokalari bakoitzak fitxa bakarra du. Sei atera behar da etxetik; egin 52 laukiko bidea eta sei laukiko zure helmuga. Seiak beste txanda ematen du, eta aurkaria harrapatzean etxera itzultzen da. Helmugara zenbaki zehatzarekin iritsi behar da.', 'Versión simplificada: cada persona juega con una sola ficha. Hay que sacar un seis para salir; recorre las 52 casillas y entra en tu pasillo final de seis. El seis da otro turno; si comes a la rival, vuelve a casa. Hay que llegar con número exacto.'],
    connect: ['Txandaka koloreko pieza bat erori. Lau jarraian lerrokatzen duenak irabaziko du.', 'Dejad caer una ficha por turnos. Gana quien alinee cuatro seguidas.'],
    chess: ['Aukeratu pieza eta helmuga. Xake-mateak irabazten du. Enrokea eta harrapaketa al paso daude; peoia dama bihurtzen da amaierara iristean.', 'Selecciona una pieza y su destino. Gana quien dé jaque mate. Se permiten enroque y captura al paso; el peón se convierte en dama al llegar al final.'],
    monopoly: ['Dadoa bota, hirian ibili eta etxe hutsak erosi. Beste jokalariaren etxean gelditzean 500 ordaindu. 0 txanponekin galtzen duzu.', 'Tirad, recorred la ciudad y comprad casas libres. Al caer en la casa de la otra persona pagáis 500. Con 0 monedas pierdes.'],
  };
  return <section ref={root} className="team-tabletop-games">
    <header className="tt-header"><div><span className="eyebrow">🤝 {label('ELKARREKIN JOLASTEKO', 'JUEGOS PARA JUGAR JUNTAS')}</span><h1>{currentGame.icon} {eu ? currentGame.eu : currentGame.es}</h1></div><div className="tt-tools"><button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? label('Pantaila osotik atera', 'Salir de pantalla completa') : label('Pantaila osoa', 'Pantalla completa')}>{fullscreen ? '↙' : '⛶'}</button><button type="button" onClick={onExit} aria-label={label('Itxi jokoak', 'Cerrar juegos')}>✕</button></div></header>
    <nav className="tt-game-picker" aria-label={label('Aukeratu jokoa', 'Elegir juego')}>{games.map(item => <button type="button" key={item.id} className={game === item.id ? 'active' : ''} onClick={() => chooseGame(item.id)}>{item.icon} <span>{eu ? item.eu : item.es}</span></button>)}</nav>
    <div className="tt-score" aria-live="polite"><span>🦋 Nahia <b>{wins.nahia}</b></span><span>{label('Berdinketak', 'Empates')} <b>{wins.draws}</b></span><span>🌼 Eider <b>{wins.eider}</b></span></div>
    <p className="tt-rules">{eu ? rules[game][0] : rules[game][1]}</p>
    {!starter ? <fieldset className="tt-starter"><legend>{label('Nork hasiko du?', '¿Quién empieza?')}</legend><button type="button" onClick={() => start('nahia')}>🦋 Nahia</button><button type="button" onClick={() => start('eider')}>🌼 Eider</button></fieldset> : <div className="tt-status"><strong>{message || `${label('Txanda', 'Turno')}: ${playerName(turn)}`}</strong>{finished && <button type="button" className="tt-action" onClick={() => chooseGame(game)}>{label('Berriz jokatu', 'Jugar otra vez')}</button>}{message && !finished && <button type="button" className="tt-action" onClick={() => { setMessage(''); setMonopoly(m => ({ ...m, pendingBuyer: null })); }}>{label('Jarraitu', 'Continuar')}</button>}</div>}
    {boardGame}
    <p className="tt-current">{starter && !message ? `${label('Orain', 'Ahora')}: ${playerName(turn)}` : ''}</p>
  </section>;
}
