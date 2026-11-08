import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SchoolLevel } from '../types';
import { makeWordGrid, shuffleSearchWords, wordSearchCount } from './wordSearch';

afterEach(() => vi.restoreAllMocks());

describe('word searches', () => {
  it('changes the six-word set even if the shuffle repeats', () => {
    vi.spyOn(Math, 'random').mockReturnValue(.5);
    const pool = ['KATU', 'LUR', 'EGUZKI', 'TXAKUR', 'ETXE', 'MENDI', 'ITSASO'].map(text => ({ text }));
    const first = shuffleSearchWords(pool).slice(0, wordSearchCount);
    const second = shuffleSearchWords(pool, first).slice(0, wordSearchCount);

    expect(new Set(second.map(word => word.text)).size).toBe(6);
    expect(second.some(word => !first.includes(word))).toBe(true);
  });

  const levels: [SchoolLevel, number, string[]][] = [
    ['lh1', 7, ['EGUZKI', 'TXAKUR', 'ITSASO', 'LIBURU', 'ILARGI', 'PENCIL']],
    ['lh3', 10, ['TXIMELETA', 'ORTZADAR', 'ITSASARGI', 'URTXINTXA', 'MENDIZALE', 'EGUTEGIA']],
  ];

  it.each(levels)('places all six words in straight lines at %s', (level, size, texts) => {
    let randomState = 1;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
      return randomState / 2 ** 32;
    });

    const words = texts.map(text => ({ text }));
    for (let sample = 0; sample < 30; sample++) {
      const grid = makeWordGrid(level, words);
      expect(grid).toHaveLength(size);
      expect(grid.every(row => row.length === size)).toBe(true);
      expect(grid.flat().every(cell => cell.letter.length === 1)).toBe(true);

      words.forEach(({ text }, index) => {
        const cells = grid.flatMap((row, r) => row.flatMap((cell, c) => cell.word === index ? [{ r, c, letter: cell.letter }] : []));
        expect(cells.map(cell => cell.letter).join('')).toBe(text);
        const first = cells[0];
        const horizontal = cells.every((cell, offset) => cell.r === first.r && cell.c === first.c + offset);
        const vertical = cells.every((cell, offset) => cell.r === first.r + offset && cell.c === first.c);
        expect(horizontal || vertical).toBe(true);
      });
    }
  });
});
