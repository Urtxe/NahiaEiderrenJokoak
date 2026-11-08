export type CheckersSide = 'nahia' | 'eider';
export type CheckersPiece = { side: CheckersSide; king: boolean };
export type CheckersBoard = (CheckersPiece | null)[];
export type CheckersMove = { from: number; to: number; captures: number[] };

export const initialCheckersBoard = (): CheckersBoard => Array.from({ length: 64 }, (_, i) => {
  const row = Math.floor(i / 8), col = i % 8;
  if ((row + col) % 2 === 0) return null;
  if (row < 3) return { side: 'eider', king: false };
  if (row > 4) return { side: 'nahia', king: false };
  return null;
});

const rowOf = (i: number) => Math.floor(i / 8);
const colOf = (i: number) => i % 8;
const opponent = (side: CheckersSide): CheckersSide => side === 'nahia' ? 'eider' : 'nahia';
const directions = (piece: CheckersPiece): number[] => piece.king ? [-1, 1] : [piece.side === 'nahia' ? -1 : 1];

function movesFrom(board: CheckersBoard, from: number, capturesOnly: boolean): CheckersMove[] {
  const piece = board[from];
  if (!piece) return [];
  const moves: CheckersMove[] = [];
  for (const dr of directions(piece)) for (const dc of [-1, 1]) {
    const r = rowOf(from), c = colOf(from), nr = r + dr, nc = c + dc;
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
    const near = nr * 8 + nc;
    if (!board[near] && !capturesOnly) moves.push({ from, to: near, captures: [] });
    else if (board[near]?.side === opponent(piece.side)) {
      const jr = nr + dr, jc = nc + dc;
      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr * 8 + jc]) {
        moves.push({ from, to: jr * 8 + jc, captures: [near] });
      }
    }
  }
  return moves;
}

export function legalCheckersMoves(board: CheckersBoard, side: CheckersSide): CheckersMove[] {
  const captures = board.flatMap((piece, from) => piece?.side === side ? movesFrom(board, from, true) : []);
  return captures.length ? captures : board.flatMap((piece, from) => piece?.side === side ? movesFrom(board, from, false) : []);
}

export function applyCheckersMove(board: CheckersBoard, move: CheckersMove): CheckersBoard {
  const next = [...board];
  const piece = next[move.from];
  if (!piece) return next;
  next[move.from] = null;
  move.captures.forEach(index => { next[index] = null; });
  const promoted = piece.king || (piece.side === 'nahia' ? rowOf(move.to) === 0 : rowOf(move.to) === 7);
  next[move.to] = { ...piece, king: promoted };
  return next;
}

export function checkersContinuation(board: CheckersBoard, move: CheckersMove): CheckersMove[] {
  if (!move.captures.length) return [];
  const piece = board[move.to];
  if (!piece) return [];
  return movesFrom(board, move.to, true);
}

export function checkersPositionKey(board: CheckersBoard, side: CheckersSide): string {
  return `${side}|${board.map(p => p ? `${p.side[0]}${p.king ? 'k' : 'm'}` : '-').join('')}`;
}

export type TicCell = 'X' | 'O' | null;
export type TicBoard = TicCell[];
export const initialTicBoard = (): TicBoard => Array(9).fill(null);
export const ticWinner = (board: TicBoard): TicCell => {
  for (const [a, b, c] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
};

export function chooseTicCpuMove(board: TicBoard, level: 'lh1' | 'lh3'): number {
  const open = board.flatMap((cell, i) => cell ? [] : [i]);
  if (level === 'lh1' && Math.random() < 0.6) return open[Math.floor(Math.random() * open.length)];
  const score = (cells: TicBoard, turn: TicCell, depth: number): number => {
    const winner = ticWinner(cells);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    const empty = cells.flatMap((v, i) => v ? [] : [i]);
    if (!empty.length) return 0;
    const values = empty.map(i => { const copy = [...cells]; copy[i] = turn; return score(copy, turn === 'O' ? 'X' : 'O', depth + 1); });
    return turn === 'O' ? Math.max(...values) : Math.min(...values);
  };
  const best = open.map(i => { const copy = [...board]; copy[i] = 'O'; return { i, value: score(copy, 'X', 1) }; });
  const max = Math.max(...best.map(x => x.value));
  return best.filter(x => x.value === max)[Math.floor(Math.random() * best.filter(x => x.value === max).length)].i;
}
