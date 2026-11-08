import type { CircuitId, RoadCarId, RoadProgress } from '../types';
export interface CarConfig { id: RoadCarId; speed: number; control: number; magnet: number; }
export interface CircuitConfig { id: CircuitId; ground: string; curb: string; obstacle: string; }
export const cars: CarConfig[] = [
  { id: 'red', speed: 1, control: 1, magnet: 1 },
  { id: 'blue', speed: .92, control: 1.18, magnet: 1.05 },
  { id: 'yellow', speed: 1.11, control: .94, magnet: 1.1 },
  { id: 'duo', speed: .98, control: 1.08, magnet: 1.08 },
];
export const circuits: CircuitConfig[] = [
  { id: 'forest', ground: '#3d532d', curb: '#dff4b9', obstacle: '🍃' },
  { id: 'cloud', ground: '#545f9e', curb: '#f5e8a4', obstacle: '💧' },
  { id: 'moon', ground: '#3f3d62', curb: '#b8a5eb', obstacle: '🪨' },
];
export const initialRoadProgress=():RoadProgress=>({selectedCar:'red',selectedCircuit:'forest',circuitsPlayed:[],objectives:0,turbos:0,cleanStreak:0,circuitStats:{forest:{runs:0,stars:0,distance:0},cloud:{runs:0,stars:0,distance:0},moon:{runs:0,stars:0,distance:0}}});
export type Pickup='star'|'bigStar'|'turbo'|'shield'|'magnet';
export type RoadEntity = { x: number; y: number; kind: Pickup | 'obstacle'; hit?: boolean };
export const roadReward=(stars:number,energy:number,clean:boolean,objectives:number)=>1+(stars>=6?1:0)+(energy>=50?1:0)+(clean?1:0)+(objectives>=2?1:0);
export const avoidableSpawn=(occupied:number[],candidate:number)=>!occupied.some(x=>Math.abs(x-candidate)<.26);
export const collisionEffect=(kind:Pickup|'obstacle',energy:number)=>kind==='obstacle'?{energy:Math.max(12,energy-14),stars:0}:{energy,stars:kind==='bigStar'?3:1};
