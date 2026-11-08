import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { CityProgress, Difficulty, Language, ProfileId, Stats } from '../types';
import { cityItems, type CityItem } from '../data/content';
import { effectiveLevel } from '../utils/gameLogic';
import { tr } from '../data/i18n';
import { drawCityMission, type CityMission } from '../utils/cityMissions';

type Props = {
  lang: Language;
  difficulty: Difficulty;
  stats: Stats;
  profile: ProfileId;
  onCityChange: (city: CityProgress) => void;
  onSessionComplete: (happiness: number) => void;
};

export function MagicCity({ lang, difficulty, stats, onCityChange, onSessionComplete }: Props) {
  const { advancing, showFeedback } = useAnswerFeedback();
  const t = (key: Parameters<typeof tr>[1]) => tr(lang, key);
  const level = effectiveLevel(difficulty, stats);
  const [city, setCity] = useState(stats.city);
  const [current, setCurrent] = useState<CityMission | null>(null);
  const [reward, setReward] = useState<CityItem | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [moving, setMoving] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const full = city.placed.length >= 16;
  const busy = advancing || !!current || !!reward || confirmClear;

  const save = (next: CityProgress) => {
    setCity(next);
    onCityChange(next);
  };
  const start = () => {
    if (busy) return;
    const owned = [...city.unlocked, ...city.placed.map(item => item.id)];
    const { mission, usedMissions } = drawCityMission(lang, level, owned, city.usedMissions);
    setMoveMode(false);
    setMoving(null);
    setCurrent(mission);
    save({ ...city, usedMissions });
  };
 const solve = (good: boolean) => {
   if (advancing || !current) return;
   if (!good) {
     showFeedback(false, lang === 'eu' ? 'Irakurri misioa berriro eta probatu beste aukera bat.' : 'Lee la misión de nuevo y prueba otra opción.');
     return;
   }
   setReward(current.reward);
   setCurrent(null);
   showFeedback(true, lang === 'eu' ? 'Eraikuntza berri bat irabazi duzu!' : '¡Has ganado una construcción nueva!');
 };
 const place = (x: number, y: number) => {
   if (advancing || confirmClear) return;
   const occupied = city.placed.findIndex(piece => piece.x === x && piece.y === y);
   if (moving !== null) {
     const placed = [...city.placed];
     const origin = placed[moving];
     if (occupied >= 0) {
       [placed[moving], placed[occupied]] = [{ ...origin, x, y }, { ...placed[occupied], x: origin.x, y: origin.y }];
     } else {
       placed[moving] = { ...origin, x, y };
     }
     save({ ...city, placed });
     setMoving(null);
     return;
   }
   if (!reward || (!full && occupied >= 0)) return;
   const placed = [...city.placed];
   const piece = { id: reward.id, x, y };
   let replacedHappiness = 0;
   if (occupied >= 0) {
     replacedHappiness = cityItems.find(item => item.id === placed[occupied].id)?.happiness ?? 0;
     placed[occupied] = piece;
   } else {
     placed.push(piece);
   }
   const next = {
     ...city,
     placed,
     unlocked: [...new Set([...city.unlocked, reward.id])],
     missions: city.missions + 1,
     happiness: Math.max(0, city.happiness + reward.happiness - replacedHappiness),
   };
   setReward(null);
   save(next);
   if (next.missions % 3 === 0) onSessionComplete(next.happiness);
   else showFeedback(true, lang === 'eu' ? 'Eraikuntza kokatu duzu!' : '¡Has colocado la construcción!');
 };
 const empty=Array.from({length:16},(_,i)=>({x:i%4,y:Math.floor(i/4)}));const galleryItems=cityItems.filter(i=>city.unlocked.includes(i.id)&&!city.placed.some(p=>p.id===i.id));return <section className="game-shell city-game"><div className="game-top"><div><span className="eyebrow">🏘️ {t('city')}</span><h2>{lang==='eu'?'Zure hiri atsegina':'Tu ciudad amable'}</h2></div><span className="counter">😊 {city.happiness}</span></div><div className="city-milestones"><span className={city.placed.length>=4?'done':''}>🌱 {lang==='eu'?'Barrio Hazia':'Barrio Semilla'} 4</span><span className={city.placed.length>=8?'done':''}>🌈 {lang==='eu'?'Ostadarraren auzoa':'Barrio Arcoíris'} 8</span><span className={city.placed.length>=12?'done':''}>⭐ {lang==='eu'?'Izar Hiria':'Ciudad Estrella'} 12</span></div><div className="city-toolbar"><button className="secondary" onClick={start} disabled={busy}>{lang==='eu'?'Misio berria':'Nueva misión'} ({city.missions%3}/3)</button><button className={moveMode?'primary':'secondary'} disabled={busy} onClick={()=>{setMoveMode(!moveMode);setMoving(null)}}>↔ {t('moveCity')}</button><button className="secondary" disabled={busy} onClick={()=>setConfirmClear(true)}>🧹 {t('clearCity')}</button></div>{current&&<div className="city-mission"><h3>📜 {current.prompt}</h3><div className="answers">{current.options.map((o,i)=><button className="answer" key={o} disabled={advancing} onClick={()=>solve(i===current.answer)}>{o}</button>)}</div></div>}{reward&&<div className="placement-callout"><strong>{reward.icon} {reward.name[lang]}</strong><p>{full?(lang==='eu'?'Hiria beteta dago. Aukeratu ordezkatu nahi duzun eraikuntza.':'La ciudad está llena. Elige una construcción para sustituirla.'):(lang==='eu'?'Aukeratu lursail huts bat kokatzeko.':'Elige una parcela vacía para colocarla.')}</p></div>}<div className="city-grid" aria-label={t('city')}>{empty.map(cell=>{const index=city.placed.findIndex(p=>p.x===cell.x&&p.y===cell.y);const piece=index>=0?cityItems.find(i=>i.id===city.placed[index].id):undefined;return <button key={`${cell.x}-${cell.y}`} className={`city-plot ${piece?'occupied':''} ${moving===index?'moving':''}`} disabled={advancing||confirmClear} onClick={()=>moveMode&&piece?setMoving(index):place(cell.x,cell.y)} aria-label={piece?piece.name[lang]:(lang==='eu'?'Lursail hutsa':'Parcela vacía')}>{piece?<><span>{piece.icon}</span><small>{piece.name[lang]}</small></>:<span>＋</span>}</button>})}</div><div className="gallery"><h3>🎒 {t('gallery')}</h3><div>{galleryItems.length?galleryItems.map(i=><span key={i.id} title={i.desc[lang]}>{i.icon} {i.name[lang]}</span>):<p>{lang==='eu'?'Misio bat osatu eraikuntzak aurkitzeko.':'Completa una misión para descubrir construcciones.'}</p>}</div></div>{confirmClear&&<div className="inline-confirm"><p>{lang==='eu'?'Ziur zaude hiri honetako eraikin guztiak kentzea nahi duzula?':'¿Quieres quitar todos los edificios de esta ciudad?'}</p><button className="secondary" onClick={()=>setConfirmClear(false)}>{t('cancel')}</button><button className="danger" onClick={()=>{save({...city,placed:[],unlocked:[],missions:0,happiness:0});setMoveMode(false);setMoving(null);setConfirmClear(false)}}>{t('delete')}</button></div>}</section>;
}
