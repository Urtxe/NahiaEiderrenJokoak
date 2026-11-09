import type { ProfileId } from '../types';

export const WIDTH = 1200;
export const HEIGHT = 720;
export const PAPER = '#ffffff';

export const shapeIcons = {
  line: '╱', rectangle: '▭', oval: '◯', triangle: '△', star: '☆', heart: '♡',
} as const;
export const stickerIcons = {
  rainbow: '🌈', butterfly: '🦋', star: '⭐', flower: '🌻', cat: '🐱', rocket: '🚀', heart: '💖', moon: '🌙',
} as const;

export type Point = { x: number; y: number };
export type Shape = keyof typeof shapeIcons;
export type Sticker = keyof typeof stickerIcons;
export type Stroke = { kind: 'stroke'; color: string; size: number; points: Point[] };
export type Figure = { kind: 'shape'; shape: Shape; color: string; size: number; filled: boolean; start: Point; end: Point };
export type Layer =
  | Stroke
  | Figure
  | (Point & { kind: 'text'; color: string; size: number; text: string })
  | (Point & { kind: 'sticker'; sticker: Sticker; size: number });

type BoardEdit = Layer | { kind: 'clear' };
export type BoardHistory = { edits: BoardEdit[]; undone: BoardEdit[] };

export function editBoard(history: BoardHistory, edit: BoardEdit | { kind: 'undo' } | { kind: 'redo' }): BoardHistory {
  const { edits, undone } = history;
  if (edit.kind === 'undo') {
    const last = edits[edits.length - 1];
    return last ? { edits: edits.slice(0, -1), undone: [...undone, last] } : history;
  }
  if (edit.kind === 'redo') {
    const next = undone[undone.length - 1];
    return next ? { edits: [...edits, next], undone: undone.slice(0, -1) } : history;
  }
  return { edits: [...edits, edit], undone: [] };
}

export function visibleLayers(edits: readonly BoardEdit[]): Layer[] {
  let start = edits.length;
  while (start > 0 && edits[start - 1].kind !== 'clear') start--;
  return edits.slice(start).filter((edit): edit is Layer => edit.kind !== 'clear');
}

const boardKey = (profile: ProfileId) => `nahia-eider-board-v2-${profile}`;
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function isPoint(value: unknown): value is Point {
  return typeof value === 'object' && value !== null &&
    'x' in value && isNumber(value.x) && 'y' in value && isNumber(value.y);
}

function hasKey<T extends object>(map: T, key: unknown): key is keyof T {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key);
}

function isLayer(value: unknown): value is Layer {
  if (typeof value !== 'object' || value === null || !('kind' in value) ||
    !('size' in value) || !isNumber(value.size) || value.size <= 0) return false;
  if (value.kind === 'sticker') return 'sticker' in value && hasKey(stickerIcons, value.sticker) && isPoint(value);
  if (!('color' in value) || typeof value.color !== 'string' || !/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value.color)) return false;
  switch (value.kind) {
    case 'stroke': return 'points' in value && Array.isArray(value.points) && value.points.length > 0 && value.points.every(isPoint);
    case 'text': return 'text' in value && typeof value.text === 'string' && isPoint(value);
    case 'shape': return 'shape' in value && hasKey(shapeIcons, value.shape) && 'filled' in value && typeof value.filled === 'boolean' &&
      'start' in value && isPoint(value.start) && 'end' in value && isPoint(value.end);
    default: return false;
  }
}

export function loadBoard(profile: ProfileId, storage?: Pick<Storage, 'getItem'>): Layer[] {
  try {
    const source = storage ?? localStorage;
    const value: unknown = JSON.parse(source.getItem(boardKey(profile)) ?? source.getItem(`nahia-eider-board-v1-${profile}`) ?? '[]');
    return Array.isArray(value) ? value.filter(isLayer) : [];
  } catch {
    return [];
  }
}

export function saveBoard(profile: ProfileId, layers: Layer[], storage: Pick<Storage, 'setItem'>) {
  storage.setItem(boardKey(profile), JSON.stringify(layers));
}

function paintFigure(context: CanvasRenderingContext2D, figure: Figure) {
  const { shape, start, end, filled } = figure;
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const cx = x + width / 2;
  const cy = y + height / 2;
  context.beginPath();
  switch (shape) {
    case 'line':
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      return;
    case 'rectangle':
      context.rect(x, y, width, height);
      break;
    case 'oval':
      context.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2);
      break;
    case 'triangle':
      context.moveTo(cx, y);
      context.lineTo(x + width, y + height);
      context.lineTo(x, y + height);
      break;
    case 'star':
      context.moveTo(cx, y);
      for (let index = 1; index < 10; index++) {
        const angle = index * Math.PI / 5 - Math.PI / 2;
        const radius = index % 2 ? 0.44 : 1;
        context.lineTo(cx + Math.cos(angle) * width / 2 * radius, cy + Math.sin(angle) * height / 2 * radius);
      }
      break;
    case 'heart':
      context.moveTo(cx, y + height * 0.24);
      context.bezierCurveTo(x + width * 0.12, y - height * 0.38, x - width * 0.34, y + height * 0.36, cx, y + height);
      context.bezierCurveTo(x + width * 1.34, y + height * 0.36, x + width * 0.88, y - height * 0.38, cx, y + height * 0.24);
      break;
  }
  context.closePath();
  if (filled) context.fill();
  else context.stroke();
}

export function paintLayer(context: CanvasRenderingContext2D, layer: Layer) {
  context.textBaseline = 'middle';
  if (layer.kind === 'sticker') {
    context.font = `${layer.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    context.textAlign = 'center';
    context.fillStyle = '#393448';
    context.fillText(stickerIcons[layer.sticker], layer.x, layer.y);
    return;
  }
  context.fillStyle = layer.color;
  if (layer.kind === 'text') {
    context.font = `bold ${layer.size}px "Trebuchet MS", sans-serif`;
    context.textAlign = 'left';
    context.fillText(layer.text, layer.x, layer.y, Math.max(1, WIDTH - layer.x - 12));
    return;
  }
  context.strokeStyle = layer.color;
  context.lineWidth = layer.size;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (layer.kind === 'shape') {
    paintFigure(context, layer);
    return;
  }
  const [first, ...rest] = layer.points;
  context.beginPath();
  if (rest.length === 0) {
    context.arc(first.x, first.y, layer.size / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }
  context.moveTo(first.x, first.y);
  for (const point of rest) context.lineTo(point.x, point.y);
  context.stroke();
}
