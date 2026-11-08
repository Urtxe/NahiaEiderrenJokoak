import type { SchoolLevel } from '../types';

export type MazePoint = { x: number; y: number };
export type Maze = { size: number; walls: boolean[][]; start: MazePoint; goal: MazePoint; shortestPath: number };
export type MazeDirection = 'up' | 'down' | 'left' | 'right';

const directions: Record<MazeDirection, MazePoint> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

/** Carves a randomized perfect maze, then places the exit at the farthest reachable passage. */
export function generateMaze(level: SchoolLevel, random: () => number = Math.random): Maze {
  const size = level === 'lh1' ? 11 : 17;
  const walls = Array.from({ length: size }, () => Array<boolean>(size).fill(true));
  const start = { x: 1, y: 1 };
  walls[start.y][start.x] = false;
  const stack = [start];
  while (stack.length) {
    const current = stack[stack.length - 1];
    const options = (Object.values(directions) as MazePoint[])
      .map(delta => ({ x: current.x + delta.x * 2, y: current.y + delta.y * 2, delta }))
      .filter(next => next.x > 0 && next.x < size - 1 && next.y > 0 && next.y < size - 1 && walls[next.y][next.x]);
    if (!options.length) { stack.pop(); continue; }
    const next = options[Math.min(options.length - 1, Math.floor(random() * options.length))];
    walls[current.y + next.delta.y][current.x + next.delta.x] = false;
    walls[next.y][next.x] = false;
    stack.push({ x: next.x, y: next.y });
  }

  const distances = new Map<string, { point: MazePoint; distance: number }>();
  const queue = [{ point: start, distance: 0 }];
  distances.set(key(start), queue[0]);
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const delta of Object.values(directions) as MazePoint[]) {
      const point = { x: current.point.x + delta.x, y: current.point.y + delta.y };
      if (walls[point.y]?.[point.x] !== false || distances.has(key(point))) continue;
      const found = { point, distance: current.distance + 1 };
      distances.set(key(point), found);
      queue.push(found);
    }
  }
  const goal = queue.reduce((best, item) => item.distance > best.distance ? item : best, queue[0]);
  return { size, walls, start, goal: goal.point, shortestPath: goal.distance };
}

function key(point: MazePoint) { return `${point.x},${point.y}`; }

export function moveInMaze(maze: Maze, position: MazePoint, direction: MazeDirection): MazePoint {
  const delta = directions[direction];
  const next = { x: position.x + delta.x, y: position.y + delta.y };
  return maze.walls[next.y]?.[next.x] === false ? next : position;
}
