import { describe, expect, it } from 'vitest';
import { doodleScore, makeDoodleCourse } from './doodleLogic';

describe('Doodle Jump course', () => {
  it('repeats the same course for team turns and keeps platforms in reachable bounds', () => {
    const first = makeDoodleCourse(436);
    expect(makeDoodleCourse(436)).toEqual(first);
    expect(first).toHaveLength(70);
    for (let i = 1; i < first.length; i++) {
      const previous = first[i - 1], current = first[i];
      expect(current.y - previous.y).toBeGreaterThanOrEqual(70);
      expect(current.y - previous.y).toBeLessThan(84);
      expect(Math.abs(current.x - previous.x)).toBeLessThanOrEqual(78);
      expect(current.x).toBeGreaterThanOrEqual(12);
      expect(current.x + current.width).toBeLessThanOrEqual(348);
    }
  });

  it('scores the highest jump without rewarding repeated landings', () => {
    expect(doodleScore(284)).toBe(28);
    expect(doodleScore(-10)).toBe(0);
  });
});
