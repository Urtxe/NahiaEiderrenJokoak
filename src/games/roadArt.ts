import type { CircuitId, RoadCarId } from '../types';
import type { CircuitConfig, Pickup, RoadEntity } from '../utils/roadLogic';
import red from '../assets/road/car-red.webp';
import blue from '../assets/road/car-blue.webp';
import yellow from '../assets/road/car-yellow.webp';
import duo from '../assets/road/car-duo.webp';
import forest from '../assets/road/track-forest.webp';
import cloud from '../assets/road/track-cloud.webp';
import moon from '../assets/road/track-moon.webp';

export const carImages: Record<RoadCarId, string> = { red, blue, yellow, duo };
export const trackImages: Record<CircuitId, string> = { forest, cloud, moon };

const pickups: Record<Pickup, string> = { star: '⭐', bigStar: '🌟', turbo: '🌈', shield: '🛡️', magnet: '🧲' };

export const carDepth = .82;
export const roadX = (width: number, depth: number, lane: number) => width * (.5 + lane * (.014 + depth * .46));
export const roadY = (height: number, depth: number) => height * (.38 + depth * .62);

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  race: { x: number; distance: number; turbo: number; entities: RoadEntity[] },
  circuit: CircuitConfig,
  reducedMotion: boolean,
) {
  const strip = (far: number, near: number, left: number, right: number, color: string | CanvasGradient) => {
    const top = roadY(height, far);
    const bottom = roadY(height, near);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(roadX(width, far, left), top);
    ctx.lineTo(roadX(width, far, right), top);
    ctx.lineTo(roadX(width, near, right), bottom);
    ctx.lineTo(roadX(width, near, left), bottom);
    ctx.closePath();
    ctx.fill();
  };

  ctx.clearRect(0, 0, width, height);
  const asphalt = ctx.createLinearGradient(0, roadY(height, 0), 0, height);
  asphalt.addColorStop(0, '#8992a1');
  asphalt.addColorStop(.22, '#565c67');
  asphalt.addColorStop(1, '#262933');
  strip(0, 1, -1.08, 1.08, '#262831');
  strip(0, 1, -1, 1, asphalt);
  strip(0, 1, -.97, -.94, '#f3f0de');
  strip(0, 1, .94, .97, '#f3f0de');

  const travel = reducedMotion ? 0 : race.distance * .011;
  for (let mark = 0; mark < 11; mark++) {
    const far = ((mark / 11 + travel) % 1) ** 1.7;
    const near = Math.min(1, far + .018 + far * .047);
    strip(far, near, -.013, .013, '#fff5cb');
    strip(far, near, -1.08, -1, circuit.curb);
    strip(far, near, 1, 1.08, circuit.curb);
  }

  if (!reducedMotion && race.turbo > 0) {
    const x = roadX(width, carDepth, race.x);
    const y = roadY(height, carDepth);
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 48);
    glow.addColorStop(0, '#fff3b5');
    glow.addColorStop(1, '#ff9b4100');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 48, y - 48, 96, 96);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (const entity of race.entities) {
    if (entity.y < 0) continue;
    const x = roadX(width, entity.y, entity.x);
    const y = roadY(height, entity.y);
    const size = 14 + entity.y * 28;
    ctx.fillStyle = '#15182290';
    ctx.beginPath();
    ctx.ellipse(x, y - 2, size * .48, size * .15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${size}px system-ui`;
    ctx.fillText(entity.kind === 'obstacle' ? circuit.obstacle : pickups[entity.kind], x, y);
  }
}
