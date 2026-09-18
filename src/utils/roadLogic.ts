import type { CircuitId, RoadCarId, RoadProgress } from '../types';
export interface CarConfig { id:RoadCarId;color:string;stripe:string;speed:number;control:number;magnet:number; }
export interface CircuitConfig { id:CircuitId; palette:[string,string,string]; obstacle:string; scenery:string[]; curve:number; }
export const cars:CarConfig[]=[{id:'red',color:'#ec5e68',stripe:'#fff3a5',speed:1,control:1,magnet:1},{id:'blue',color:'#4d9eec',stripe:'#eaf9ff',speed:.92,control:1.18,magnet:1.05},{id:'yellow',color:'#f4b93e',stripe:'#fff6c8',speed:1.11,control:.94,magnet:1.1},{id:'duo',color:'#a273d5',stripe:'#ffb7cf',speed:.98,control:1.08,magnet:1.08}];
export const circuits:CircuitConfig[]=[{id:'forest',palette:['#78c978','#356b54','#dff4b9'],obstacle:'🍃',scenery:['🌲','🌷','🪵'],curve:.17},{id:'cloud',palette:['#9cdafa','#7289d6','#f5e8a4'],obstacle:'💧',scenery:['☁️','🌈','✨'],curve:.12},{id:'moon',palette:['#8c82d1','#35395e','#b8a5eb'],obstacle:'🪨',scenery:['🌙','⭐','🪐'],curve:.22}];
export const initialRoadProgress=():RoadProgress=>({selectedCar:'red',selectedCircuit:'forest',circuitsPlayed:[],objectives:0,turbos:0,cleanStreak:0,circuitStats:{forest:{runs:0,stars:0,distance:0},cloud:{runs:0,stars:0,distance:0},moon:{runs:0,stars:0,distance:0}}});
export type Pickup='star'|'bigStar'|'turbo'|'shield'|'magnet';
export const roadReward=(stars:number,energy:number,clean:boolean,objectives:number)=>1+(stars>=6?1:0)+(energy>=50?1:0)+(clean?1:0)+(objectives>=2?1:0);
export const avoidableSpawn=(occupied:number[],candidate:number)=>!occupied.some(x=>Math.abs(x-candidate)<.26);
export const collisionEffect=(kind:Pickup|'obstacle',energy:number)=>kind==='obstacle'?{energy:Math.max(12,energy-14),stars:0}:{energy,stars:kind==='bigStar'?3:1};
