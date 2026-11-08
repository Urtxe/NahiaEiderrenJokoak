import { useEffect, useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { Difficulty, GameResult, Language, ProfileId, Stats } from '../types';
import { calculateStars, detectiveCases, effectiveLevel, generateDetectivePuzzle, validateSequence } from '../utils/gameLogic';
import { tr } from '../data/i18n';

export function MuseumDetectives({lang,difficulty,stats,profile,onComplete}:{lang:Language;difficulty:Difficulty;stats:Stats;profile:ProfileId;onComplete:(r:GameResult)=>void}){
 const { advancing, showFeedback } = useAnswerFeedback();
 const level=effectiveLevel(difficulty,stats);const [caseName]=useState(()=>detectiveCases[lang][Math.floor(Math.random()*detectiveCases[lang].length)]);const [puzzles]=useState(()=>Array.from({length:5},()=>generateDetectivePuzzle(level,lang)));const [step,setStep]=useState(-1);const [correct,setCorrect]=useState(0);const [streak,setStreak]=useState(0);const [maxStreak,setMaxStreak]=useState(0);const [help,setHelp]=useState(false);const [hidden,setHidden]=useState(false);const [sequence,setSequence]=useState<string[]>([]);const [showHint,setShowHint]=useState(false); const t=(k:Parameters<typeof tr>[1])=>tr(lang,k);const puzzle=puzzles[Math.max(0,step)];
 useEffect(()=>{if(step>=0&&puzzle?.kind==='memory'){setHidden(false);const id=window.setTimeout(()=>setHidden(true),level==='seed'?3600:2200);return()=>clearTimeout(id);}},[step,puzzle,level]);
 const advance = (good: boolean) => {
   if (advancing) return;
   if (!good) {
     setStreak(0);
     showFeedback(false, puzzle.hint);
     return;
   }
   const next = step + 1;
   const newCorrect = correct + 1;
   const newStreak = streak + 1;
   showFeedback(true, undefined, () => {
     if (next === puzzles.length) {
       onComplete({ game: 'museum', score: newCorrect, correct: newCorrect, total: puzzles.length, stars: calculateStars(newCorrect, puzzles.length), cases: 1, clues: puzzles.length, maxClueStreak: Math.max(maxStreak, newStreak), noHelpCase: !help });
     } else {
       setCorrect(newCorrect);
       setStreak(newStreak);
       setMaxStreak(Math.max(maxStreak, newStreak));
       setStep(next);
       setSequence([]);
       setShowHint(false);
     }
   });
 };
 const orderClick = (item: string) => {
   if (advancing) return;
   const expected = [...puzzle.options].sort((a, b) => Number(a) - Number(b));
   const next = [...sequence, item];
   if (!validateSequence(next, expected)) {
     setSequence([]);
     advance(false);
     return;
   }
   setSequence(next);
   if (next.length === expected.length) advance(true);
 };
 if(step===-1)return <section className="game-shell museum-game intro-panel"><span className="museum-big">🏛️</span><p className="eyebrow">🕵️ {t('museum')}</p><h2>{caseName}</h2><p>{lang==='eu'?'Museoan zerbait galdu da! Bildu bost pista objektu magikoa aurkitzeko.':'¡Algo se ha perdido en el museo! Reúne cinco pistas para encontrar el objeto mágico.'}</p><button className="primary" onClick={()=>setStep(0)}>{t('start')} →</button></section>;
 const turn=profile==='team'?(step%2===0?'Nahia':'Eider'):null;return <section className="game-shell museum-game"><div className="game-top"><div><span className="eyebrow">🕵️ {caseName}</span><h2>{lang==='eu'?'Bilatu hurrengo pista':'Busca la siguiente pista'}</h2></div><span className="counter">{step+1} / 5</span></div>{turn&&<p className="turn-pill">{t('turn')}: <strong>{turn}</strong></p>}<div className="museum-room"><span>🖼️</span><span>🏺</span><span>🦴</span><span>🗿</span></div><div className="question-card detective-card">{puzzle.display.length>0&&<div className="evidence">{puzzle.display.map((x,i)=><span key={i} className={puzzle.kind==='memory'&&hidden?'hidden-evidence':''}>{x}</span>)}</div>}<h3>{puzzle.kind==='memory'&&!hidden?(lang==='eu'?'Gogoratu objektuak...':'Recuerda los objetos...'):puzzle.prompt}</h3>{puzzle.kind==='order'?<div className="answers">{puzzle.options.map(o=><button className={`answer ${sequence.includes(o)?'used':''}`} disabled={advancing||sequence.includes(o)} key={o} onClick={()=>orderClick(o)}>{o}</button>)}</div>:<div className="answers">{puzzle.options.map((o,i)=><button className="answer" key={`${o}-${i}`} onClick={()=>advance(i===puzzle.answer)} disabled={advancing||(puzzle.kind==='memory'&&!hidden)}>{o}</button>)}</div>}<button className="read-button" disabled={advancing} onClick={()=>{setHelp(true);setShowHint(true)}}>💡 {t('hint')}</button>{showHint&&<p className="game-note" role="status">💡 {puzzle.hint}</p>}</div></section>;
}
