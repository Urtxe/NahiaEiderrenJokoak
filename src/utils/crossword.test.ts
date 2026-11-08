import { describe, expect, it } from 'vitest';
import { makeCrossword } from './crossword';

describe('crossword generation', () => {
  it('creates six connected, matching entries in every language and level', () => {
    for (const lang of ['eu', 'es'] as const) for (const level of ['lh1', 'lh3'] as const) {
      for (let run = 0; run < 12; run++) {
        const board = makeCrossword(lang, level);
        expect(board.entries).toHaveLength(6);
        const cells = new Map<string, { letter: string; count: number }>();
        board.entries.forEach(entry => [...entry.answer].forEach((letter, offset) => {
          const row = entry.row + (entry.direction === 'down' ? offset : 0);
          const column = entry.column + (entry.direction === 'across' ? offset : 0);
          const key = `${row}:${column}`;
          const cell = cells.get(key);
          if (cell) { expect(cell.letter).toBe(letter); cell.count++; }
          else cells.set(key, { letter, count: 1 });
        }));
        expect([...cells.values()].filter(cell => cell.count > 1).length).toBeGreaterThan(0);
      }
    }
  });

  it('changes word combinations when the previous puzzle is known', () => {
    const previous = makeCrossword('es', 'lh1').entries.map(entry => entry.answer);
    const next = makeCrossword('es', 'lh1', previous);
    expect(next.entries.some(entry => !previous.includes(entry.answer))).toBe(true);
  });
});
