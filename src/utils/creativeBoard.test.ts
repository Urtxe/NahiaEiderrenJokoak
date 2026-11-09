import { describe, expect, it } from 'vitest';
import { editBoard, loadBoard, saveBoard, visibleLayers, type BoardHistory, type Layer } from './creativeBoard';

const stroke: Layer = { kind: 'stroke', color: '#fff', size: 21, points: [{ x: 10, y: 10 }] };
const text: Layer = { kind: 'text', color: '#393448', size: 48, x: 20, y: 30, text: 'Kaixo' };
const shape: Layer = {
  kind: 'shape', shape: 'rectangle', color: '#4399d4', size: 7, filled: true,
  start: { x: 10, y: 20 }, end: { x: 100, y: 120 },
};
const sticker: Layer = { kind: 'sticker', sticker: 'butterfly', size: 88, x: 50, y: 40 };

describe('creative board', () => {
  it('preserves legacy drawings and keeps the new layers separate by profile', () => {
    const old = JSON.stringify([stroke, text]);
    const data = new Map([['nahia-eider-board-v1-nahia', old]]);
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
    };
    expect(loadBoard('nahia', storage)).toEqual([stroke, text]);
    saveBoard('nahia', [stroke, text, shape, sticker], storage);
    expect(loadBoard('nahia', storage)).toEqual([stroke, text, shape, sticker]);
    expect(loadBoard('eider', storage)).toEqual([]);
    expect(data.get('nahia-eider-board-v1-nahia')).toBe(old);
    saveBoard('nahia', [], storage);
    expect(loadBoard('nahia', storage)).toEqual([]);
  });

  it('undoes and redoes a clear, and drops redo after a new edit', () => {
    const start: BoardHistory = { edits: [stroke, shape], undone: [] };
    const cleared = editBoard(start, { kind: 'clear' });
    expect(visibleLayers(cleared.edits)).toEqual([]);
    const restored = editBoard(cleared, { kind: 'undo' });
    expect(visibleLayers(restored.edits)).toEqual([stroke, shape]);
    expect(visibleLayers(editBoard(restored, { kind: 'redo' }).edits)).toEqual([]);
    const changed = editBoard(restored, sticker);
    expect(changed.undone).toEqual([]);
    expect(visibleLayers(changed.edits)).toEqual([stroke, shape, sticker]);
  });
});
