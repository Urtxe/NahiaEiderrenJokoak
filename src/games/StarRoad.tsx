import { useEffect, useRef, useState } from 'react';
import type { CircuitId, Difficulty, GameResult, Language, ProfileId, RoadCarId, RoadProgress, Stats } from '../types';
import { effectiveLevel } from '../utils/gameLogic';
import { avoidableSpawn, cars, circuits, collisionEffect, roadReward, type RoadEntity } from '../utils/roadLogic';
import { carDepth, carImages, drawRoad, roadX, roadY, trackImages } from './roadArt';

type Mode = 'training' | 'race' | 'coop' | 'turns';
type Screen = 'setup' | 'race' | 'paused' | 'result';
type Direction = -1 | 1;
type Race = {
  x: number;
  distance: number;
  stars: number;
  energy: number;
  hits: number;
  avoided: number;
  turbo: number;
  turbosCollected: number;
  shield: number;
  magnet: number;
  entities: RoadEntity[];
  spawn: number;
  elapsed: number;
};

const carLabel = (id: RoadCarId, lang: Language) => ({
  red: lang === 'eu' ? 'Izar Gorria' : 'Estrella roja',
  blue: lang === 'eu' ? 'Hodei Urdina' : 'Nube azul',
  yellow: lang === 'eu' ? 'Eguzki Horia' : 'Sol amarillo',
  duo: lang === 'eu' ? 'Bikote Distiratsua' : 'Dúo brillante',
})[id];

const circuitLabel = (id: CircuitId, lang: Language) => ({
  forest: lang === 'eu' ? 'Basoko Zirkuitua' : 'Circuito del bosque',
  cloud: lang === 'eu' ? 'Hodeien Bidea' : 'Camino de las nubes',
  moon: lang === 'eu' ? 'Ilargiaren Ibilbidea' : 'Ruta de la luna',
})[id];

const makeRace = (): Race => ({
  x: 0, distance: 0, stars: 0, energy: 100, hits: 0, avoided: 0, turbo: 0,
  turbosCollected: 0, shield: 0, magnet: 0, entities: [], spawn: 0, elapsed: 0,
});

type Props = {
  lang: Language;
  difficulty: Difficulty;
  stats: Stats;
  profile: ProfileId;
  reducedMotion: boolean;
  suspended: boolean;
  onExit: (inProgress: boolean) => void;
  onRoadUpdate: (road: RoadProgress) => void;
  onComplete: (result: GameResult) => void;
};

