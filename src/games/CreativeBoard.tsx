import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type PointerEvent } from 'react';
import type { Language, ProfileId } from '../types';
import { tr, type WordKey } from '../data/i18n';
import {
  editBoard, HEIGHT, loadBoard, paintLayer, PAPER, saveBoard, shapeIcons, stickerIcons, visibleLayers, WIDTH,
  type Figure, type Point, type Shape, type Sticker, type Stroke,
} from '../utils/creativeBoard';

const tools = {
  draw: ['✏️', 'draw'], shape: ['🔷', 'boardShapes'], sticker: ['🌈', 'boardStickers'],
  text: ['🔤', 'textTool'], erase: ['🧽', 'erase'],
} as const;
type Tool = keyof typeof tools;

const hints: Record<Tool, WordKey> = {
  draw: 'boardDrawHint', shape: 'boardShapeHint', sticker: 'boardStickerHint',
  text: 'boardTextHint', erase: 'boardEraseHint',
};
const colors = [
  ['#393448', 'boardBlack'], ['#e9557a', 'boardPink'], ['#ec7640', 'boardOrange'],
  ['#e49b24', 'boardYellow'], ['#54ad68', 'boardGreen'], ['#4399d4', 'boardBlue'],
  ['#9473db', 'boardPurple'], ['#ffffff', 'boardWhite'],
] as const;
const shapeLabels: Record<Shape, WordKey> = {
  line: 'boardLine', rectangle: 'boardRectangle', oval: 'boardOval',
  triangle: 'boardTriangle', star: 'star', heart: 'boardHeart',
};
const stickerLabels: Record<Sticker, WordKey> = {
  rainbow: 'boardRainbow', butterfly: 'boardButterfly', star: 'star', flower: 'boardFlower',
  cat: 'boardCat', rocket: 'boardRocket', heart: 'boardHeart', moon: 'boardMoon',
};

type Gesture = { pointerId: number; draft: Stroke | Figure };

function pointFrom(event: PointerEvent<HTMLCanvasElement>): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(WIDTH, (event.clientX - rect.left) * WIDTH / rect.width)),
    y: Math.max(0, Math.min(HEIGHT, (event.clientY - rect.top) * HEIGHT / rect.height)),
  };
}

