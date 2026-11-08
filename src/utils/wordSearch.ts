import type { SchoolLevel } from '../types';
import { shuffle } from './gameLogic';

type Cell = { letter: string; word: number };
type Slot = { row: number; column: number; vertical: boolean };
type PuzzleWord = { letters: string[]; index: number };

export const wordSearchCount = 6;

export function shuffleSearchWords<T extends { text: string }>(pool: T[], previous?: readonly T[]): T[] {
  const words = shuffle(pool);
  if (previous && words.slice(0, wordSearchCount).every(word => previous.some(old => old.text === word.text))) {
    const last = wordSearchCount - 1;
    [words[last], words[wordSearchCount]] = [words[wordSearchCount], words[last]];
  }
  return words;
}

const emptyGrid = (size: number): Cell[][] => Array.from({ length: size }, () =>
  Array.from({ length: size }, () => ({ letter: '', word: -1 })),
);

function placeWord(grid: Cell[][], word: PuzzleWord, { row, column, vertical }: Slot) {
  word.letters.forEach((letter, offset) => {
    grid[row + (vertical ? offset : 0)][column + (vertical ? 0 : offset)] = { letter, word: word.index };
  });
}

function tryMixedGrid(size: number, words: PuzzleWord[]) {
  const grid = emptyGrid(size);
  for (const word of words) {
    const slots: Slot[] = [];
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        if (column + word.letters.length <= size && word.letters.every((_, offset) => !grid[row][column + offset].letter)) {
          slots.push({ row, column, vertical: false });
        }
        if (row + word.letters.length <= size && word.letters.every((_, offset) => !grid[row + offset][column].letter)) {
          slots.push({ row, column, vertical: true });
        }
      }
    }
    if (!slots.length) return;
    placeWord(grid, word, slots[Math.floor(Math.random() * slots.length)]);
  }
  return grid;
}

export function makeWordGrid(level: SchoolLevel, words: readonly { text: string }[]): Cell[][] {
  const size = level === 'lh1' ? 7 : 10;
  const longestFirst = words.map(({ text }, index) => ({ letters: [...text], index }))
    .sort((first, second) => second.letters.length - first.letters.length);

  let grid = tryMixedGrid(size, longestFirst);
  for (let attempt = 0; !grid && attempt < 2; attempt++) grid = tryMixedGrid(size, longestFirst);
  if (!grid) {
    // Six words fit on separate lines at either level. Denser boards could use backtracking to retain mixed directions.
    const fallback = emptyGrid(size);
    const lines = shuffle(Array.from({ length: size }, (_, index) => index));
    const vertical = Math.random() > .5;
    longestFirst.forEach((word, index) => {
      const offset = Math.floor(Math.random() * (size - word.letters.length + 1));
      placeWord(fallback, word, {
        row: vertical ? offset : lines[index],
        column: vertical ? lines[index] : offset,
        vertical,
      });
    });
    grid = fallback;
  }

  const filler = 'AEIORNTSL';
  return grid.map(row => row.map(cell => cell.letter ? cell : { letter: filler[Math.floor(Math.random() * filler.length)], word: -1 }));
}
