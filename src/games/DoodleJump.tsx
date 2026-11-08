import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameResult, Language, ProfileId, SchoolLevel } from '../types';
import { doodleScore, makeDoodleCourse } from '../utils/doodleLogic';
import { useAnswerFeedback } from './AnswerFeedback';
import './DoodleJump.css';

type Props = { lang: Language; level: SchoolLevel; profile: ProfileId; onComplete: (result: GameResult) => void };
type Run = { x: number; y: number; vy: number; camera: number; maxHeight: number; time: number };
const RUN_SECONDS = 45;

export function DoodleJump({ lang, level, profile, onComplete }: Props) {
  const eu = lang === 'eu';
  const team = profile === 'team';
  const feedback = useAnswerFeedback();
  const feedbackRef = useRef(feedback);
  const completionRef = useRef(onComplete);
  feedbackRef.current = feedback;
  completionRef.current = onComplete;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run>({ x: 180, y: 18, vy: 0, camera: 0, maxHeight: 0, time: 0 });
  const keys = useRef(new Set<string>());
  const direction = useRef(0);
  const completed = useRef(false);
  const [course] = useState(() => makeDoodleCourse(Math.floor(Math.random() * 0xffffffff)));
  const [runIndex, setRunIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const endRun = useCallback((score: number) => {
    if (completed.current) return;
    setLastScore(score);
    setPlaying(false);
    if (team && runIndex === 0) {
      setScores([score]);
      setPaused(false);
      return;
    }
    completed.current = true;
    const finalScores = team ? [...scores, score] : [score];
    const winner = finalScores[0] > finalScores[1] ? 'Nahia'
      : finalScores[1] > finalScores[0] ? 'Eider' : null;
    const summary = team
      ? winner ? `${winner} ${eu ? `irabazi du!` : `gana`} (${finalScores[0]} – ${finalScores[1]})`
        : (eu ? `Berdinketa! (${finalScores[0]} – ${finalScores[1]})` : `¡Empate! (${finalScores[0]} – ${finalScores[1]})`)
      : (eu ? `Zure puntuazioa: ${score}` : `Tu puntuación: ${score}`);
    const result: GameResult = {
      game: 'doodleJump', score: Math.max(...finalScores),
      correct: Math.max(...finalScores) > 0 ? 1 : 0, total: 1,
      stars: Math.min(3, 1 + Math.floor(Math.max(...finalScores) / 30)),
      ...(team ? { teamWin: !!winner } : {}), summary,
    };
    setScores(finalScores);
    feedbackRef.current.showFeedback(true, summary, () => completionRef.current(result));
  }, [eu, runIndex, scores, team]);

  useEffect(() => {
    if (!playing || paused || feedback.advancing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const run = runRef.current;
    const size = { width: 360, height: 560 };
    let frame = 0;
    let last = performance.now();
    let width = 0;
    let height = 0;
    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
      ctx.setTransform(scale * width / size.width, 0, 0, scale * height / size.height, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    const draw = (dt: number) => {
      run.time += dt;
      let steer = Number(keys.current.has('arrowright') || keys.current.has('d')) - Number(keys.current.has('arrowleft') || keys.current.has('a'));
      if (direction.current) steer = direction.current;
      run.x = Math.max(14, Math.min(346, run.x + steer * 285 * dt));
      run.vy -= 1120 * dt;
      const oldY = run.y;
      run.y += run.vy * dt;
      if (run.vy < 0) {
        for (const p of course) {
          if (oldY >= p.y && run.y <= p.y && run.x + 15 >= p.x && run.x - 15 <= p.x + p.width) {
            run.y = p.y; run.vy = level === 'lh1' ? 585 : 565;
            break;
          }
        }
      }
      run.maxHeight = Math.max(run.maxHeight, run.y);
      run.camera = Math.max(0, run.maxHeight - 270);

      ctx.clearRect(0, 0, 360, 560);
      const sky = ctx.createLinearGradient(0, 0, 0, 560);
      sky.addColorStop(0, '#9de4f2'); sky.addColorStop(1, '#e6f8f8');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 360, 560);
      ctx.fillStyle = 'rgba(255,255,255,.62)';
      for (let i = 0; i < 5; i++) {
        const x = (i * 97 + 26) % 360, y = (i * 133 + 30 - run.camera * .12) % 600;
        ctx.beginPath(); ctx.ellipse(x, y, 31, 10, 0, 0, Math.PI * 2); ctx.ellipse(x - 12, y - 7, 15, 10, 0, 0, Math.PI * 2); ctx.ellipse(x + 10, y - 8, 17, 12, 0, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of course) {
        const sy = 485 - (p.y - run.camera);
        if (sy < -20 || sy > 580) continue;
        ctx.fillStyle = '#3e9b67'; ctx.beginPath(); ctx.roundRect(p.x, sy, p.width, 13, 7); ctx.fill();
        ctx.fillStyle = '#87d879'; ctx.beginPath(); ctx.roundRect(p.x + 3, sy, p.width - 6, 5, 3); ctx.fill();
      }
      const py = 485 - (run.y - run.camera);
      ctx.fillStyle = '#ffca58'; ctx.beginPath(); ctx.ellipse(run.x, py - 21, 16, 21, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#493c63'; ctx.beginPath(); ctx.arc(run.x - 5, py - 25, 2, 0, Math.PI * 2); ctx.arc(run.x + 5, py - 25, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#493c63'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(run.x, py - 20, 5, .15, Math.PI - .15); ctx.stroke();
      const seconds = Math.max(0, Math.ceil(RUN_SECONDS - run.time));
      ctx.fillStyle = '#2b3d58'; ctx.font = 'bold 18px system-ui'; ctx.fillText(`${doodleScore(run.maxHeight)} pts`, 16, 30); ctx.fillText(`${seconds}s`, 316, 30);
      if (run.y < run.camera - 100 || run.time >= RUN_SECONDS) {
        endRun(doodleScore(run.maxHeight));
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    const tick = (now: number) => { const dt = Math.max(0, Math.min(.035, (now - last) / 1000)); last = now; draw(dt); };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [course, endRun, feedback.advancing, level, paused, playing]);

  useEffect(() => {
    if (!playing || paused || feedback.advancing) return;
    const pause = () => { keys.current.clear(); direction.current = 0; setPaused(true); };
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (event.type === 'keydown' && key === 'escape') { event.preventDefault(); pause(); }
      else if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) {
        event.preventDefault();
        if (event.type === 'keydown') keys.current.add(key); else keys.current.delete(key);
      }
    };
    const visibility = () => { if (document.hidden) pause(); };
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
    window.addEventListener('blur', pause); document.addEventListener('visibilitychange', visibility);
    return () => { keys.current.clear(); direction.current = 0; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', visibility); };
  }, [playing, paused, feedback.advancing]);

  const nextRun = () => { runRef.current = { x: 180, y: 18, vy: 0, camera: 0, maxHeight: 0, time: 0 }; setRunIndex(1); setLastScore(null); setPaused(false); setPlaying(true); };
  const name = runIndex === 0 ? 'Nahia' : 'Eider';
  return <section className="doodle-game">
    <header className="doodle-head"><div><h2>☁️ {eu ? 'Doodle jauzia' : 'Salto Doodle'}</h2><p>{team ? (eu ? 'Txandaka jolastu eta alderatu zuen puntuazioa' : 'Jugad por turnos y comparad la puntuación') : (eu ? 'Saltoz salto, hodeietaraino!' : '¡Salta de nube en nube!')}</p></div>
      <div className="doodle-scoreboard">{team && <span>Nahia: {scores[0] ?? '—'}</span>}{team && <span>Eider: {scores[1] ?? '—'}</span>}{!team && lastScore !== null && <span>{eu ? 'Puntuazioa' : 'Puntos'}: {lastScore}</span>}</div>
    </header>
    <div className="doodle-stage-wrap">
      <canvas ref={canvasRef} className="doodle-canvas" tabIndex={0} aria-label={eu ? 'Salto-jokoa. Erabili ezkerreko eta eskuineko geziak.' : 'Juego de saltos. Usa las flechas izquierda y derecha.'} />
      {!playing && lastScore === null && <div className="doodle-overlay"><strong>{eu ? 'Prest jauzi egiteko?' : '¿Lista para saltar?'}</strong><button className="primary" disabled={feedback.advancing} onClick={() => setPlaying(true)}>{eu ? 'Hasi' : 'Empezar'}</button></div>}
      {!playing && lastScore !== null && team && runIndex === 0 && <div className="doodle-overlay"><strong>{eu ? 'Orain Eiderren txanda!' : '¡Ahora juega Eider!'}</strong><p>{eu ? `Nahia: ${lastScore} puntu` : `Nahia: ${lastScore} puntos`}</p><button className="primary" disabled={feedback.advancing} onClick={nextRun}>{eu ? 'Hasi Eiderren txanda' : 'Empezar turno de Eider'}</button></div>}
      {paused && playing && <div className="doodle-overlay"><strong>{eu ? 'Jokoa pausatuta' : 'Juego en pausa'}</strong><button className="primary" onClick={() => setPaused(false)}>{eu ? 'Jarraitu' : 'Continuar'}</button></div>}
    </div>
    <div className="doodle-controls" aria-label={eu ? 'Joko-kontrolak' : 'Controles del juego'}>
      <button disabled={!playing || paused || feedback.advancing} aria-label={eu ? 'Ezkerra' : 'Izquierda'} onPointerDown={e => { e.preventDefault(); direction.current = -1; }} onPointerUp={() => direction.current = 0} onPointerCancel={() => direction.current = 0} onPointerLeave={() => direction.current = 0}>◀</button>
      <span>{eu ? 'Geziak edo botoiak' : 'Flechas o botones'}</span>
      <button disabled={!playing || paused || feedback.advancing} aria-label={eu ? 'Eskuinera' : 'Derecha'} onPointerDown={e => { e.preventDefault(); direction.current = 1; }} onPointerUp={() => direction.current = 0} onPointerCancel={() => direction.current = 0} onPointerLeave={() => direction.current = 0}>▶</button>
      {playing && !paused && <button className="doodle-pause" onClick={() => setPaused(true)}>{eu ? 'Pausatu' : 'Pausa'}</button>}
    </div>
    {team && <p className="doodle-turn">{eu ? `Jokalaria: ${name}` : `Juega: ${name}`} · {scores.length ? (eu ? `Nahia ${scores[0]} puntu` : `Nahia ${scores[0]} puntos`) : (eu ? `${RUN_SECONDS} segundoko txanda` : `Turno de ${RUN_SECONDS} segundos`)}</p>}
  </section>;
}