export function StarRoad({ lang, difficulty, stats, profile, reducedMotion, suspended, onExit, onRoadUpdate, onComplete }: Props) {
  const level = effectiveLevel(difficulty, stats);
  const [screen, setScreen] = useState<Screen>('setup');
  const [mode, setMode] = useState<Mode>(profile === 'team' ? 'coop' : 'race');
  const [carId, setCarId] = useState<RoadCarId>(profile === 'team' ? 'duo' : stats.road.selectedCar);
  const [circuitId, setCircuitId] = useState<CircuitId>(stats.road.selectedCircuit);
  const [hud, setHud] = useState({ stars: 0, energy: 100, distance: 0, seconds: 0 });
  const [final, setFinal] = useState<{ run: Race; reward: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carRef = useRef<HTMLImageElement>(null);
  const keys = useRef(new Set<string>());
  const pointers = useRef(new Map<number, Direction>());
  const race = useRef(makeRace());
  const car = cars.find(c => c.id === carId)!;
  const circuit = circuits.find(c => c.id === circuitId)!;
  const duration = mode === 'training' ? 36 : mode === 'turns' ? 40 : level === 'seed' ? 60 : 90;
  const driving = screen === 'race' && !suspended;
  const text = (eu: string, es: string) => lang === 'eu' ? eu : es;

  const start = () => {
    race.current = makeRace();
    setHud({ stars: 0, energy: 100, distance: 0, seconds: duration });
    setScreen('race');
  };

  const finish = (run: Race) => {
    const objectives = Number(run.stars >= 10) + Number(run.energy >= 50) + Number(run.avoided >= 12) + Number(run.hits === 0);
    const reward = roadReward(run.stars, run.energy, run.hits === 0, objectives);
    setFinal({ run, reward });
    setScreen('result');
    const previous = stats.road;
    const circuitStats = previous.circuitStats[circuitId];
    const distance = Math.round(run.distance);
    onRoadUpdate({
      ...previous,
      selectedCar: carId,
      selectedCircuit: circuitId,
      circuitsPlayed: previous.circuitsPlayed.includes(circuitId) ? previous.circuitsPlayed : [...previous.circuitsPlayed, circuitId],
      objectives: previous.objectives + objectives,
      turbos: previous.turbos + run.turbosCollected,
      cleanStreak: run.hits === 0 ? previous.cleanStreak + 1 : 0,
      circuitStats: {
        ...previous.circuitStats,
        [circuitId]: {
          runs: circuitStats.runs + 1,
          stars: Math.max(circuitStats.stars, run.stars),
          distance: Math.max(circuitStats.distance, distance),
        },
      },
    });
    onComplete({
      game: 'road', score: run.stars, correct: run.stars, total: Math.max(1, distance),
      stars: reward,
      roadStars: run.stars, roadDistance: distance, roadRuns: 1, obstaclesAvoided: run.avoided,
      cleanRoad: run.hits === 0, teamWin: profile === 'team',
    });
  };

  useEffect(() => {
    if (!driving) return;
    canvasRef.current?.focus({ preventScroll: true });
    const pressed = keys.current;
    const touches = pointers.current;

    const pause = () => {
      pressed.clear();
      touches.clear();
      setScreen('paused');
    };
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.type === 'keyup') {
        pressed.delete(key);
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (key === 'escape') {
        event.preventDefault();
        pause();
      } else if (key === 'arrowleft' || key === 'arrowright' || key === 'a' || key === 'd') {
        event.preventDefault();
        pressed.add(key);
      }
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      pressed.clear();
      touches.clear();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [driving]);

  useEffect(() => {
    if (!driving) return;
    const canvas = canvasRef.current;
    const carElement = carRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !carElement || !ctx) return;

    let width = 0;
    let height = 0;
    let last = performance.now();
    let frameId: number;
    let gamepadsAllowed = true;

    const draw = () => {
      const run = race.current;
      drawRoad(ctx, width, height, run, circuit, reducedMotion);
      carElement.style.left = roadX(100, carDepth, run.x) + '%';
    };
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const steering = () => {
      let left = keys.current.has('arrowleft') || keys.current.has('a');
      let right = keys.current.has('arrowright') || keys.current.has('d');
      for (const direction of pointers.current.values()) {
        if (direction === -1) left = true;
        else right = true;
      }
      if (left || right) return Number(right) - Number(left);
      if (!gamepadsAllowed) return 0;
      try {
        const axis = navigator.getGamepads?.().find(pad => pad?.connected)?.axes[0] ?? 0;
        return Math.abs(axis) > .15 ? axis : 0;
      } catch {
        // Embeds can block the Gamepad API. Keep the race running with local controls.
        gamepadsAllowed = false;
        return 0;
      }
    };

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(.05, (now - last) / 1000));
      last = now;
      const run = race.current;
      run.x = Math.max(-.78, Math.min(.78, run.x + steering() * dt * 1.8 * car.control));
      const speed = (mode === 'training' ? .64 : 1) * (run.energy < 25 ? .72 : 1) * (run.turbo > 0 ? 1.35 : 1) * car.speed;
      run.distance += dt * 35 * speed;
      run.elapsed += dt;
      run.turbo = Math.max(0, run.turbo - dt);
      run.shield = Math.max(0, run.shield - dt);
      run.magnet = Math.max(0, run.magnet - dt);
      run.spawn += dt;
      const gap = level === 'seed' ? 1.05 : .72;
      if (run.spawn > gap) {
        run.spawn = 0;
        const existing = run.entities.filter(entity => entity.y < .22 && entity.kind === 'obstacle').map(entity => entity.x);
        let x = Math.random() * 1.5 - .75;
        for (let tries = 0; tries < 5 && !avoidableSpawn(existing, x); tries++) x = Math.random() * 1.5 - .75;
        const roll = Math.random();
        const kind = roll < .36 ? 'star' : roll < .43 ? 'bigStar' : roll < .48 ? 'turbo' : roll < .53 ? 'shield' : roll < .58 ? 'magnet' : 'obstacle';
        run.entities.push({ x, y: -.12, kind });
      }
      run.entities = run.entities.filter(entity => {
        entity.y += dt * (.33 + speed * .5);
        if (entity.y > .78 && !entity.hit && Math.abs(entity.x - run.x) < (entity.kind === 'obstacle' ? .18 : .22)) {
          entity.hit = true;
          if (entity.kind === 'obstacle') {
            if (run.shield > 0) run.shield = 0;
            else {
              run.energy = collisionEffect('obstacle', run.energy).energy;
              run.hits++;
            }
          } else if (entity.kind === 'turbo') {
            run.turbo = 4;
            run.turbosCollected++;
          } else if (entity.kind === 'shield') run.shield = 5;
          else if (entity.kind === 'magnet') run.magnet = 5;
          else run.stars += collisionEffect(entity.kind, run.energy).stars;
        }
        if (entity.kind === 'star' && run.magnet > 0 && Math.abs(entity.x - run.x) < .42 && entity.y > .45) {
          entity.hit = true;
          run.stars++;
        }
        if (entity.kind === 'obstacle' && entity.y > .98 && !entity.hit) run.avoided++;
        return entity.y < 1.12 && !entity.hit;
      });
      const seconds = Math.max(0, Math.ceil(duration - run.elapsed));
      const distance = Math.round(run.distance);
      const { stars, energy } = run;
      setHud(previous => previous.stars === stars && previous.energy === energy && previous.distance === distance && previous.seconds === seconds
        ? previous : { stars, energy, distance, seconds });
      draw();
      if (run.elapsed >= duration) finish(run);
      else frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [driving, car, circuit, level, mode, duration, reducedMotion]);

  const updatePref = (carValue: RoadCarId, circuitValue: CircuitId) => {
    setCarId(carValue);
    setCircuitId(circuitValue);
    onRoadUpdate({ ...stats.road, selectedCar: carValue, selectedCircuit: circuitValue });
  };
  const exitLabel = text('Jokoetara itzuli', 'Volver a los juegos');

  if (screen === 'setup') {
    const modes: [Mode, string][] = [
      ['training', '🌱 ' + text('Entrenamendua', 'Entrenamiento')],
      ['race', '🏆 ' + text('Izar Lasterketa', 'Carrera de estrellas')],
    ];
    if (profile === 'team') modes.push(['coop', '🤝 ' + text('Elkarrekin', 'Juntas')], ['turns', '🔄 ' + text('Txandaka', 'Por turnos')]);

    return <section className="game-shell race-select">
      <button className="secondary" onClick={() => onExit(false)}>← {exitLabel}</button>
      <div className="race-select-hero"><span>🏁</span><div>
        <p className="eyebrow">✨ {text('IZAR BIDEA', 'CAMINO DE ESTRELLAS')}</p>
        <h2>{text('Zirkuitu magikoetarako prest?', '¿Preparada para circuitos mágicos?')}</h2>
        <p>{text('Aukeratu autoa, pista eta abentura.', 'Elige coche, pista y aventura.')}</p>
      </div></div>
      <div className="mode-select">{modes.map(([id, label]) =>
        <button className={mode === id ? 'selected' : ''} key={id} onClick={() => setMode(id)}>{label}</button>
      )}</div>
      <h3>{text('Aukeratu zure autoa', 'Elige tu coche')}</h3>
      <div className="car-select">{cars.filter(c => profile === 'team' ? c.id === 'duo' : c.id !== 'duo').map(c =>
        <button className={carId === c.id ? 'selected' : ''} key={c.id} onClick={() => updatePref(c.id, circuitId)}>
          <img className="car-art" src={carImages[c.id]} alt="" />
          <strong>{carLabel(c.id, lang)}</strong>
          <small>⚡ {c.speed.toFixed(1)} · 🎯 {c.control.toFixed(1)} · ⭐ {c.magnet.toFixed(1)}</small>
        </button>
      )}</div>
      <h3>{text('Aukeratu zirkuitua', 'Elige circuito')}</h3>
      <div className="circuit-select">{circuits.map(c =>
        <button className={circuitId === c.id ? 'selected' : ''} key={c.id} onClick={() => updatePref(carId, c.id)}>
          <img src={trackImages[c.id]} alt="" />
          <strong>{circuitLabel(c.id, lang)}</strong>
          <small>{text('Eskuragarri', 'Disponible')}</small>
        </button>
      )}</div>
      <p className="controls-hint">⌨️ ← → · A D · 🎮 · 👆 {text('Pausa: Esc', 'Pausa: Esc')}</p>
      <button className="primary start-race" onClick={start}>{text('Hasi lasterketa', 'Empezar carrera')} →</button>
    </section>;
  }

  if (screen === 'result' && final) {
    const { run, reward } = final;
    const objectives = [
      run.stars >= 10 && text('10 izar bildu', 'Recoger 10 estrellas'),
      run.energy >= 50 && text('Energiaren erdia gorde', 'Mantener media energía'),
      run.avoided >= 12 && text('12 oztopo saihestu', 'Esquivar 12 obstáculos'),
      run.hits === 0 && text('Ibilbide garbia', 'Camino limpio'),
    ].filter(Boolean);
    return <section className="game-shell road-result">
      <img className="car-art" src={carImages[carId]} alt="" />
      <h2>{text('Helmugara iritsi zara!', '¡Has llegado a la meta!')}</h2>
      <p>{circuitLabel(circuitId, lang)} · {carLabel(carId, lang)}</p>
      <p>⭐ <strong>{reward} {text('sari-izar', 'estrellas de recompensa')}</strong></p>
      <div className="result-grid">
        <span>⭐<b>{run.stars}</b>{text('bildutako izarrak', 'estrellas recogidas')}</span>
        <span>📏<b>{Math.round(run.distance)}</b>{text('distantzia', 'distancia')}</span>
        <span>✨<b>{Math.round(run.energy)}%</b>{text('energia', 'energía')}</span>
      </div>
      <div className="objectives">
        <strong>🎯 {text('Lortutako helburuak', 'Objetivos logrados')}</strong>
        <p>{objectives.length ? objectives.join(' · ') : text('Zure hurrengo ibilbidean helburu bat probatu!', '¡Prueba un objetivo en tu próxima vuelta!')}</p>
      </div>
      <div className="modal-actions">
        <button className="secondary" onClick={() => setScreen('setup')}>{text('Aldatu zirkuitua', 'Cambiar circuito')}</button>
        <button className="primary" onClick={start}>{text('Berriro jolastu', 'Jugar otra vez')}</button>
        <button className="secondary" onClick={() => onExit(false)}>{exitLabel}</button>
      </div>
    </section>;
  }

  return <section className="game-shell canvas-race">
    <div className="race-hud">
      <div><small>{circuitLabel(circuitId, lang)}</small><strong>⭐ {hud.stars}</strong></div>
      <div className="hud-center"><span>📏 {hud.distance}</span><b>{hud.seconds}s</b><span>✨ {hud.energy}%</span></div>
      <div className="race-actions">
        <button onClick={() => setScreen('paused')} disabled={!driving} aria-label={text('Pausatu lasterketa', 'Pausar carrera')}>Ⅱ</button>
        <button onClick={() => onExit(true)} disabled={suspended}>{text('Irten', 'Salir')}</button>
      </div>
    </div>
    {mode === 'turns' && <p className="turn-pill race-turn">{text('Txanda: ', 'Turno: ')}<strong>{hud.seconds > 20 ? 'Nahia' : 'Eider'}</strong></p>}
    <div className="race-track" style={{ '--track-ground': circuit.ground } as React.CSSProperties}>
      <img className="race-scenery" src={trackImages[circuitId]} alt="" />
      <canvas ref={canvasRef} className="race-canvas" tabIndex={driving ? 0 : -1} aria-label={text('Izar Bidea: erabili ezkerreko eta eskuineko geziak', 'Camino de estrellas: usa las flechas izquierda y derecha')} />
      <img ref={carRef} className="race-car" src={carImages[carId]} style={{ top: roadY(100, carDepth) + '%' }} alt="" />
      {screen === 'paused' && !suspended && <div className="race-pause">
        <span aria-hidden="true">⏸️</span>
        <h2>{text('Atsedena', 'Pausa')}</h2>
        <div className="modal-actions">
          <button className="primary" autoFocus onClick={() => setScreen('race')}>{text('Jarraitu', 'Continuar')}</button>
          <button className="secondary" onClick={() => onExit(true)}>{exitLabel}</button>
        </div>
      </div>}
    </div>
    <div className="race-touch">
      {([-1, 1] as const).map(direction => <button
        key={direction}
        disabled={!driving}
        onPointerDown={event => {
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, direction);
        }}
        onPointerUp={event => pointers.current.delete(event.pointerId)}
        onPointerCancel={event => pointers.current.delete(event.pointerId)}
        onLostPointerCapture={event => pointers.current.delete(event.pointerId)}
        aria-label={direction === -1 ? text('Ezkerra', 'Izquierda') : text('Eskuina', 'Derecha')}
      >{direction === -1 ? '◀' : '▶'}</button>)}
    </div>
  </section>;
}
