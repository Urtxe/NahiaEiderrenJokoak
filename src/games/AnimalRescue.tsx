import { useMemo, useState } from 'react';
import { useAnswerFeedback } from './AnswerFeedback';
import type { Difficulty, GameResult, Language, Stats } from '../types';
import { calculateStars, effectiveLevel, generateQuestions } from '../utils/gameLogic';
import { tr } from '../data/i18n';

export function AnimalRescue({lang,difficulty,stats,onComplete}:{lang:Language;difficulty:Difficulty;stats:Stats;onComplete:(r:GameResult)=>void}) {
 const { advancing, showFeedback } = useAnswerFeedback();
 const [questions]=useState(()=>generateQuestions(effectiveLevel(difficulty,stats),lang,8));
 const [step,setStep]=useState(0); const [wrong,setWrong]=useState(false); const [correct,setCorrect]=useState(0);
 const q=questions[step]; const rescued=useMemo(()=>['🦊','🐢','🦉','🐬','🦋','🦔','🐼','🦜'].slice(0,step),[step]);
 function choose(i: number) {
   if (advancing) return;
   if (i !== q.answer) {
     setWrong(true);
     showFeedback(false, q.hint);
     return;
   }
   const next = step + 1;
   const score = correct + (wrong ? 0 : 1);
   showFeedback(true, undefined, () => {
     if (next === 8) onComplete({ game: 'animals', score, correct: score, total: 8, stars: calculateStars(score, 8), animals: 8 });
     else { setCorrect(score); setStep(next); setWrong(false); }
   });
 }
 return <section className="game-shell animal-game"><div className="game-top"><div><span className="eyebrow">🐾 {tr(lang,'animalName')}</span><h2>{lang==='eu'?'Lagundu animaliei etxera itzultzen':'Ayuda a los animales a volver a casa'}</h2></div><span className="counter">{step+1} / 8</span></div><div className="habitat" aria-label={tr(lang,'rescued')}>{rescued.map((a,i)=><span className="rescued" key={`${a}-${i}`}>{a}</span>)}{Array.from({length:Math.max(0,5-rescued.length)}).map((_,i)=><span className="empty-animal" key={i}>✦</span>)}</div><div className="question-card"><p className="visual">{q.visual}</p><h3>{q.prompt}</h3><div className="answers">{q.options.map((option,i)=><button key={`${option}-${i}`} className="answer" disabled={advancing} onClick={()=>choose(i)}>{option}</button>)}</div></div><p className="game-note">{lang==='eu'?'Ez dago presarik — egin zure erritmoan.':'No hay prisa — hazlo a tu ritmo.'}</p></section>;
}
