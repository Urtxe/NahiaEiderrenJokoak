import { describe, expect, it, vi } from 'vitest';
import { achievementList, blankStats, generateDetectivePuzzle, roadDuration, roadTick, validateSequence } from './gameLogic';
import { normalizeSavedState } from '../hooks/useProgress';
import { avoidableSpawn, cars, circuits, collisionEffect, initialRoadProgress, roadReward } from './roadLogic';
describe('new game logic',()=>{
 it('generates four distinct choices and a unique solution for detective clues', () => {
   const rng = vi.spyOn(Math, 'random').mockReturnValue(.5);
   try {
     for (const level of ['seed', 'star'] as const) {
       for (const roll of [.1, .3, .6, .9]) {
         rng.mockReturnValueOnce(roll);
         const clue = generateDetectivePuzzle(level, 'es');
         if (clue.kind === 'order') {
           expect(clue.options).toHaveLength(level === 'seed' ? 4 : 5);
           expect(clue.options).not.toEqual([...clue.options].sort((a, b) => Number(a) - Number(b)));
           continue;
         }
         expect(clue.options).toHaveLength(4);
         expect(new Set(clue.options).size).toBe(4);
         const answer = clue.options[clue.answer];
         expect(answer).toBeTruthy();
         if (clue.kind !== 'deduction') expect(clue.display.filter(item => item === answer)).toHaveLength(1);
       }
     }
   } finally {
     rng.mockRestore();
   }
 });
 it('validates ordered clues',()=>{expect(validateSequence(['1','2'],['1','2','3'])).toBe(true);expect(validateSequence(['2'],['1','2'])).toBe(false);});
 it('calculates road score, collision and difficulty duration',()=>{const clean=roadTick({stars:0,energy:100,distance:0,obstacles:0},'star',true);expect(clean.stars).toBe(1);const bump=roadTick(clean,'obstacle',true);expect(bump.energy).toBe(84);expect(roadDuration('seed')).toBe(60);expect(roadDuration('star')).toBe(90);});
 it('unlocks city milestones and profile-specific medals',()=>{const nahia=blankStats();nahia.city.placed=[{id:'park',x:0,y:0},{id:'tree',x:1,y:0},{id:'flower',x:2,y:0},{id:'house',x:3,y:0},{id:'library',x:0,y:1}];const medals=achievementList(nahia,blankStats(),'es');expect(medals.find(m=>m.name==='Constructora de ciudad')?.done).toBe(true);expect(medals.find(m=>m.name==='Amiga del parque')?.done).toBe(true);});
 it('migrates v1 progress without losing existing stars or games',()=>{const migrated=normalizeSavedState({version:1,settings:{language:'es'},profiles:{nahia:{stars:17,played:4,animals:8,best:{animals:3}},eider:{stars:2},team:{stars:6}}});expect(migrated.version).toBe(4);expect(migrated.profiles.nahia.stars).toBe(17);expect(migrated.profiles.nahia.animals).toBe(8);expect(migrated.profiles.nahia.sessions).toEqual([]);expect(migrated.profiles.nahia.city.placed).toEqual([]);expect(migrated.profiles.nahia.road.selectedCar).toBe('red');expect(migrated.profiles.team.stars).toBe(6);});
 it('configures fair cars, circuits and collectible effects',()=>{expect(cars).toHaveLength(4);expect(circuits).toHaveLength(3);expect(avoidableSpawn([0,.45],-.6)).toBe(true);expect(avoidableSpawn([0],.1)).toBe(false);expect(collisionEffect('obstacle',20).energy).toBe(12);expect(collisionEffect('bigStar',100).stars).toBe(3);expect(roadReward(12,80,true,2)).toBeGreaterThan(3);expect(initialRoadProgress().circuitStats.moon.runs).toBe(0);});
});