export function CreativeBoard({ lang, profile, onExit }: { lang: Language; profile: ProfileId; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const active = useRef<Gesture | null>(null);
  const [history, edit] = useReducer(editBoard, profile, id => ({ edits: loadBoard(id), undone: [] }));
  const layers = useMemo(() => visibleLayers(history.edits), [history.edits]);
  const lastSaved = useRef(layers);
  const [saveFailed, setSaveFailed] = useState(false);
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState<string>(colors[0][0]);
  const [brushSize, setBrushSize] = useState(14);
  const [textSize, setTextSize] = useState(48);
  const [stickerSize, setStickerSize] = useState(88);
  const [shape, setShape] = useState<Shape>('rectangle');
  const [filled, setFilled] = useState(false);
  const [sticker, setSticker] = useState<Sticker>('rainbow');
  const [text, setText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (lastSaved.current === layers) return;
    try {
      saveBoard(profile, layers, localStorage);
      lastSaved.current = layers;
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [layers, profile]);

  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.fillStyle = PAPER;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    for (const layer of layers) paintLayer(context, layer);
  }, [layers]);

  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!event.isPrimary || event.button !== 0 || active.current || confirmClear) return;
    const point = pointFrom(event);
    if (tool === 'text') {
      const content = text.trim();
      if (content) edit({ kind: 'text', text: content, color, size: textSize, ...point });
      return;
    }
    if (tool === 'sticker') {
      edit({ kind: 'sticker', sticker, size: stickerSize, ...point });
      return;
    }
    const draft: Stroke | Figure = tool === 'shape'
      ? { kind: 'shape', shape, color, size: brushSize, filled, start: point, end: point }
      : { kind: 'stroke', color: tool === 'erase' ? PAPER : color, size: tool === 'erase' ? brushSize * 3 : brushSize, points: [point] };
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current = { pointerId: event.pointerId, draft };
    const preview = previewRef.current?.getContext('2d');
    if (preview && draft.kind === 'stroke') paintLayer(preview, draft);
  };

  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const gesture = active.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const { draft } = gesture;
    const point = pointFrom(event);
    const preview = previewRef.current?.getContext('2d');
    if (draft.kind === 'shape') {
      draft.end = point;
      if (preview) {
        preview.clearRect(0, 0, WIDTH, HEIGHT);
        paintLayer(preview, draft);
      }
    } else {
      const previous = draft.points[draft.points.length - 1];
      draft.points.push(point);
      if (preview) paintLayer(preview, { ...draft, points: [previous, point] });
    }
  };

  const finishGesture = (event: PointerEvent<HTMLCanvasElement>, commit: boolean) => {
    const gesture = active.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    active.current = null;
    previewRef.current?.getContext('2d')?.clearRect(0, 0, WIDTH, HEIGHT);
    if (!commit) return;
    const { draft } = gesture;
    const point = pointFrom(event);
    if (draft.kind === 'shape') {
      draft.end = point;
      const dx = Math.abs(draft.start.x - point.x);
      const dy = Math.abs(draft.start.y - point.y);
      if (draft.shape === 'line' ? Math.hypot(dx, dy) < 4 : dx < 4 || dy < 4) return;
    } else {
      const last = draft.points[draft.points.length - 1];
      if (last.x !== point.x || last.y !== point.y) draft.points.push(point);
    }
    edit(draft);
  };

  const download = () => {
    canvasRef.current?.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = lang === 'eu' ? 'nire-sorkuntza.png' : 'mi-creacion.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  const t = (key: WordKey) => tr(lang, key);
  const usesColor = tool !== 'erase' && tool !== 'sticker';
  const usesBrush = tool === 'draw' || tool === 'erase' || tool === 'shape';
  const sizes: WordKey[] = ['small', 'medium', 'large'];

  return <section className="game-shell creative-board">
    <div className="game-top">
      <div><span className="eyebrow">🎨 {t('creativeBoard')}</span><h2>{t('boardTitle')}</h2></div>
      <button className="secondary" onClick={onExit}>← {t('back')}</button>
    </div>
    <div className="board-toolbar">
      <div className="board-tools" role="group" aria-label={t('boardTools')}>
        {(Object.keys(tools) as Tool[]).map(value => {
          const [icon, label] = tools[value];
          return <button key={value} className={tool === value ? 'primary' : 'secondary'}
            aria-pressed={tool === value} onClick={() => setTool(value)}>
            <span aria-hidden="true">{icon}</span> {t(label)}
          </button>;
        })}
      </div>
      <div className="board-options">
        {tool === 'shape' && <>
          <div className="board-picks" role="group" aria-label={t('boardShapes')}>
            {(Object.keys(shapeIcons) as Shape[]).map(value => <button key={value} className="board-pick"
              aria-label={t(shapeLabels[value])} title={t(shapeLabels[value])}
              aria-pressed={shape === value} onClick={() => setShape(value)}>{shapeIcons[value]}</button>)}
          </div>
          {shape !== 'line' && <label className="board-fill">
            <input type="checkbox" checked={filled} onChange={event => setFilled(event.target.checked)} /> {t('boardFill')}
          </label>}
        </>}
        {tool === 'sticker' && <div className="board-picks" role="group" aria-label={t('boardStickers')}>
          {(Object.keys(stickerIcons) as Sticker[]).map(value => <button key={value} className="board-pick"
            aria-label={t(stickerLabels[value])} title={t(stickerLabels[value])}
            aria-pressed={sticker === value} onClick={() => setSticker(value)}>{stickerIcons[value]}</button>)}
        </div>}
        {usesBrush && <label>{t('brushSize')}
          <select value={brushSize} onChange={event => setBrushSize(Number(event.target.value))}>
            {[7, 14, 28].map((value, index) => <option key={value} value={value}>{t(sizes[index])}</option>)}
          </select>
        </label>}
        {tool === 'sticker' && <label>{t('boardStickerSize')}
          <select value={stickerSize} onChange={event => setStickerSize(Number(event.target.value))}>
            {[54, 88, 128].map((value, index) => <option key={value} value={value}>{t(sizes[index])}</option>)}
          </select>
        </label>}
        {tool === 'text' && <>
          <input className="board-text-input" value={text} maxLength={80} onChange={event => setText(event.target.value)}
            placeholder={t('textPlaceholder')} aria-label={t('textPlaceholder')} />
          <label>{t('textSize')}
            <select value={textSize} onChange={event => setTextSize(Number(event.target.value))}>
              {[32, 48, 68].map((value, index) => <option key={value} value={value}>{t(sizes[index])}</option>)}
            </select>
          </label>
        </>}
      </div>
      {usesColor && <div className="board-palette" role="group" aria-label={t('boardColor')}>
        <span aria-hidden="true">{t('boardColor')}</span>
        {colors.map(([value, label]) => <button key={value} className="board-color" style={{ backgroundColor: value }}
          aria-label={t(label)} title={t(label)} aria-pressed={color === value} onClick={() => setColor(value)} />)}
        <input className="board-custom-color" type="color" value={color} onChange={event => setColor(event.target.value)}
          aria-label={t('boardCustomColor')} title={t('boardCustomColor')} />
      </div>}
    </div>
    <p id="board-hint" className="board-hint">{t(hints[tool])}</p>
    <div className="board-paper">
      <canvas ref={canvasRef} className={`board-canvas ${tool === 'text' ? 'text-mode' : ''}`} width={WIDTH} height={HEIGHT}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => finishGesture(event, true)}
        onPointerCancel={event => finishGesture(event, false)} onLostPointerCapture={event => finishGesture(event, false)}
        aria-label={t('creativeBoard')} aria-describedby="board-hint" />
      <canvas ref={previewRef} className="board-preview" width={WIDTH} height={HEIGHT} aria-hidden="true" />
    </div>
    <div className="board-actions" role="group" aria-label={t('boardActions')}>
      <button className="secondary" onClick={() => edit({ kind: 'undo' })} disabled={!history.edits.length}>↶ {t('undo')}</button>
      <button className="secondary" onClick={() => edit({ kind: 'redo' })} disabled={!history.undone.length}>↷ {t('boardRedo')}</button>
      <button className="secondary" onClick={download}>⬇ {t('downloadImage')}</button>
      <button className="secondary" onClick={() => setConfirmClear(true)} disabled={!layers.length}>🧹 {t('clearBoard')}</button>
    </div>
    {confirmClear && <div className="inline-confirm">
      <p>{t('confirmClearBoard')}</p>
      <button className="secondary" onClick={() => setConfirmClear(false)}>{t('cancel')}</button>
      <button className="danger" onClick={() => { edit({ kind: 'clear' }); setConfirmClear(false); }}>{t('clearBoard')}</button>
    </div>}
    {saveFailed
      ? <p className="board-saved board-save-error" role="alert">{t('boardSaveError')}</p>
      : <p className="board-saved">💾 {t('boardSaved')}</p>}
  </section>;
}
