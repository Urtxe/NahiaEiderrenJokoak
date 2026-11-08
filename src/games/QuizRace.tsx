import { useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { Difficulty, GameResult, Language, ProfileId, Stats } from '../types';
import { calculateStars, effectiveLevel, generateQuestions } from '../utils/gameLogic';
import { tr } from '../data/i18n';
export function QuizRace({lang,difficulty,stats,profile,onComplete}:{lang:Language;difficulty:Difficulty;stats:Stats;profile:ProfileId;onComplete:(r:GameResult)=>void}) {
 const { advancing, showFeedback } = useAnswerFeedback();
 const [questions]=useState(()=>generateQuestions(effectiveLevel(difficulty,stats),lang,10));const [step,setStep]=useState(0);const [correct,setCorrect]=useState(0);const [mine,setMine]=useState(0);const [friend,setFriend]=useState(0);const q=questions[step]; const joint=profile==='team';
 const speak=()=>window.speechSynthesis?.speak(new SpeechSynthesisUtterance(q.prompt));
 function choose(i: number) {
   if (advancing) return;
   if (i !== q.answer) {
     showFeedback(false, q.hint);
     return;
   }
   const boost = Math.random() > .77 ? 2 : 1;
   const next = step + 1;
   const score = correct + 1;
   showFeedback(true, boost === 2 ? '🌈 Turbo!' : undefined, () => {
     const rival = joint ? friend : Math.min(10, friend + (Math.random() > .35 ? 1 : 0));
     if (next === 10) onComplete({ game: 'race', score, correct: score, total: 10, stars: calculateStars(score, 10), races: 1, teamWin: joint || score >= 6 });
     else { setCorrect(score); setMine(Math.min(10, mine + boost)); setFriend(rival); setStep(next); }
   });
 }
 const player=joint?(step%2===0?'Nahia':'Eider'):(lang==='eu'?'Zu':'Tú');
 return <section className="game-shell race-game"><div className="game-top"><div><span className="eyebrow">🏁 {tr(lang,'raceName')}</span><h2>{lang==='eu'?'Helmuga dibertigarria':'Una meta divertida'}</h2></div><span className="counter">{step+1} / 10</span></div><p className="turn-pill">{tr(lang,'turn')}: <strong>{player}</strong></p><div className="track"><div className="lane"><span className="racer" style={{left:`${mine*9}%`}}>🛴</span>{Array.from({length:11},(_,i)=><i key={i}>{i===10?'🏁':i===4||i===8?'🌈':'·'}</i>)}</div><div className="lane rival"><span className="racer" style={{left:`${friend*9}%`}}>{joint?'🚲':'🦊'}</span>{Array.from({length:11},(_,i)=><i key={i}>·</i>)}</div></div><div className="question-card">{q.visual&&<p className="visual">{q.visual}</p>}<h3>{q.prompt}</h3><div className="answers">{q.options.map((o,i)=><button className="answer" disabled={advancing} key={`${o}${i}`} onClick={()=>choose(i)}>{o}</button>)}</div>{typeof window!=='undefined'&&'speechSynthesis'in window&&<button className="read-button" onClick={speak}>🔊 {tr(lang,'read')}</button>}</div></section>;
}
