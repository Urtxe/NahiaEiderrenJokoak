import { useEffect, useRef, useState } from 'react';
import type { Language, ProfileId } from '../types';
import { tr } from '../data/i18n';

type Point = { x: number; y: number };
type Layer =
  | { kind: 'stroke'; color: string; size: number; points: Point[] }
  | { kind: 'text'; color: string; size: number; x: number; y: number; text: string };
type Tool = 'draw' | 'text' | 'erase';

const WIDTH = 1200;
const HEIGHT = 720;
const COLORS = ['#393448', '#e9557a', '#e49b24', '#54ad68', '#4399d4', '#9473db'];

function loadBoard(profile: ProfileId): Layer[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`nahia-eider-board-v1-${profile}`) ?? '[]');
    return Array.isArray(value) ? value.filter((layer): layer is Layer => layer && (layer.kind === 'stroke' || layer.kind === 'text')) : [];
  } catch {
    return [];
  }
}

export function CreativeBoard({ lang, profile, onExit }: { lang: Language; profile: ProfileId; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStroke = useRef<Extract<Layer, { kind: 'stroke' }> | null>(null);
  const [layers, setLayers] = useState<Layer[]>(() => loadBoard(profile));
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(12);
  const [textSize, setTextSize] = useState(48);
  const [text, setText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`nahia-eider-board-v1-${profile}`, JSON.stringify(layers));
    } catch {
      // Keep the drawing available in the current session if local storage is full.
    }
  }, [layers, profile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.textBaseline = 'middle';
    for (const layer of layers) {
      if (layer.kind === 'text') {
        context.fillStyle = layer.color;
        context.font = `bold ${layer.size}px "Trebuchet MS", sans-serif`;
        context.fillText(layer.text, layer.x, layer.y, WIDTH - layer.x - 12);
      } else if (layer.points.length) {
        context.strokeStyle = layer.color;
        context.lineWidth = layer.size;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(layer.points[0].x, layer.points[0].y);
        for (const point of layer.points.slice(1)) context.lineTo(point.x, point.y);
        if (layer.points.length === 1) context.lineTo(layer.points[0].x + 0.1, layer.points[0].y + 0.1);
        context.stroke();
      }
    }
  }, [layers]);

  const pointFrom = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * WIDTH / rect.width, y: (event.clientY - rect.top) * HEIGHT / rect.height };
  };

  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFrom(event);
    if (tool === 'text') {
      if (text.trim()) setLayers(current => [...current, { kind: 'text', text: text.trim(), color, size: textSize, ...point }]);
      return;
    }
    const stroke: Extract<Layer, { kind: 'stroke' }> = { kind: 'stroke', color: tool === 'erase' ? '#fff' : color, size: tool === 'erase' ? brushSize * 3 : brushSize, points: [point] };
    activeStroke.current = stroke;
    const context = event.currentTarget.getContext('2d');
    if (context) {
      context.fillStyle = stroke.color;
      context.beginPath();
      context.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
      context.fill();
    }
  };

  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = activeStroke.current;
    const context = event.currentTarget.getContext('2d');
    if (!stroke || !context) return;
    const point = pointFrom(event);
    const previous = stroke.points[stroke.points.length - 1];
    stroke.points.push(point);
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const pointerUp = () => {
    const stroke = activeStroke.current;
    if (stroke) setLayers(current => [...current, stroke]);
    activeStroke.current = null;
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nire-sorkuntza.png';
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const t = (key: Parameters<typeof tr>[1]) => tr(lang, key);
  const toolLabel: Record<Tool, string> = { draw: t('draw'), text: t('textTool'), erase: t('erase') };

  return <section className="game-shell creative-board">
    <div className="game-top">
      <div><span className="eyebrow">🎨 {t('creativeBoard')}</span><h2>{t('boardTitle')}</h2></div>
      <button className="secondary" onClick={onExit}>← {t('back')}</button>
    </div>
    <div className="board-toolbar" aria-label={t('creativeBoard')}>
      {(['draw', 'text', 'erase'] as Tool[]).map(value => <button key={value} className={tool === value ? 'primary' : 'secondary'} onClick={() => setTool(value)}>{toolLabel[value]}</button>)}
      {tool !== 'text' ? <label>{t('brushSize')} <select value={brushSize} onChange={event => setBrushSize(Number(event.target.value))}><option value={7}>●</option><option value={14}>●●</option><option value={28}>●●●</option></select></label> : <label>{t('textSize')} <select value={textSize} onChange={event => setTextSize(Number(event.target.value))}><option value={32}>{t('small')}</option><option value={48}>{t('medium')}</option><option value={68}>{t('large')}</option></select></label>}
      <label className="board-color-label">{t('boardColor')} <span className="board-colors">{COLORS.map(value => <button type="button" key={value} className={`board-color ${color === value ? 'selected' : ''}`} style={{ backgroundColor: value }} aria-label={value} aria-pressed={color === value} onClick={() => setColor(value)} />)}</span></label>
      {tool === 'text' && <input className="board-text-input" value={text} maxLength={80} onChange={event => setText(event.target.value)} placeholder={t('textPlaceholder')} aria-label={t('textPlaceholder')} />}
      <button className="secondary" onClick={() => setLayers(current => current.slice(0, -1))} disabled={!layers.length}>↶ {t('undo')}</button>
      <button className="secondary" onClick={download}>⬇ {t('downloadImage')}</button>
      <button className="secondary" onClick={() => setConfirmClear(true)} disabled={!layers.length}>🧹 {t('clearBoard')}</button>
    </div>
    {tool === 'text' && <p className="board-hint">{lang === 'eu' ? 'Idatzi testua eta ukitu arbelean kokatzeko.' : 'Escribe el texto y toca la pizarra para colocarlo.'}</p>}
    <canvas ref={canvasRef} className={`board-canvas ${tool === 'text' ? 'text-mode' : ''}`} width={WIDTH} height={HEIGHT} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label={t('creativeBoard')} />
    <p className="board-saved">💾 {t('boardSaved')}</p>
    {confirmClear && <div className="inline-confirm"><p>{t('confirmClearBoard')}</p><button className="secondary" onClick={() => setConfirmClear(false)}>{t('cancel')}</button><button className="danger" onClick={() => { setLayers([]); setConfirmClear(false); }}>{t('clearBoard')}</button></div>}
  </section>;
}
