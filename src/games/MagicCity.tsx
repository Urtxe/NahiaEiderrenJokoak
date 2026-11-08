import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { CityProgress, Difficulty, Language, ProfileId, Stats } from '../types';
import { cityItems, type CityItem } from '../data/content';
import { answerChoices, effectiveLevel, numberChoices, random } from '../utils/gameLogic';
import { tr } from '../data/i18n';
type Mission={prompt:string;options:string[];answer:number;reward:CityItem};
const buildingQuestions = [
  { id: 'park', eu: 'Non jar ditzakegu kulunkak eta txirristak?', es: '¿Dónde podemos poner columpios y toboganes?' },
  { id: 'library', eu: 'Non har ditzakegu liburuak maileguan?', es: '¿Dónde podemos tomar libros prestados?' },
  { id: 'hospital', eu: 'Zein eraikinetan zaintzen dituzte gaixoak?', es: '¿En qué edificio atienden a las personas enfermas?' },
  { id: 'school', eu: 'Non dituzte haurrek gelak eta jolastokia?', es: '¿Dónde tienen los niños clases y recreo?' },
  { id: 'bridge', eu: 'Zer erabil dezakegu ibaiaren beste aldera oinez joateko?', es: '¿Qué nos permite cruzar el río a pie?' },
  { id: 'lamp', eu: 'Zerk argiztatzen du kalea gauez?', es: '¿Qué ilumina la calle de noche?' },
];

