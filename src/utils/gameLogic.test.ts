import { describe, expect, it } from 'vitest';
import { blankStats, calculateStars, effectiveLevel, generateQuestion } from './gameLogic';
describe('game logic',()=>{
 it('creates answerable questions',()=>{for(let i=0;i<20;i++){const q=generateQuestion('seed','eu','animals');expect(q.options[q.answer]).toBeTruthy();expect(q.options.length).toBeGreaterThan(1);}});
 it('awards participation and accuracy stars',()=>{expect(calculateStars(0,8)).toBe(1);expect(calculateStars(8,8)).toBe(3);});
 it('changes automatic level after a strong recent run',()=>{const stats=blankStats();stats.recent=[true,true,true,true,false];expect(effectiveLevel('auto',stats)).toBe('star');});
});
