import { describe, expect, it } from 'vitest';
import { generateMaze, moveInMaze } from './mazeLogic';

describe('maze logic', () => {
  it('generates varied, connected mazes with a reachable distant exit at both levels', () => {
    for (const [level, size] of [['lh1', 11], ['lh3', 17]] as const) {
      const maze = generateMaze(level, () => .37);
      expect(maze.size).toBe(size);
      expect(maze.walls[maze.start.y][maze.start.x]).toBe(false);
      expect(maze.walls[maze.goal.y][maze.goal.x]).toBe(false);
      expect(maze.shortestPath).toBeGreaterThan(size);
    }
    expect(generateMaze('lh1', () => .1).walls).not.toEqual(generateMaze('lh1', () => .9).walls);
  });

  it('moves into open cells and leaves the player in place at walls', () => {
    const maze = generateMaze('lh1', () => .42);
    const start = maze.start;
    expect(moveInMaze(maze, start, 'left')).toEqual(start);
    const openDirection = (['up', 'down', 'left', 'right'] as const).find(direction => moveInMaze(maze, start, direction) !== start);
    expect(openDirection).toBeTruthy();
    if (openDirection) expect(moveInMaze(maze, start, openDirection)).not.toEqual(start);
  });
});