const mission = (lang: Language, level: 'seed' | 'star', owned: string[], previous?: string): Mission => {
  if (Math.random() < .4) {
    const planted = 2 + Math.floor(Math.random() * (level === 'seed' ? 7 : 18));
    const missing = 2 + Math.floor(Math.random() * (level === 'seed' ? 5 : 13));
    const available = cityItems.filter(item => !owned.includes(item.id));
    const reward = random(available.length ? available : cityItems);
    const choices = numberChoices(missing);
    const total = planted + missing;
    return {
      prompt: lang === 'eu' ? `Parkeak ${total} lore behar ditu eta ${planted} ditu. Zenbat falta dira?` : `El parque necesita ${total} flores y ya tiene ${planted}. ¿Cuántas faltan?`,
      options: choices.options.map(String), answer: choices.answer, reward,
    };
  }
  const question = random(buildingQuestions.filter(item => item[lang] !== previous));
  const reward = cityItems.find(item => item.id === question.id)!;
  const choices = answerChoices(reward, cityItems.filter(item => buildingQuestions.some(candidate => candidate.id === item.id)));
  return { prompt: question[lang], options: choices.options.map(item => item.name[lang]), answer: choices.answer, reward };
};
 export function MagicCity({lang,difficulty,stats,profile,onCityChange,onSessionComplete}:{lang:Language;difficulty:Difficulty;stats:Stats;profile:ProfileId;onCityChange:(city:CityProgress)=>void;onSessionComplete:()=>void}){const {advancing,showFeedback}=useAnswerFeedback();const t=(k:Parameters<typeof tr>[1])=>tr(lang,k);const level=effectiveLevel(difficulty,stats);const [city,setCity]=useState(stats.city);const [current,setCurrent]=useState<Mission|null>(null);const [lastPrompt,setLastPrompt]=useState<string>();const [reward,setReward]=useState<CityItem|null>(null);const [moveMode,setMoveMode]=useState(false);const [moving,setMoving]=useState<number|null>(null);const [confirmClear,setConfirmClear]=useState(false);const save=(next:CityProgress)=>{setCity(next);onCityChange(next);};const start=()=>{const next=mission(lang,level,[...city.unlocked,...city.placed.map(x=>x.id)],lastPrompt);setCurrent(next);setLastPrompt(next.prompt);};
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
 const place=(x:number,y:number)=>{if(moving!==null){const placed=[...city.placed];const origin=placed[moving];const occupied=placed.findIndex(p=>p.x===x&&p.y===y);if(occupied>=0){[placed[moving],placed[occupied]]=[{...origin,x:placed[occupied].x,y:placed[occupied].y},{...placed[occupied],x:origin.x,y:origin.y}];}else placed[moving]={...origin,x,y};save({...city,placed});setMoving(null);return;}if(!reward||city.placed.some(p=>p.x===x&&p.y===y))return;const next={...city,placed:[...city.placed,{id:reward.id,x,y}],unlocked:[...city.unlocked.filter(id=>id!==reward.id),reward.id],missions:city.missions+1,happiness:city.happiness+reward.happiness};save(next);if(next.missions%3===0)onSessionComplete();setReward(null);showFeedback(true,lang==='eu'?'Zure hiria zoriontsuagoa da.':'Tu ciudad está más feliz.');};
 const empty=Array.from({length:16},(_,i)=>({x:i%4,y:Math.floor(i/4)}));const galleryItems=cityItems.filter(i=>city.unlocked.includes(i.id)&&!city.placed.some(p=>p.id===i.id));return <section className="game-shell city-game"><div className="game-top"><div><span className="eyebrow">🏘️ {t('city')}</span><h2>{lang==='eu'?'Zure hiri atsegina':'Tu ciudad amable'}</h2></div><span className="counter">😊 {city.happiness}</span></div><div className="city-milestones"><span className={city.placed.length>=4?'done':''}>🌱 {lang==='eu'?'Barrio Hazia':'Barrio Semilla'} 4</span><span className={city.placed.length>=8?'done':''}>🌈 {lang==='eu'?'Ostadarraren auzoa':'Barrio Arcoíris'} 8</span><span className={city.placed.length>=12?'done':''}>⭐ {lang==='eu'?'Izar Hiria':'Ciudad Estrella'} 12</span></div><div className="city-toolbar"><button className="secondary" onClick={start} disabled={!!current||!!reward}>{lang==='eu'?'Misio berria':'Nueva misión'} ({city.missions%3}/3)</button><button className={moveMode?'primary':'secondary'} onClick={()=>{setMoveMode(!moveMode);setMoving(null)}}>↔ {t('moveCity')}</button><button className="secondary" onClick={()=>setConfirmClear(true)}>🧹 {t('clearCity')}</button></div>{current&&<div className="city-mission"><h3>📜 {current.prompt}</h3><div className="answers">{current.options.map((o,i)=><button className="answer" key={o} disabled={advancing} onClick={()=>solve(i===current.answer)}>{o}</button>)}</div></div>}{reward&&<div className="placement-callout"><strong>{reward.icon} {reward.name[lang]}</strong><p>{lang==='eu'?'Aukeratu lursail huts bat kokatzeko.':'Elige una parcela vacía para colocarla.'}</p></div>}<div className="city-grid" aria-label={t('city')}>{empty.map(cell=>{const index=city.placed.findIndex(p=>p.x===cell.x&&p.y===cell.y);const piece=index>=0?cityItems.find(i=>i.id===city.placed[index].id):undefined;return <button key={`${cell.x}-${cell.y}`} className={`city-plot ${piece?'occupied':''} ${moving===index?'moving':''}`} onClick={()=>moveMode&&piece?setMoving(index):place(cell.x,cell.y)} aria-label={piece?piece.name[lang]:(lang==='eu'?'Lursail hutsa':'Parcela vacía')}>{piece?<><span>{piece.icon}</span><small>{piece.name[lang]}</small></>:<span>＋</span>}</button>})}</div><div className="gallery"><h3>🎒 {t('gallery')}</h3><div>{galleryItems.length?galleryItems.map(i=><span key={i.id} title={i.desc[lang]}>{i.icon} {i.name[lang]}</span>):<p>{lang==='eu'?'Misio bat osatu eraikuntzak aurkitzeko.':'Completa una misión para descubrir construcciones.'}</p>}</div></div>{confirmClear&&<div className="inline-confirm"><p>{lang==='eu'?'Ziur zaude hiri honetako eraikin guztiak kentzea nahi duzula?':'¿Quieres quitar todos los edificios de esta ciudad?'}</p><button className="secondary" onClick={()=>setConfirmClear(false)}>{t('cancel')}</button><button className="danger" onClick={()=>{save({placed:[],unlocked:[],missions:0,happiness:0});setConfirmClear(false)}}>{t('delete')}</button></div>}</section>;
}
