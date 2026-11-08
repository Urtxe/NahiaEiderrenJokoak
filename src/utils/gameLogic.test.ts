import { afterEach, describe, expect, it, vi } from 'vitest';
import { blankStats, calculateStars, effectiveLevel, generateQuestion, numberChoices } from './gameLogic';

afterEach(() => vi.restoreAllMocks());

describe('game logic',()=>{
 it.each([['seed', 8], ['star', 10]] as const)('gives every %s question four distinct options', (level, types) => {
   const rng = vi.spyOn(Math, 'random').mockReturnValue(.5);
   for (const lang of ['eu', 'es'] as const) {
     for (let type = 0; type < types; type++) {
       rng.mockReturnValueOnce((type + .5) / types);
       const question = generateQuestion(level, lang);
       expect(question.options).toHaveLength(4);
       expect(new Set(question.options).size).toBe(4);
       expect(question.options[question.answer]).toBeTruthy();
     }
   }
 });
 it('offers zero once with three nonnegative distractors', () => {
   const { options, answer } = numberChoices(0);
   expect(options[answer]).toBe(0);
   expect(new Set(options).size).toBe(4);
   expect(options.every(option => option >= 0)).toBe(true);
 });
 it('awards participation and accuracy stars',()=>{expect(calculateStars(0,8)).toBe(1);expect(calculateStars(8,8)).toBe(3);});
 it('changes automatic level after a strong recent run',()=>{const stats=blankStats();stats.recent=[true,true,true,true,false];expect(effectiveLevel('auto',stats)).toBe('star');});
});
