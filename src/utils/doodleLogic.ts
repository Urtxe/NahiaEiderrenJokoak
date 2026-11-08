export interface DoodlePlatform {
  x: number;
  y: number;
  width: number;
}

/** Seeded course keeps the two team runs fair and repeatable. */
export function makeDoodleCourse(seed: number, count = 70): DoodlePlatform[] {
  let state = seed >>> 0 || 1;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const course: DoodlePlatform[] = [{ x: 135, y: 0, width: 90 }];
  for (let i = 1; i < count; i++) {
    const previous = course[i - 1];
    const width = 76 + random() * 18;
    const maxStep = 78;
    const x = Math.max(12, Math.min(360 - width - 12, previous.x + (random() * 2 - 1) * maxStep));
    course.push({ x, y: previous.y + 70 + random() * 14, width });
  }
  return course;
}

export function doodleScore(maxHeight: number): number {
  return Math.max(0, Math.floor(maxHeight / 10));
}
