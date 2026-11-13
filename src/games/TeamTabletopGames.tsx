import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Language } from '../types';
import './team-tabletop-games.css';

type Player = 'nahia' | 'eider';
type Game = 'goose' | 'parchis' | 'connect' | 'chess' | 'monopoly';
const players: Player[] = ['nahia', 'eider'];
const playerName = (player: Player) => player === 'nahia' ? 'Nahia' : 'Eider';
const other = (player: Player): Player => player === 'nahia' ? 'eider' : 'nahia';
const games: { id: Game; icon: string; eu: string; es: string }[] = [
  { id: 'goose', icon: '🪿', eu: 'Antzara-jokoa', es: 'La oca' },
  { id: 'parchis', icon: '🎲', eu: 'Parxisa', es: 'Parchís' },
  { id: 'connect', icon: '🔴', eu: 'Lau lerroan', es: 'Cuatro en raya' },
  { id: 'chess', icon: '♟️', eu: 'Xakea', es: 'Ajedrez' },
  { id: 'monopoly', icon: '🏙️', eu: 'Hiriak eta propietateak', es: 'Ciudad y propiedades' },
];

type ChessRights = { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
type ChessMove = { from: number; to: number; special?: 'castleK' | 'castleQ' | 'enPassant' };
const initialChess = () => ['bR','bN','bB','bQ','bK','bB','bN','bR', ...Array(8).fill('bP'), ...Array(32).fill(''), ...Array(8).fill('wP'), 'wR','wN','wB','wQ','wK','wB','wN','wR'];
const chessXY = (i: number) => [i % 8, Math.floor(i / 8)];

function attacked(board: string[], target: number, by: string) {
  const [tx, ty] = chessXY(target);
  return board.some((piece, i) => {
    if (!piece || piece[0] !== by) return false;
    const [x, y] = chessXY(i), dx = tx - x, dy = ty - y, adx = Math.abs(dx), ady = Math.abs(dy);
    switch (piece[1]) {
      case 'P': return adx === 1 && dy === (by === 'w' ? -1 : 1);
      case 'N': return (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
      case 'K': return Math.max(adx, ady) === 1;
      default: {
        const diagonal = adx === ady && adx > 0, straight = (dx === 0) !== (dy === 0);
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

function legalChess(board: string[], side: string, rights: ChessRights, enPassant: number | null): ChessMove[] {
  const result: ChessMove[] = [];
  board.forEach((piece, from) => {
    if (!piece || piece[0] !== side) return;
    const [x, y] = chessXY(from), kind = piece[1], candidates: number[] = [];
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
      for (const [dx, dy] of [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]) {
        if (x + dx >= 0 && x + dx < 8 && y + dy >= 0 && y + dy < 8) candidates.push((y + dy) * 8 + x + dx);
      }
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
        if (rights[kingKey] && board[home + 1] === '' && board[home + 2] === '' && board[home + 3] === `${side}R` && !attacked(board, home + 1, enemy) && !attacked(board, home + 2, enemy)) result.push({ from, to: home + 2, special: 'castleK' });
        if (rights[queenKey] && board[home - 1] === '' && board[home - 2] === '' && board[home - 3] === '' && board[home - 4] === `${side}R` && !attacked(board, home - 1, enemy) && !attacked(board, home - 2, enemy)) result.push({ from, to: home - 2, special: 'castleQ' });
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

type GooseState = { positions: Record<Player, number>; skips: Record<Player, number> };
const gooseState = (): GooseState => ({ positions: { nahia: -1, eider: -1 }, skips: { nahia: 0, eider: 0 } });
const gooseSquares = new Set([4,8,13,17,22,26,31,35,40,44,49,53,58]);
const gooseSpiral = (() => {
  const result: { row: number; col: number }[] = [];
  let top = 0, left = 0, bottom = 8, right = 8;
  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col++) result.push({ row: top, col });
    top++;
    for (let row = top; row <= bottom; row++) result.push({ row, col: right });
    right--;
    for (let col = right; col >= left; col--) result.push({ row: bottom, col });
    bottom--;
    for (let row = bottom; row >= top; row--) result.push({ row, col: left });
    left++;
  }
  return result.slice(0, 63);
})();

type ParchisState = { pieces: Record<Player, number[]> };
const parchisState = (): ParchisState => ({ pieces: { nahia: [-1,-1,-1,-1], eider: [-1,-1,-1,-1] } });
const parchisRoute = (() => {
  const cells: { row: number; col: number }[] = [];
  const max = 17;
  for (let col = 0; col <= max; col++) cells.push({ row: 0, col });
  for (let row = 1; row <= max; row++) cells.push({ row, col: max });
  for (let col = max - 1; col >= 0; col--) cells.push({ row: max, col });
  for (let row = max - 1; row >= 1; row--) cells.push({ row, col: 0 });
  return cells;
})();
const parchisStarts: Record<Player, number> = { nahia: 64, eider: 30 };
const parchisSafe = new Set([0,5,12,17,22,29,30,34,39,46,51,56,63,64]);
const movableParchisPieces = (state: ParchisState, player: Player, roll: number) => {
  const own = state.pieces[player], home = own.map((position,index) => position < 0 ? index : -1).filter(index => index >= 0);
  if (roll === 5 && home.length) return own.includes(0) ? [] : home;
  return own.map((position,index) => {
    const target = position+roll;
    if (position < 0 || position >= 69 || target > 69) return -1;
    if (position < 63) for (let step=position+1; step<=Math.min(target,62); step++) {
      const absolute = (parchisStarts[player]+step)%68;
      const atSquare = (side:Player) => state.pieces[side].filter(candidate => candidate>=0&&candidate<63&&(parchisStarts[side]+candidate)%68===absolute).length;
      const ownCount = atSquare(player), rivalCount = atSquare(other(player));
      if (ownCount>=2 || rivalCount>=2) return -1;
      if (step===target && parchisSafe.has(absolute) && rivalCount>0) return -1;
    }
    return index;
  }).filter(index => index >= 0);
};

type PropertyGroup = 'meadow'|'shore'|'orchard'|'harbor'|'garden'|'market'|'skyline'|'crown';
type PropertyTile = { name: string; type: 'start'|'property'|'community'|'tax'|'rail'|'chance'|'jail'|'parking'|'gotoJail'|'utility'; icon: string; price?: number; rent?: number; group?: PropertyGroup; tax?: number };
const propertyTiles: PropertyTile[] = [
  { name: 'Salida', type: 'start', icon: '🚩' },
  { name: 'Calle Olmo', type: 'property', icon: '🌳', price: 60, rent: 2, group: 'meadow' },
  { name: 'Caja común', type: 'community', icon: '🎁' },
  { name: 'Calle Haya', type: 'property', icon: '🌿', price: 60, rent: 4, group: 'meadow' },
  { name: 'Impuesto municipal', type: 'tax', icon: '🧾', tax: 200 },
  { name: 'Estación Central', type: 'rail', icon: '🚉', price: 200 },
  { name: 'Paseo del Prado', type: 'property', icon: '🌼', price: 100, rent: 6, group: 'shore' },
  { name: 'Suerte', type: 'chance', icon: '✨' },
  { name: 'Plaza del Lago', type: 'property', icon: '⛲', price: 100, rent: 6, group: 'shore' },
  { name: 'Calle Nube', type: 'property', icon: '☁️', price: 120, rent: 8, group: 'shore' },
  { name: 'Visita / descanso', type: 'jail', icon: '🛟' },
  { name: 'Calle Luna', type: 'property', icon: '🌙', price: 140, rent: 10, group: 'orchard' },
  { name: 'Compañía eléctrica', type: 'utility', icon: '⚡', price: 150 },
  { name: 'Paseo Verde', type: 'property', icon: '🍀', price: 140, rent: 10, group: 'orchard' },
  { name: 'Plaza Mayor', type: 'property', icon: '🏛️', price: 160, rent: 12, group: 'orchard' },
  { name: 'Estación del Oeste', type: 'rail', icon: '🚉', price: 200 },
  { name: 'Jardín de Luz', type: 'property', icon: '🌷', price: 180, rent: 14, group: 'harbor' },
  { name: 'Caja común', type: 'community', icon: '🎁' },
  { name: 'Paseo de las Flores', type: 'property', icon: '🌺', price: 180, rent: 14, group: 'harbor' },
  { name: 'Avenida Estrella', type: 'property', icon: '⭐', price: 200, rent: 16, group: 'harbor' },
  { name: 'Aparcamiento libre', type: 'parking', icon: '🅿️' },
  { name: 'Calle Rocío', type: 'property', icon: '🌧️', price: 220, rent: 18, group: 'garden' },
  { name: 'Suerte', type: 'chance', icon: '✨' },
  { name: 'Plaza del Bosque', type: 'property', icon: '🌲', price: 220, rent: 18, group: 'garden' },
  { name: 'Calle Arcoíris', type: 'property', icon: '🌈', price: 240, rent: 20, group: 'garden' },
  { name: 'Estación del Río', type: 'rail', icon: '🚉', price: 200 },
  { name: 'Puente del Río', type: 'property', icon: '🌉', price: 260, rent: 22, group: 'market' },
  { name: 'Avenida Horizonte', type: 'property', icon: '🌅', price: 260, rent: 22, group: 'market' },
  { name: 'Compañía de agua', type: 'utility', icon: '💧', price: 150 },
  { name: 'Parque Alto', type: 'property', icon: '🌳', price: 280, rent: 24, group: 'market' },
  { name: 'Ve a la pausa', type: 'gotoJail', icon: '🚨' },
  { name: 'Calle Brisa', type: 'property', icon: '🍃', price: 300, rent: 26, group: 'skyline' },
  { name: 'Calle del Mar', type: 'property', icon: '🌊', price: 300, rent: 26, group: 'skyline' },
  { name: 'Caja común', type: 'community', icon: '🎁' },
  { name: 'Avenida del Sol', type: 'property', icon: '☀️', price: 320, rent: 28, group: 'skyline' },
  { name: 'Estación del Faro', type: 'rail', icon: '🚉', price: 200 },
  { name: 'Suerte', type: 'chance', icon: '✨' },
  { name: 'Plaza Aurora', type: 'property', icon: '🌌', price: 350, rent: 35, group: 'crown' },
  { name: 'Tasa de servicios', type: 'tax', icon: '🧾', tax: 100 },
  { name: 'Gran Avenida', type: 'property', icon: '🏙️', price: 400, rent: 50, group: 'crown' },
];
const groupColors: Record<PropertyGroup, string> = { meadow:'#8c5a43', shore:'#a8d9fa', orchard:'#d991d1', harbor:'#f09178', garden:'#f5cd67', market:'#ee9a55', skyline:'#81c8a6', crown:'#a2a6b2' };
const groupHouses: Record<PropertyGroup, number> = { meadow:50, shore:50, orchard:100, harbor:100, garden:150, market:150, skyline:200, crown:200 };
type MonopolyState = {
  positions: Record<Player, number>;
  cash: Record<Player, number>;
  owners: (Player | null)[];
  houses: number[];
  jailed: Record<Player, boolean>;
  jailAttempts: Record<Player, number>;
  doubles: Record<Player, number>;
};
const monopolyState = (): MonopolyState => ({ positions:{nahia:0,eider:0}, cash:{nahia:1500,eider:1500}, owners:Array(40).fill(null), houses:Array(40).fill(0), jailed:{nahia:false,eider:false}, jailAttempts:{nahia:0,eider:0}, doubles:{nahia:0,eider:0} });
const propertyRent = (index: number, state: MonopolyState, roll: number) => {
  const tile = propertyTiles[index], owner = state.owners[index];
  if (!owner) return 0;
  if (tile.type === 'rail') return 25 * (2 ** (state.owners.filter((candidate, i) => candidate === owner && propertyTiles[i].type === 'rail').length - 1));
  if (tile.type === 'utility') {
    const count = state.owners.filter((candidate, i) => candidate === owner && propertyTiles[i].type === 'utility').length;
    return roll * (count > 1 ? 10 : 4);
  }
  if (tile.type !== 'property' || !tile.rent || !tile.group) return 0;
  const group = propertyTiles.map((candidate, i) => candidate.group === tile.group ? i : -1).filter(i => i >= 0);
  const ownsSet = group.every(i => state.owners[i] === owner);
  const houses = state.houses[index];
  if (houses > 0) return tile.rent * [1,5,15,45,80,125][houses];
  return tile.rent * (ownsSet ? 2 : 1);
};

function boardCoordinate(index: number) {
  if (index === 0) return { row:11, col:11 };
  if (index <= 9) return { row:11, col:11-index };
  if (index === 10) return { row:11, col:1 };
  if (index <= 19) return { row:21-index, col:1 };
  if (index === 20) return { row:1, col:1 };
  if (index <= 29) return { row:1, col:index-19 };
  if (index === 30) return { row:1, col:11 };
  return { row:index-29, col:11 };
}

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  return <div className={`tt-die ${rolling ? 'rolling' : ''}`} data-value={value} aria-label={rolling ? 'Dado girando' : `Dado: ${value}`}>
    {Array.from({ length:9 }, (_, i) => <i className="tt-pip" key={i} />)}
  </div>;
}

function pawnIcon(player: Player) { return player === 'nahia' ? '🦋' : '🌼'; }

export function TeamTabletopGames({ lang, onExit }: { lang: Language; onExit: () => void }) {
  const eu = lang === 'eu';
  const root = useRef<HTMLElement>(null);
  const rollTimer = useRef<number | null>(null);
  const label = (euText: string, esText: string) => eu ? euText : esText;
  const [game, setGame] = useState<Game>('goose');
  const [starter, setStarter] = useState<Player | null>(null);
  const [turn, setTurn] = useState<Player>('nahia');
  const [wins, setWins] = useState({ nahia:0, eider:0, draws:0 });
  const [message, setMessage] = useState('');
  const [finished, setFinished] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [dice, setDice] = useState([1,1]);
  const [rolling, setRolling] = useState(false);
  const [goose, setGoose] = useState<GooseState>(gooseState);
  const [parchis, setParchis] = useState<ParchisState>(parchisState);
  const [parchisRoll, setParchisRoll] = useState<number | null>(null);
  const [parchisBonus, setParchisBonus] = useState(false);
  const [parchisBonusKeepsTurn, setParchisBonusKeepsTurn] = useState(false);
  const [parchisSixes, setParchisSixes] = useState(0);
  const [parchisLastMoved, setParchisLastMoved] = useState<Record<Player, number | null>>({ nahia:null, eider:null });
  const [connectBoard, setConnectBoard] = useState<(Player | null)[]>(Array(42).fill(null));
  const [chessBoard, setChessBoard] = useState(initialChess);
  const [castleRights, setCastleRights] = useState<ChessRights>({ wK:true,wQ:true,bK:true,bQ:true });
  const [enPassant, setEnPassant] = useState<number | null>(null);
  const [selectedChess, setSelectedChess] = useState<number | null>(null);
  const [monopoly, setMonopoly] = useState<MonopolyState>(monopolyState);
  const [monopolyOffer, setMonopolyOffer] = useState<number | null>(null);
  const [monopolyLastTile, setMonopolyLastTile] = useState<number | null>(null);
  const [auction, setAuction] = useState<{ tile:number; bid:number; bidder:Player|null; next:Player; passes:number } | null>(null);
  const [auctionResolved, setAuctionResolved] = useState(false);
  const [extraMonopolyTurn, setExtraMonopolyTurn] = useState(false);
  const [monopolyEnding, setMonopolyEnding] = useState(false);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);
  useEffect(() => () => { if (rollTimer.current !== null) window.clearTimeout(rollTimer.current); }, []);

  const legal = useMemo(() => legalChess(chessBoard, turn === 'nahia' ? 'w' : 'b', castleRights, enPassant), [chessBoard, turn, castleRights, enPassant]);
  const currentGame = games.find(item => item.id === game)!;
  const gooseIndex = new Map(gooseSpiral.map((coord, index) => [`${coord.row},${coord.col}`, index]));
  const parchisMovable = useMemo(() => game === 'parchis' && parchisRoll !== null ? movableParchisPieces(parchis,turn,parchisRoll) : [], [game,parchis.pieces,parchisRoll,turn]);

  function resetGame(next: Game) {
    setGame(next); setStarter(null); setTurn('nahia'); setMessage(''); setFinished(false); setDice([1,1]);
    setGoose(gooseState()); setParchis(parchisState()); setParchisRoll(null); setParchisBonus(false); setParchisBonusKeepsTurn(false); setParchisSixes(0); setParchisLastMoved({nahia:null,eider:null});
    setConnectBoard(Array(42).fill(null)); setChessBoard(initialChess()); setCastleRights({wK:true,wQ:true,bK:true,bQ:true}); setEnPassant(null); setSelectedChess(null);
    setMonopoly(monopolyState()); setMonopolyOffer(null); setMonopolyLastTile(null); setAuction(null); setAuctionResolved(false); setExtraMonopolyTurn(false); setMonopolyEnding(false);
  }

  function start(player: Player) { setStarter(player); setTurn(player); setMessage(''); setFinished(false); }

  function finish(winner: Player | null, text: string) {
    setFinished(true);
    if (winner) setWins(score => ({ ...score, [winner]:score[winner]+1 }));
    else setWins(score => ({ ...score, draws:score.draws+1 }));
    setMessage(text);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (root.current?.requestFullscreen) void root.current.requestFullscreen();
  }

  function passTurn(text?: string) {
    setTurn(current => other(current));
    if (text) setMessage(text);
  }

  function moveGoose(roll: number) {
    const skip = goose.skips[turn];
    if (skip > 0) {
      setGoose(current => ({ ...current, skips:{ ...current.skips, [turn]:skip-1 } }));
      passTurn(`${playerName(turn)} ${label('txanda galdu du.', 'pierde este turno.')}`);
      return;
    }
    let next = goose.positions[turn] < 0 ? roll-1 : goose.positions[turn]+roll;
    if (next > 62) next = 62-(next-62);
    let note = `${playerName(turn)} · ${roll}`;
    let hops = 0;
    while (gooseSquares.has(next) && next !== 62 && hops < 12) {
      next += roll;
      if (next > 62) next = 62-(next-62);
      note += label(' · antzara: aurrera', ' · oca: avanza');
      hops++;
    }
    if (next === 62) {
      setGoose(current => ({ ...current, positions:{ ...current.positions,[turn]:next } }));
      finish(turn, `${playerName(turn)} ${label('helmugara iritsi da!', 'ha llegado a la meta!')}`);
      return;
    }
    let position = next;
    let skipTurns = 0;
    if (position === 5) { position = 11; note += label(' · zubia: 12ra', ' · puente: avanza al 12'); }
    else if (position === 11) { position = 5; note += label(' · zubia: 6ra', ' · puente: retrocede al 6'); }
    else if (position === 18) { skipTurns = 1; note += label(' · ostatua: txanda bat galdu', ' · posada: pierdes un turno'); }
    else if (position === 30) { skipTurns = 2; note += label(' · putzua: bi txanda galdu', ' · pozo: pierdes dos turnos'); }
    else if (position === 41) { position = 29; note += label(' · labirintua: 30era itzuli', ' · laberinto: vuelve a la 30'); }
    else if (position === 51) { skipTurns = 3; note += label(' · kartzela: hiru txanda galdu', ' · cárcel: pierdes tres turnos'); }
    else if (position === 57) { position = 0; note += label(' · heriotza: hasierara itzuli', ' · muerte: vuelve al inicio'); }
    setGoose(current => ({ ...current, positions:{ ...current.positions,[turn]:position }, skips:{ ...current.skips,[turn]:skipTurns } }));
    passTurn(note);
  }

  function rollParchis(roll: number) {
    if (roll === 6 && parchisSixes === 2) {
      const last = parchisLastMoved[turn];
      if (last !== null) setParchis(current => ({ ...current, pieces:{ ...current.pieces,[turn]:current.pieces[turn].map((pos,index) => index === last ? -1 : pos) } }));
      setParchisSixes(0); setParchisRoll(null); setParchisBonus(false); setParchisBonusKeepsTurn(false);
      passTurn(`${playerName(turn)} ${label('hiru seiko segida atera ditu; azken fitxa etxera itzuli da.', 'ha sacado tres seises seguidos; su última ficha vuelve a casa.')}`);
      return;
    }
    setParchisSixes(roll === 6 ? parchisSixes+1 : 0);
    setParchisBonus(false); setParchisBonusKeepsTurn(false); setParchisRoll(roll);
    const canMove = movableParchisPieces(parchis,turn,roll).length > 0;
    if (!canMove) {
      setParchisRoll(null); setParchisSixes(0);
      passTurn(label('Mugimendu baliagarririk ez: txanda pasatu da.', 'No hay movimiento posible: pasa el turno.'));
    }
  }

  function moveParchisPiece(pieceIndex: number) {
    if (parchisRoll === null || !parchisMovable.includes(pieceIndex)) return;
    const roll = parchisRoll, wasBonus = parchisBonus, oldPosition = parchis.pieces[turn][pieceIndex];
    const nextPosition = oldPosition < 0 ? 0 : oldPosition+roll;
    const pieces = { ...parchis.pieces, [turn]:parchis.pieces[turn].map((position,index) => index === pieceIndex ? nextPosition : position) };
    let captured = false;
    if (nextPosition < 63) {
      const absolute = (parchisStarts[turn]+nextPosition)%68;
      if (!parchisSafe.has(absolute)) {
        const rival = other(turn), rivalAbsolute = parchis.pieces[rival].map(position => position >= 0 && position < 63 ? (parchisStarts[rival]+position)%68 : -1);
        const rivalIndex = rivalAbsolute.findIndex(position => position === absolute);
        if (rivalIndex >= 0) { pieces[rival] = parchis.pieces[rival].map((position,index) => index === rivalIndex ? -1 : position); captured = true; }
      }
    }
    setParchis({ pieces }); setParchisLastMoved(current => ({ ...current,[turn]:pieceIndex })); setParchisRoll(null);
    if (pieces[turn].every(position => position === 69)) { finish(turn, `${playerName(turn)} ${label('lau fitxak helmugara eraman ditu!', 'ha llevado sus cuatro fichas a la meta!')}`); return; }
    if (captured) { setParchisRoll(20); setParchisBonus(true); setParchisBonusKeepsTurn(parchisSixes > 0); return; }
    if (nextPosition === 69) { setParchisRoll(10); setParchisBonus(true); setParchisBonusKeepsTurn(parchisSixes > 0); return; }
    if (wasBonus) {
      const keepsTurn = parchisBonusKeepsTurn;
      setParchisBonus(false); setParchisBonusKeepsTurn(false);
      if (!keepsTurn) passTurn();
      return;
    }
    if (roll !== 6) { setParchisSixes(0); passTurn(); }
  }

  function dropConnect(column: number) {
    const row = [5,4,3,2,1,0].find(candidate => !connectBoard[candidate*7+column]);
    if (row === undefined) return;
    const next = [...connectBoard]; next[row*7+column] = turn; setConnectBoard(next);
    const won = next.some((cell,index) => cell === turn && [[1,0],[0,1],[1,1],[1,-1]].some(([dx,dy]) => {
      let count = 1;
      for (const direction of [-1,1]) { let x=index%7+dx*direction, y=Math.floor(index/7)+dy*direction; while (x>=0&&x<7&&y>=0&&y<6&&next[y*7+x]===turn) { count++; x+=dx*direction; y+=dy*direction; } }
      return count>=4;
    }));
    if (won) finish(turn, `${playerName(turn)} ${label('irabazi du!', 'ha ganado!')}`);
    else if (next.every(Boolean)) finish(null, label('Berdinketa.', 'Empate.'));
    else setTurn(other(turn));
  }

  function moveChess(to: number) {
    if (selectedChess === null) { if (chessBoard[to]?.[0] === (turn === 'nahia' ? 'w' : 'b')) setSelectedChess(to); return; }
    const move = legal.find(candidate => candidate.from === selectedChess && candidate.to === to);
    if (!move) { setSelectedChess(chessBoard[to]?.[0] === (turn === 'nahia' ? 'w' : 'b') ? to : null); return; }
    const next = [...chessBoard], piece = next[move.from], taken = next[to]; next[move.from] = ''; next[to] = piece;
    if (move.special === 'enPassant') next[to+(piece[0] === 'w' ? 8 : -8)] = '';
    if (move.special === 'castleK') { next[move.from+1] = next[move.from+3]; next[move.from+3] = ''; }
    if (move.special === 'castleQ') { next[move.from-1] = next[move.from-4]; next[move.from-4] = ''; }
    if (piece[1] === 'P' && (Math.floor(to/8) === 0 || Math.floor(to/8) === 7)) next[to] = `${piece[0]}Q`;
    const rights = { ...castleRights };
    if (piece === 'wK') rights.wK = rights.wQ = false;
    if (piece === 'bK') rights.bK = rights.bQ = false;
    if (move.from === 63 || (taken === 'wR' && to === 63)) rights.wK = false;
    if (move.from === 56 || (taken === 'wR' && to === 56)) rights.wQ = false;
    if (move.from === 7 || (taken === 'bR' && to === 7)) rights.bK = false;
    if (move.from === 0 || (taken === 'bR' && to === 0)) rights.bQ = false;
    const nextEnPassant = piece[1] === 'P' && Math.abs(move.to-move.from) === 16 ? (move.from+move.to)/2 : null;
    setCastleRights(rights); setEnPassant(nextEnPassant); setChessBoard(next); setSelectedChess(null);
    const nextTurn = other(turn), nextMoves = legalChess(next,nextTurn === 'nahia' ? 'w' : 'b',rights,nextEnPassant);
    if (!nextMoves.length) finish(inCheck(next,nextTurn === 'nahia' ? 'w' : 'b') ? turn : null, inCheck(next,nextTurn === 'nahia' ? 'w' : 'b') ? `${playerName(turn)} ${label('xake-matez irabazi du!', 'gana por jaque mate!')}` : label('Berdinketa: mugimendurik ez.', 'Empate: no hay movimientos.'));
    else setTurn(nextTurn);
  }

  function monopolyEndTurn() {
    setMonopolyEnding(false); setMonopolyLastTile(null); setMessage(''); setMonopolyOffer(null);
    if (extraMonopolyTurn) setExtraMonopolyTurn(false); else setTurn(current => other(current));
  }

  function finishMonopolyAction(text: string, winner?: Player) {
    setMessage(text); setMonopolyOffer(null); setAuction(null); setAuctionResolved(true);
    if (winner) finish(winner,text);
  }

  function landOnMonopoly(index: number, roll: number, passedStart: boolean, doubles: boolean, base: MonopolyState = monopoly) {
    let state = { ...base, positions:{ ...base.positions }, cash:{ ...base.cash }, jailed:{ ...base.jailed }, jailAttempts:{ ...base.jailAttempts }, doubles:{ ...base.doubles } };
    let note = `${playerName(turn)} ${label('hemen dago:', 'ha llegado a:')} ${propertyTiles[index].name}.`;
    if (passedStart) { state.cash[turn] += 200; note += label(' +200 txanpon irteeratik.', ' +200 al pasar por salida.'); }
    setMonopolyLastTile(index);
    const tile = propertyTiles[index];
    if (tile.type === 'gotoJail') {
      state.positions[turn] = 10; state.jailed[turn] = true; state.jailAttempts[turn] = 0; state.doubles[turn] = 0;
      setMonopoly(state); setExtraMonopolyTurn(false); finishMonopolyAction(`${note} ${label('Hiru txanda arte egongo zara atxikita, edo 50 ordaindu.', 'Vas a la pausa: podrás salir en tres turnos o pagar 50.')}`); return;
    }
    if (tile.type === 'tax') state.cash[turn] -= tile.tax ?? 0;
    if (tile.type === 'community' || tile.type === 'chance') {
      const cards = tile.type === 'community'
        ? [{ text:label('Jaialdiko saria: +100.', 'Premio del festival: +100.'),cash:100 },{ text:label('Medikuaren bisita: −50.', 'Visita médica: −50.'),cash:-50 },{ text:label('Auzokoek 25 ematen dizute.', 'El vecindario te da 25.'),cash:25 }]
        : [{ text:label('Ibilgailu konponketa: −75.', 'Reparación del vehículo: −75.'),cash:-75 },{ text:label('Lehiaketa irabazi duzu: +150.', 'Has ganado un concurso: +150.'),cash:150 },{ text:label('Aurrera egin irteeraraino.', 'Avanza hasta salida.'),cash:200,go:true }];
      const card = cards[Math.floor(Math.random()*cards.length)]; state.cash[turn] += card.cash;
      if (card.go) state.positions[turn] = 0;
      note += ` ${card.text}`;
    }
    const owner = state.owners[index];
    if (['property','rail','utility'].includes(tile.type)) {
      if (owner === null) {
        setMonopoly(state); setMonopolyOffer(index); setExtraMonopolyTurn(doubles); setMessage(`${note} ${label('Erosi edo jarri enkantean.', 'Puedes comprarla o sacarla a subasta.')}`); setMonopolyEnding(false); return;
      }
      if (owner !== turn) {
        const rent = propertyRent(index,state,roll); state.cash[turn] -= rent; state.cash[owner] += rent;
        note += ` ${label('Alokairua', 'Alquiler')}: ${rent}.`;
        if (state.cash[turn] < 0) { setMonopoly(state); finishMonopolyAction(`${note} ${label('Dirurik gabe geratu zara.', 'Te has quedado sin dinero.')}`,owner); return; }
      } else note += ` ${label('Zure jabetza da.', 'Es de tu propiedad.')}`;
    }
    setMonopoly(state); setExtraMonopolyTurn(doubles);
    finishMonopolyAction(note);
  }

  function rollMonopoly(values: number[]) {
    const roll = values.reduce((sum,value) => sum+value,0), doubles = values.length === 2 && values[0] === values[1];
    let state = { ...monopoly, positions:{ ...monopoly.positions }, cash:{ ...monopoly.cash }, jailed:{ ...monopoly.jailed }, jailAttempts:{ ...monopoly.jailAttempts }, doubles:{ ...monopoly.doubles } };
    if (state.jailed[turn]) {
      if (doubles) { state.jailed[turn] = false; state.jailAttempts[turn] = 0; landOnMonopoly((state.positions[turn]+roll)%40,roll,false,false,state); return; }
      state.jailAttempts[turn] += 1;
      if (state.jailAttempts[turn] >= 3) { state.cash[turn] -= 50; state.jailed[turn] = false; state.jailAttempts[turn] = 0; setMonopoly(state); finishMonopolyAction(label('50 ordaindu duzu eta kartzelatik irten zara.', 'Has pagado 50 y sales de la cárcel.')); return; }
      setMonopoly(state); setExtraMonopolyTurn(false); finishMonopolyAction(`${playerName(turn)} ${label('kartzelan jarraitzen du; bikoitzak behar dira.', 'sigue en pausa; necesitas dobles para salir.')}`); return;
    }
    state.doubles[turn] = doubles ? state.doubles[turn]+1 : 0;
    if (state.doubles[turn] >= 3) {
      state.positions[turn] = 10; state.jailed[turn] = true; state.jailAttempts[turn] = 0; state.doubles[turn] = 0; setMonopoly(state); setExtraMonopolyTurn(false);
      finishMonopolyAction(label('Hiru bikoitz jarraian: kartzelara zoaz.', 'Tres dobles seguidos: vas a la cárcel.')); return;
    }
    const old = state.positions[turn], raw = old+roll, destination = raw%40;
    state.positions[turn] = destination; setMonopoly(state);
    landOnMonopoly(destination,roll,raw>=40,doubles);
  }

  function buyMonopolyProperty() {
    if (monopolyOffer === null) return;
    const tile = propertyTiles[monopolyOffer], price = tile.price ?? 0, next = { ...monopoly, owners:[...monopoly.owners], cash:{...monopoly.cash} };
    if (next.cash[turn] < price) { setMessage(label('Ez duzu nahikoa diru.', 'No tienes dinero suficiente.')); return; }
    next.owners[monopolyOffer] = turn; next.cash[turn] -= price; setMonopoly(next); setMonopolyEnding(true); setMessage(`${playerName(turn)} ${label('jabe egin da:', 'ha comprado')} ${tile.name}.`); setMonopolyOffer(null);
  }

  function passMonopolyProperty() {
    if (monopolyOffer === null) return;
    setAuction({ tile:monopolyOffer,bid:0,bidder:null,next:other(turn),passes:0 }); setMonopolyOffer(null); setMessage(label('Enkantea: hasierako eskaintza 10.', 'Subasta: puja inicial de 10.')); setMonopolyEnding(false);
  }

  function bidMonopoly() {
    if (!auction) return;
    const amount = auction.bid+10, bidder = auction.next;
    if (monopoly.cash[bidder] < amount) { setMessage(`${playerName(bidder)} ${label('ezin du gehiago eskaini.', 'no puede pujar más.')}`); return; }
    setAuction({ ...auction,bid:amount,bidder,next:other(bidder),passes:0 }); setMessage(`${playerName(bidder)}: ${amount}.`);
  }

  function passAuction() {
    if (!auction) return;
    if (auction.bidder && auction.next === other(auction.bidder)) {
      const next = { ...monopoly,owners:[...monopoly.owners],cash:{...monopoly.cash} };
      next.owners[auction.tile] = auction.bidder; next.cash[auction.bidder] -= auction.bid;
      setMonopoly(next); setAuctionResolved(true); setMonopolyEnding(true); setMessage(`${playerName(auction.bidder)} ${label('enkantea irabazi du:', 'gana la subasta de')} ${propertyTiles[auction.tile].name}.`); setAuction(null); return;
    }
    if (auction.passes >= 1) { setAuction(null); setAuctionResolved(true); setMonopolyEnding(true); setMessage(label('Ez da eskaintzarik egin.', 'No hubo pujas por esta propiedad.')); return; }
    setAuction({ ...auction,next:other(auction.next),passes:auction.passes+1 }); setMessage(label('Beste jokalariaren txanda: egin eskaintza edo pasa.', 'Turno de la otra persona: puja o pasa.'));
  }

  function buildHouse(index: number) {
    const tile = propertyTiles[index];
    if (!tile.group || monopoly.owners[index] !== turn || monopoly.houses[index] >= 5) return;
    const group = propertyTiles.map((candidate,i) => candidate.group === tile.group ? i : -1).filter(i => i>=0);
    if (!group.every(i => monopoly.owners[i] === turn)) return;
    const houseCount = monopoly.houses[index], min = Math.min(...group.map(i => monopoly.houses[i]));
    const price = groupHouses[tile.group];
    if (houseCount > min || monopoly.cash[turn] < price) return;
    const next = { ...monopoly,cash:{...monopoly.cash},houses:[...monopoly.houses] };
    next.cash[turn] -= price; next.houses[index] += 1; setMonopoly(next); setMonopolyEnding(true);
    setMessage(`${label('Eraikin bat jarri duzu:','Has construido en')} ${tile.name}.`);
  }

  function rollDice() {
    if (!starter || rolling || message || finished || (game === 'parchis' && parchisRoll !== null)) return;
    if (game === 'goose' && goose.skips[turn] > 0) {
      const skip = goose.skips[turn]; setGoose(current => ({ ...current,skips:{...current.skips,[turn]:skip-1} })); passTurn(`${playerName(turn)} ${label('txanda galdu du.', 'pierde este turno.')}`); return;
    }
    const count = game === 'monopoly' ? 2 : 1;
    setRolling(true);
    rollTimer.current = window.setTimeout(() => {
      const values = Array.from({ length:count }, () => 1+Math.floor(Math.random()*6));
      setDice(values); setRolling(false); rollTimer.current = null;
      if (game === 'goose') moveGoose(values[0]);
      else if (game === 'parchis') rollParchis(values[0]);
      else if (game === 'monopoly') rollMonopoly(values);
    }, 560);
  }

  function continueTurn() {
    setMessage('');
    if (game === 'monopoly') {
      if (auction) return;
      if (auctionResolved) { setAuctionResolved(false); setMonopolyEnding(false); setMonopolyLastTile(null); if (extraMonopolyTurn) setExtraMonopolyTurn(false); else setTurn(current => other(current)); return; }
      if (monopolyEnding) { setMonopolyEnding(false); setMonopolyLastTile(null); if (extraMonopolyTurn) setExtraMonopolyTurn(false); else setTurn(current => other(current)); }
    }
  }

  function monopolyTileClass(tile: PropertyTile, index: number) {
    const owner=monopoly.owners[index],occupied=players.some(player=>monopoly.positions[player]===index);
    return `tt-property-cell ${owner?`owned-${owner}`:''} ${monopoly.positions[turn]===index?'current-turn':''} ${occupied?'has-pawn':''}`;
  }

  const gooseCells = Array.from({ length:81 }, (_, i) => {
    const row = Math.floor(i/9), col = i%9, index = gooseIndex.get(`${row},${col}`);
    if (index === undefined) return <div className="tt-goose-empty" key={i} />;
    const special = index === 5 || index === 11 ? 'bridge' : index === 18 ? 'inn' : index === 30 ? 'well' : index === 41 ? 'maze' : index === 51 ? 'prison' : index === 57 ? 'death' : index === 62 ? 'finish' : gooseSquares.has(index) ? 'goose' : '';
    return <div className={`tt-goose-cell ${special} ${players.some(player=>goose.positions[player]===index)?'occupied':''}`} key={i}>
      <small>{index+1}</small><span>{special === 'goose' ? '🪿' : special === 'bridge' ? '🌉' : special === 'inn' ? '🏨' : special === 'well' ? '🪣' : special === 'maze' ? '🌀' : special === 'prison' ? '🔒' : special === 'death' ? '💀' : special === 'finish' ? '🏁' : ''}</span>
      <div className="tt-goose-token">{players.filter(player => goose.positions[player] === index).map(player => <b className={`tt-pawn ${player}`} key={player}>{pawnIcon(player)}</b>)}</div>
    </div>;
  });

  const parchisTokensAt = (absolute: number) => players.flatMap(player => parchis.pieces[player].map((position,index) => ({player,index,position})).filter(token => token.position >= 0 && token.position < 63 && (parchisStarts[player]+token.position)%68 === absolute));

  const propertyCenter = <div className="tt-property-center" style={{ gridRow:'2 / 11',gridColumn:'2 / 11' }}>
    <span>✦ CITY LIFE ✦</span><strong>AURORA<br/>DISTRICT</strong><small>{label('Jokalari bakoitzak aukera bat du.', 'Cada turno crea una nueva oportunidad.')}</small>
    <div className="tt-center-pawns">{players.map(player => <b className={`tt-pawn ${player}`} key={player}>{pawnIcon(player)} {playerName(player)}</b>)}</div>
  </div>;

  const propertyDeedIndex = monopolyOffer ?? monopolyLastTile;
  const deedTile = propertyDeedIndex === null ? null : propertyTiles[propertyDeedIndex];
  const groupIsComplete = !!deedTile?.group && propertyTiles.map((tile,index) => tile.group === deedTile.group ? index : -1).filter(index => index >= 0).every(index => monopoly.owners[index] === turn);
  const houseCost = deedTile?.group ? groupHouses[deedTile.group] : 0;
  const canBuildHouse = !!deedTile?.group && groupIsComplete && monopoly.owners[propertyDeedIndex!] === turn && monopoly.houses[propertyDeedIndex!] < 5 && monopoly.houses[propertyDeedIndex!] <= Math.min(...propertyTiles.map((tile,index) => tile.group === deedTile.group ? monopoly.houses[index] : Infinity)) && monopoly.cash[turn] >= houseCost;

  const rules: Record<Game,[string,string]> = {
    goose:['Bota dado bakarra. Antzara batean erortzen bazara, egin berriro dadoaren kopurua; zubiak aurrera eramaten zaitu. Ostatuak, putzuak eta kartzelak txandak kentzen dituzte. 63ra zenbaki zehatzarekin iritsi behar da.','Tira un dado. Si caes en una oca, avanza otra vez lo mismo; los puentes te desplazan. La posada, el pozo y la cárcel hacen perder turnos. Hay que llegar al 63 con número exacto.'],
    parchis:['Botoi bakoitza fitxa da. 5arekin fitxa bat atera; 6ak beste dado bat ematen du. Jan ezazu aurkariaren fitxa babestuta ez badago. Egin 68 laukiko itzulia eta sartu zure helmuga korridorean zenbaki zehatzarekin.','Cada botón representa una ficha. Con un 5 sacas ficha; el 6 te da otra tirada. Captura las fichas rivales fuera de las casillas seguras. Completa la vuelta de 68 casillas y entra en tu pasillo final con número exacto.'],
    connect:['Txandaka bota pieza bat zutabe batera. Lau jarraian lotzen dituen lehenak irabazten du.','Dejad caer una ficha por turno. Gana quien conecte cuatro seguidas.'],
    chess:['Mugitu pieza arauen arabera, babestu erregea eta egin xake-mate. Enrokea, aldi bateko harrapaketa eta peoiaren dama-aldaketa daude.','Mueve las piezas según sus reglas, protege al rey y da jaque mate. Hay enroque, captura al paso y promoción del peón.'],
    monopoly:['Erosi kaleak, kobratu alokairua, osatu kolore multzoak eta eraiki. Irteeratik pasatzean 200 jasotzen dira; kartzelatik bikoitzekin, ordainduta edo hiru txandaren ondoren atera daiteke.','Compra calles, cobra alquileres, completa grupos de color y construye. Al pasar por salida cobras 200; puedes salir de la pausa con dobles, pagando o tras tres turnos.'],
  };

  return <section ref={root} className="team-tabletop-games tt-shell">
    <header className="tt-header">
      <div><span className="eyebrow tt-kicker">{label('ELKARREKIN JOLASTEKO · TOKIKO PARTIDA','JUEGO LOCAL · DOS JUGADORAS')}</span><h1>{currentGame.icon} {eu ? currentGame.eu : currentGame.es}</h1></div>
      <div className="tt-tools"><button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? label('Pantaila osotik atera','Salir de pantalla completa') : label('Pantaila osoa','Pantalla completa')}>{fullscreen ? '↙' : '⛶'}</button><button type="button" onClick={onExit} aria-label={label('Itxi jokoak','Cerrar juegos')}>✕</button></div>
    </header>
    <nav className="tt-game-picker" aria-label={label('Aukeratu jokoa','Elegir juego')}>
      {games.map(item => <button type="button" key={item.id} className={game === item.id ? 'active' : ''} aria-pressed={game === item.id} onClick={() => resetGame(item.id)}><span>{item.icon}</span>{eu ? item.eu : item.es}</button>)}
    </nav>
    <div className="tt-score" aria-live="polite"><span className="nahia">{pawnIcon('nahia')} Nahia <b>{wins.nahia}</b></span><span className="draws">{label('Berdinketak','Empates')} <b>{wins.draws}</b></span><span className="eider">{pawnIcon('eider')} Eider <b>{wins.eider}</b></span></div>
    <section className="tt-play-layout">
      <div className="tt-playfield">
        {game === 'goose' && <div className="tt-goose-board"><div className="tt-goose-grid">{gooseCells}<div className="tt-goose-center" style={{gridRow:'4 / 7',gridColumn:'4 / 7'}}><span>✦ AURORA ✦</span><strong>GOOSE<br/>TRAIL</strong><small>63 • {label('laukiko bidaia','casillas de aventura')}</small></div></div></div>}
        {game === 'parchis' && <div className="tt-parchis-board">
          <div className="tt-parchis-grid" role="group" aria-label={label('Parxisaren taula','Tablero de parchís')}>
            {parchisRoute.map((coord,index) => {
              const tokens = parchisTokensAt(index), safe = parchisSafe.has(index), startPlayer = Object.keys(parchisStarts).find(player => parchisStarts[player as Player] === index) as Player | undefined;
              return <div key={index} className={`tt-parchis-cell ${safe ? 'safe' : ''} ${startPlayer ?? ''}`} style={{gridRow:coord.row+1,gridColumn:coord.col+1} as CSSProperties}>
                {startPlayer && <small>START</small>}
                {tokens.map(token => <button type="button" className={`tt-parchis-token ${token.player} ${parchisMovable.includes(token.index) ? 'selectable' : ''}`} key={`${token.player}-${token.index}`} onClick={() => moveParchisPiece(token.index)} disabled={!parchisMovable.includes(token.index)} aria-label={`${playerName(token.player)}, ${label('fitxa','ficha')} ${token.index+1}`}>{pawnIcon(token.player)}</button>)}
                {safe && tokens.length === 0 && <span className="tt-safe-mark">✦</span>}
              </div>;
            })}
            <div className="tt-parchis-yard nahia"><strong>{pawnIcon('nahia')} Nahia</strong><div>{parchis.pieces.nahia.map((position,index) => <button type="button" key={index} className={`tt-yard-token ${parchisMovable.includes(index) && position < 0 ? 'selectable' : ''}`} onClick={() => moveParchisPiece(index)} disabled={!parchisMovable.includes(index) || position >= 0} aria-label={`${label('Atera fitxa','Sacar ficha')} ${index+1}`}><b>{pawnIcon('nahia')}</b></button>)}</div></div>
            <div className="tt-parchis-yard eider"><strong>{pawnIcon('eider')} Eider</strong><div>{parchis.pieces.eider.map((position,index) => <button type="button" key={index} className={`tt-yard-token ${parchisMovable.includes(index) && position < 0 ? 'selectable' : ''}`} onClick={() => moveParchisPiece(index)} disabled={!parchisMovable.includes(index) || position >= 0} aria-label={`${label('Atera fitxa','Sacar ficha')} ${index+1}`}><b>{pawnIcon('eider')}</b></button>)}</div></div>
            <div className="tt-parchis-yard vacant green"><strong>🌿 {label('Jokalari librea','Plaza libre')}</strong><div>{Array.from({length:4},(_,i)=><i key={i}/>)}</div></div>
            <div className="tt-parchis-yard vacant amber"><strong>🌞 {label('Jokalari librea','Plaza libre')}</strong><div>{Array.from({length:4},(_,i)=><i key={i}/>)}</div></div>
            <div className="tt-parchis-home-lane nahia">{Array.from({length:7},(_,i)=>{const piece=parchis.pieces.nahia.findIndex(position=>position===63+i);return <button type="button" className={piece>=0?'occupied':''} key={i} onClick={()=>moveParchisPiece(piece)} disabled={piece<0||!parchisMovable.includes(piece)} aria-label={`${label('Helmugako fitxa','Ficha en meta')} ${i+1}`}>{piece>=0?pawnIcon('nahia'):''}</button>;})}</div>
            <div className="tt-parchis-home-lane eider">{Array.from({length:7},(_,i)=>{const piece=parchis.pieces.eider.findIndex(position=>position===63+i);return <button type="button" className={piece>=0?'occupied':''} key={i} onClick={()=>moveParchisPiece(piece)} disabled={piece<0||!parchisMovable.includes(piece)} aria-label={`${label('Helmugako fitxa','Ficha en meta')} ${i+1}`}>{piece>=0?pawnIcon('eider'):''}</button>;})}</div>
            <div className="tt-parchis-center" style={{gridRow:'8 / 11',gridColumn:'8 / 11'}}>🏁<small>{label('HELMUGA','META')}</small></div>
          </div>
        </div>}
        {game === 'connect' && <div className="tt-connect" role="group" aria-label={label('Lau lerroan taula','Tablero de cuatro en raya')}>
          {Array.from({length:7},(_,column)=><button type="button" key={column} className="tt-column" aria-label={`${label('Zutabea','Columna')} ${column+1}`} onClick={() => dropConnect(column)} disabled={!starter || finished || !!message}>{connectBoard.filter((_,i) => i%7 === column).map((cell,row)=><span key={row} className={`tt-hole ${cell ?? ''}`}/>)}</button>)}
        </div>}
        {game === 'chess' && <div className="tt-chess" role="grid" aria-label={label('Xake-taula','Tablero de ajedrez')}>
          {chessBoard.map((piece,index)=><button type="button" role="gridcell" key={index} className={`${(Math.floor(index/8)+index%8)%2 ? 'dark' : 'light'} ${selectedChess === index ? 'selected' : ''} ${legal.some(move => move.from === selectedChess && move.to === index) ? 'target' : ''}`} aria-label={`${'abcdefgh'[index%8]}${8-Math.floor(index/8)} ${piece}`} disabled={!starter || finished || !!message} onClick={() => moveChess(index)}>{piece && <span className={piece[0] === 'w' ? 'white-piece' : 'black-piece'}>{({wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'} as Record<string,string>)[piece]}</span>}</button>)}
        </div>}
        {game === 'monopoly' && <div className="tt-property-board">
          {propertyCenter}
          {propertyTiles.map((tile,index) => { const coord = boardCoordinate(index); return <div key={index} data-kind={tile.type==='rail'?'railroad':tile.type} data-group={tile.group ?? ''} className={monopolyTileClass(tile,index)} style={{gridRow:coord.row,gridColumn:coord.col,'--property-color':tile.group ? groupColors[tile.group] : undefined} as CSSProperties}>
            <small className="tt-property-icon">{tile.icon}</small><strong>{tile.name}</strong>{tile.price && <small className="tt-price">{tile.price} €</small>}
            {monopoly.houses[index] > 0 && <small className="tt-houses">{'🏠'.repeat(Math.min(4,monopoly.houses[index]))}{monopoly.houses[index] === 5 ? '🏨' : ''}</small>}
            <div className="tt-pawns">{players.filter(player => monopoly.positions[player] === index).map(player => <span className={`tt-pawn ${player}`} key={player}>{pawnIcon(player)}</span>)}</div>
          </div>; })}
        </div>}
      </div>
      <aside className="tt-sidepanel">
        <div className="tt-rule-card"><span>{label('NOLA JOKATU','CÓMO SE JUEGA')}</span><p>{eu ? rules[game][0] : rules[game][1]}</p></div>
        <div className="tt-turn-card"><small>{label('ORAINGO TXANDA','TURNO ACTUAL')}</small><strong className={turn}>{pawnIcon(turn)} {playerName(turn)}</strong>{message && <p className="tt-status-text">{message}</p>}</div>
        {game !== 'connect' && game !== 'chess' && <div className="tt-dice-panel"><h3>{game === 'monopoly' ? label('BI DADO','DOS DADOS') : label('DADOA','EL DADO')} <span className="tt-dice-result">{dice.reduce((sum,value)=>sum+value,0)}</span></h3><div className="tt-dice-row">{(game === 'monopoly' ? dice : dice.slice(0,1)).map((value,index)=><Die key={`${game}-${index}`} value={value} rolling={rolling} />)}</div>{starter && !finished && <button type="button" className="tt-roll-button" onClick={rollDice} disabled={rolling || !!message || (game === 'parchis' && parchisRoll !== null)}>{rolling ? label('DADOAK MUGITZEN...','TIRANDO...') : game === 'goose' && goose.skips[turn] > 0 ? label('TXANDA PASATU','PERDER TURNO') : game === 'parchis' && parchisRoll !== null ? label('AUKERATU FITXA','ELIGE FICHA') : label('BOTA DADOA','LANZAR DADOS')}</button>}
          {game === 'parchis' && parchisRoll !== null && <small className="tt-pick-hint">{parchisBonus ? `${label('Harrapaketagatik','Por captura')}: +${parchisRoll}` : `${label('Aukeratu mugitu beharreko fitxa','Elige ficha para mover')}: ${parchisRoll}`}</small>}
        </div>}
        {game === 'parchis' && <p className="tt-small-note">{label('4 fitxa jokalari bakoitzeko','4 fichas por jugadora')} · {label('5arekin atera','sale con 5')} · {label('6ak beste tirada ematen du','el 6 da otra tirada')}</p>}
        {!starter && <fieldset className="tt-starter"><legend>{label('Nork hasiko da?','¿Quién empieza?')}</legend>{players.map(player => <button type="button" key={player} className={player} onClick={() => start(player)}>{pawnIcon(player)} {playerName(player)}</button>)}</fieldset>}
        {game === 'monopoly' && <div className="tt-cash"><span>{pawnIcon('nahia')} Nahia <b>{monopoly.cash.nahia} €</b>{monopoly.jailed.nahia && <small>{label('Pausan','En pausa')}</small>}</span><span>{pawnIcon('eider')} Eider <b>{monopoly.cash.eider} €</b>{monopoly.jailed.eider && <small>{label('Pausan','En pausa')}</small>}</span></div>}
        {game === 'monopoly' && deedTile && propertyDeedIndex !== null && <div className={`tt-deed ${deedTile.group ?? deedTile.type}`}><div className="tt-deed-band" style={{background:deedTile.group ? groupColors[deedTile.group] : 'transparent'}}><span>{deedTile.icon}</span></div><small>{label('JABETZA TXARTELA','TARJETA DE PROPIEDAD')}</small><h3>{deedTile.name}</h3><div className="tt-deed-details">{deedTile.price ? <span>{label('Prezioa','Precio')} <b>{deedTile.price} €</b></span> : null}{deedTile.rent ? <span>{label('Oinarrizko alokairua','Alquiler base')} <b>{propertyRent(propertyDeedIndex,monopoly,7)} €</b></span> : null}{deedTile.group && monopoly.owners[propertyDeedIndex] === turn && <span>{label('Etxeak','Casas')} <b>{monopoly.houses[propertyDeedIndex]} / 5</b></span>}</div>
          {monopolyOffer === propertyDeedIndex && <div className="tt-deed-actions"><button className="tt-action primary" onClick={buyMonopolyProperty}>{label('EROSI','COMPRAR')} · {deedTile.price} €</button><button className="tt-action secondary" onClick={passMonopolyProperty}>{label('ENKANTERA ATERA','SUBASTAR')}</button></div>}
          {canBuildHouse && <button className="tt-action secondary" onClick={() => buildHouse(propertyDeedIndex)}>{label('ETXEA ERAIKI','CONSTRUIR CASA')} · {houseCost} €</button>}
        </div>}
        {game === 'monopoly' && auction && <div className="tt-auction"><small>{label('ENKANTEA','SUBASTA')}</small><h3>{propertyTiles[auction.tile].name}</h3><p>{auction.bidder ? `${playerName(auction.bidder)} · ${auction.bid} €` : label('Oraindik eskaintzarik ez.','Sin pujas todavía.')}</p><strong>{label('Eskaintza','Turno de')}: {playerName(auction.next)}</strong><div><button className="tt-action primary" onClick={bidMonopoly}>{label('ESKAINI','PUJAR')} · {auction.bid+10} €</button><button className="tt-action secondary" onClick={passAuction}>{label('PASATU','PASAR')}</button></div></div>}
        {game === 'monopoly' && monopoly.jailed[turn] && starter && !message && <button className="tt-action secondary" onClick={() => { const next={...monopoly,cash:{...monopoly.cash},jailed:{...monopoly.jailed},jailAttempts:{...monopoly.jailAttempts}}; if(next.cash[turn]>=50){next.cash[turn]-=50;next.jailed[turn]=false;next.jailAttempts[turn]=0;setMonopoly(next);setMessage('');setMonopolyEnding(false);} }}>{label('50 ORDAINDU ETA JOLASTU','PAGAR 50 Y SEGUIR')}</button>}
        {message && !finished && !auction && !monopolyOffer && (game !== 'monopoly' || monopolyEnding || auctionResolved) && <button type="button" className="tt-action continue" onClick={continueTurn}>{label('JARRAITU','CONTINUAR')} →</button>}
        {finished && <div className="tt-finished"><strong>{message}</strong><button type="button" className="tt-action primary" onClick={() => resetGame(game)}>{label('BERRIRO JOLASTU','JUGAR OTRA VEZ')}</button></div>}
      </aside>
    </section>
  </section>;
}
