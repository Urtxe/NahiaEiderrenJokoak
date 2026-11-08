import { describe, expect, it } from 'vitest';
import { applyCheckersMove, checkersContinuation, initialCheckersBoard, legalCheckersMoves, type CheckersBoard } from './boardGames';
import { chooseTicCpuMove, initialTicBoard, ticWinner } from './boardGames';

describe('checkers rules', () => {
  it('starts with twelve pieces per side and permits diagonal opening moves', () => {
    const board = initialCheckersBoard();
    expect(board.filter(p => p?.side === 'nahia')).toHaveLength(12);
    expect(board.filter(p => p?.side === 'eider')).toHaveLength(12);
    expect(legalCheckersMoves(board, 'nahia').length).toBeGreaterThan(0);
  });

  it('makes capture mandatory and chains another available jump', () => {
    const board: CheckersBoard = Array(64).fill(null);
    board[40] = { side: 'nahia', king: false };
    board[33] = { side: 'eider', king: false };
    board[19] = { side: 'eider', king: false };
    board[42] = { side: 'nahia', king: false };
    const moves = legalCheckersMoves(board, 'nahia');
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(move => move.captures.length > 0)).toBe(true);
    expect(moves[0].captures).toEqual([33]);
    const afterFirst = applyCheckersMove(board, moves[0]);
    expect(checkersContinuation(afterFirst, moves[0])).toHaveLength(1);
  });

  it('promotes a piece that reaches the far edge', () => {
    const board: CheckersBoard = Array(64).fill(null);
    board[8] = { side: 'nahia', king: false };
    const move = legalCheckersMoves(board, 'nahia').find(m => m.to === 1)!;
    expect(applyCheckersMove(board, move)[1]).toEqual({ side: 'nahia', king: true });
  });
});

describe('tic tac toe', () => {
  it('detects a row and the CPU takes a winning move', () => {
    const board = initialTicBoard();
    board[0] = 'O'; board[1] = 'O'; board[3] = 'X'; board[4] = 'X';
    expect(ticWinner(board)).toBeNull();
    expect(chooseTicCpuMove(board, 'lh3')).toBe(2);
  });

  it('blocks an immediate opponent win at the higher level', () => {
    const board = initialTicBoard();
    board[0] = 'X'; board[1] = 'X'; board[4] = 'O';
    expect(chooseTicCpuMove(board, 'lh3')).toBe(2);
  });
});
