import { afterEach, describe, expect, it, vi } from 'vitest';
import { blankStats, calculateStars, effectiveLevel, generateDetectiveCase, generateQuestion, generateQuestions, numberChoices, pickExercises, quizQuestionId } from './gameLogic';

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
 it('uses fresh exercises first and brings back the least recent when needed', () => {
   vi.spyOn(Math, 'random').mockReturnValue(.5);
   const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
   const first = pickExercises(pool, 3, [], item => item);
   const second = pickExercises(pool, 3, first, item => item);
   expect(new Set([...first, ...second]).size).toBe(6);
   const third = pickExercises(pool, 3, [...first, ...second], item => item);
   expect(third).toEqual(expect.arrayContaining(first.slice(0, 2)));
   expect(third.some(item => ![...first, ...second].includes(item))).toBe(true);
 });
 it.each(['seed', 'star'] as const)('uses different quiz questions in a consecutive %s round', level => {
   let seed = 31;
   vi.spyOn(Math, 'random').mockImplementation(() => {
     seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
     return seed / 2 ** 32;
   });
   const first = generateQuestions(level, 'eu', 8).map(quizQuestionId);
   const second = generateQuestions(level, 'eu', 10, first).map(quizQuestionId);
   expect(new Set([...first, ...second]).size).toBe(18);
 });
 it('includes all four clue types in a detective case', () => {
   const clues = generateDetectiveCase('seed', 'es');
   expect(clues).toHaveLength(5);
   expect(new Set(clues.map(clue => clue.kind)).size).toBe(4);
 });
 it('awards participation and accuracy stars',()=>{expect(calculateStars(0,8)).toBe(1);expect(calculateStars(8,8)).toBe(3);});
 it('changes automatic level after a strong recent run',()=>{const stats=blankStats();stats.recent=[true,true,true,true,false];expect(effectiveLevel('auto',stats)).toBe('star');});
});
