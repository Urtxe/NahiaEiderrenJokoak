import type { DetectivePuzzle, Difficulty, GameId, Language, QuizQuestion, Stats } from '../types';
import { initialRoadProgress } from './roadLogic';

export const random = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
export const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - .5);
export const effectiveLevel = (difficulty: Difficulty, stats: Stats): 'seed' | 'star' => {
  if (difficulty !== 'auto') return difficulty;
  const recent = stats.recent.slice(-5);
  return recent.length >= 5 && recent.filter(Boolean).length >= 4 ? 'star' : 'seed';
};
const make = (prompt: string, answer: number | string, wrong: (number | string)[], hint?: string, visual?: string): QuizQuestion => {
  const pool = shuffle([String(answer), ...wrong.map(String)]).slice(0, 4);
  return { prompt, options: pool, answer: pool.indexOf(String(answer)), hint, visual };
};
export function generateQuestion(level: 'seed' | 'star', lang: Language, kind: GameId): QuizQuestion {
  const eu = lang === 'eu'; const n = Math.floor(Math.random() * (level === 'seed' ? 7 : 10));
  if (n < 4) {
    const max = level === 'seed' ? 10 : 50; const a = 1 + Math.floor(Math.random() * (max - 2)); const b = 1 + Math.floor(Math.random() * Math.min(a, level === 'seed' ? 9 : 20));
    if (level === 'star' && n === 3) { const factors = random([[2,2],[2,5],[5,5],[10,2],[5,10]]); const x=factors[0], y=factors[1]; return make(`${x} × ${y} = ?`,x*y,[x*y+2, x*y-2, x+y],eu?'Biderkatzea batuketaren laburpena da.':'Multiplicar es sumar varias veces.'); }
    const sum = n % 2 === 0; const ans=sum?a+b:a-b; return make(`${a} ${sum?'+':'−'} ${b} = ?`,ans,[ans+1,Math.max(0,ans-1),sum?a+b+2:ans+2],eu?'Kontatu poliki-poliki.':'Cuenta despacito.');
  }
  if (n === 4) { const count=level==='seed'?2+Math.floor(Math.random()*7):12+Math.floor(Math.random()*24); const animal=random(['🐞','🐟','🦋','🐢']); return make(eu?`Zenbat ${animal} daude?`:`¿Cuántos ${animal} hay?`,count,[count-1,count+1,count+2],undefined,animal.repeat(count)); }
  if (n === 5) { const values=level==='seed'?[2,5,8]:[12,24,37]; const ans=Math.max(...values); return make(eu?`Zein da handiena? ${values.join(', ')}`:`¿Cuál es el mayor? ${values.join(', ')}`,ans,values.filter(x=>x!==ans)); }
  if (n === 6) { const pattern=level==='seed'?['🐟','🐟','🐢']:['⭐','🌙','🌙','⭐','🌙','🌙']; const answer=level==='seed'?'🐟':'⭐'; return make(eu?`Zer dator gero? ${pattern.join(' ')}`:`¿Qué sigue? ${pattern.join(' ')}`,answer,level==='seed'?['🐢','🐠','🦀']:['🌙','💎','🍃']); }
  const facts: Array<[string, string, string[]]> = level==='seed' ? (eu ? [['Non bizi da arraina?','Uretan',['Zuhaitzean','Hodeietan']],['Zein koloretakoa da banana?','Horia',['Urdina','Morea']],['Zein animaliak egiten du miau?','Katua',['Txakurra','Ahatea']]] : [['¿Dónde vive el pez?','En el agua',['En un árbol','En las nubes']],['¿De qué color es el plátano?','Amarillo',['Azul','Morado']],['¿Qué animal hace miau?','El gato',['El perro','El pato']]]) : (eu ? [['Erleek zer egiten dute loreetan?','Nektarra bildu',['Lo egin','Igeri egin']],['Zein animalia da ugaztuna?','Izurdea',['Marrazoa','Olagarroa']],['Zein zenbaki dator? 10, 20, 30, ...','40',['25','50']]] : [['¿Qué hacen las abejas en las flores?','Recogen néctar',['Duermen','Nadan']],['¿Qué animal es mamífero?','El delfín',['El tiburón','El pulpo']],['¿Qué número sigue? 10, 20, 30, ...','40',['25','50']]]);
  const fact=random(facts); return make(fact[0],fact[1],fact[2]);
}
// Every completed activity earns a seed. Accuracy grows it into one or two stars;
// retries are part of learning and never subtract progress.
export const calculateStars = (correct: number, total: number) => 1 + (correct / total >= .6 ? 1 : 0) + (correct / total >= .9 ? 1 : 0);
export const blankStats = (): Stats => ({stars:0,played:0,animals:0,potions:0,races:0,gardens:0,cases:0,clues:0,maxClueStreak:0,noHelpCases:0,roadStars:0,roadDistance:0,roadRuns:0,obstaclesAvoided:0,cleanRoads:0,correct:0,attempts:0,maxPotionStreak:0,teamWins:0,lastPlayed:undefined,days:[],best:{animals:0,potions:0,race:0,museum:0,city:0,road:0,garden:0},recent:[],sessions:[],city:{placed:[],unlocked:[],missions:0,happiness:0},road:initialRoadProgress()});
export const detectiveCases = {eu:['Koloreak galdu zituen koadroa','Dinosauroaren ondoko aztarna','Desagertutako koroa','Atzerantz zihoan erlojua','Zilarrezko txoriaren sekretua','Giltza morearen misterioa','Loreen gelako mapa','Izar galduaren bila','Estatuaren poltsikoa','Isilpeko musika-kutxa'],es:['El cuadro que perdió sus colores','La huella junto al dinosaurio','La corona desaparecida','El reloj que iba hacia atrás','El secreto del pájaro plateado','El misterio de la llave violeta','El mapa de la sala de flores','En busca de la estrella perdida','El bolsillo de la estatua','La caja de música secreta']};
export function generateDetectivePuzzle(level:'seed'|'star',lang:Language):DetectivePuzzle { const eu=lang==='eu'; const kind=random<DetectivePuzzle['kind']>(['memory','difference','order','deduction']);
 if(kind==='memory'){const all=['🗝️','👑','💎','🦕','⌛','🪶','🎨','🔔'];const display=shuffle(all).slice(0,level==='seed'?4:6);const answer=random(display);const options=shuffle([answer,...shuffle(all.filter(x=>!display.includes(x))).slice(0,3)]);return {kind,prompt:eu?'Zein objektu ikusi duzu erakusleihoan?':'¿Qué objeto viste en la vitrina?',options,answer:options.indexOf(answer),display,hint:eu?'Begiratu objektuen formari.':'Fíjate en la forma de los objetos.'};}
 if(kind==='difference'){const base=shuffle(['💎','💎','💎','💎','💎','💎']).slice(0,level==='seed'?4:6);const odd=random(['⭐','🔔','🗝️']);const display=[...base,odd];const options=shuffle([...new Set(display)]);return {kind,prompt:eu?'Zein objektu da desberdina?':'¿Qué objeto es diferente?',options,answer:options.indexOf(odd),display:shuffle(display),hint:eu?'Batek ez du bikoterik.':'Uno no tiene pareja.'};}
 if(kind==='order'){const nums=level==='seed'?[1,2,3]:[2,4,6,8];const display=shuffle(nums.map(String));return {kind,prompt:eu?'Sakatu zenbakiak txikitik handira.':'Pulsa los números de menor a mayor.',options:nums.map(String),answer:0,display,hint:eu?'Hasi zenbakirik txikienarekin.':'Empieza por el número más pequeño.'};}
 const options=eu?['Urrezko giltza','Morezko giltza','Zilarrezko giltza']:['Llave dorada','Llave violeta','Llave plateada'];return {kind,prompt:eu?'Pista: giltza ez da urrezkoa eta erlojuaren ondoan dago. Zein giltza da?':'Pista: la llave no es dorada y está junto al reloj. ¿Qué llave es?',options,answer:1,display:['🕰️','🔑','🕵️'],hint:eu?'Baztertu urrezko giltza.':'Descarta la llave dorada.'}; }
export const validateSequence = (chosen:string[], expected:string[]) => chosen.every((item,index)=>item===expected[index]);
export interface RoadTick { stars:number; energy:number; distance:number; obstacles:number; }
export const roadTick=(state:RoadTick,event:'star'|'obstacle'|'empty',hit:boolean):RoadTick=>({stars:state.stars+(event==='star'&&hit?1:0),energy:Math.max(0,state.energy-(event==='obstacle'&&hit?16:0)),distance:state.distance+(event==='empty'?1:0),obstacles:state.obstacles+(event==='obstacle'&&!hit?1:0)});
export const roadDuration=(level:'seed'|'star')=>level==='seed'?60:90;
export const achievementList = (stats: Stats, team: Stats, lang: Language) => {
 const eu=lang==='eu'; const total=stats.stars+team.stars;
 return [
  {icon:'⭐',name:eu?'Lehen Izarra':'Primera estrella',done:total>=1,current:total,target:1,desc:eu?'Lortu lehen izarra.':'Consigue tu primera estrella.'},
  {icon:'🦊',name:eu?'Animalien Laguna':'Amiga de los animales',done:stats.animals+team.animals>=10,current:stats.animals+team.animals,target:10,desc:eu?'Erreskatatu 10 animalia.':'Rescata 10 animales.'},
  {icon:'🧪',name:eu?'Edabe Maisua':'Maestra de pociones',done:stats.potions+team.potions>=10,current:stats.potions+team.potions,target:10,desc:eu?'Sortu 10 edabe.':'Crea 10 pociones.'},
  {icon:'🏁',name:eu?'Lasterkari Alaia':'Corredora alegre',done:stats.races+team.races>=5,current:stats.races+team.races,target:5,desc:eu?'Amaitu 5 lasterketa.':'Termina 5 carreras.'},
  {icon:'🤝',name:eu?'Elkarrekin Hobe':'Mejor juntas',done:team.played>=3,current:team.played,target:3,desc:eu?'Jolastu elkarrekin 3 aldiz.':'Jugad juntas 3 veces.'},
  {icon:'📅',name:eu?'Asteko Abenturazalea':'Aventurera de la semana',done:stats.days.length>=7,current:stats.days.length,target:7,desc:eu?'Jolastu 7 egun desberdinetan.':'Juega 7 días distintos.'},
  {icon:'🎮',name:eu?'10 Partida':'10 partidas',done:stats.played+team.played>=10,current:stats.played+team.played,target:10,desc:eu?'Amaitu 10 partida.':'Termina 10 partidas.'},
  {icon:'🌟',name:eu?'50 Izar':'50 estrellas',done:total>=50,current:total,target:50,desc:eu?'Bildu 50 izar.':'Reúne 50 estrellas.'}
  ,{icon:'🕵️',name:eu?'Museoko Detektibea':'Detective del museo',done:stats.cases+team.cases>=3,current:stats.cases+team.cases,target:3,desc:eu?'Ebatzi 3 kasu.':'Resuelve 3 casos.'}
  ,{icon:'🔎',name:eu?'Pista Maisua':'Maestra de las pistas',done:stats.clues+team.clues>=15,current:stats.clues+team.clues,target:15,desc:eu?'Bildu 15 pista.':'Resuelve 15 pistas.'}
  ,{icon:'👀',name:eu?'Begirada Azkarra':'Mirada rápida',done:stats.noHelpCases>=1,current:stats.noHelpCases,target:1,desc:eu?'Amaitu kasu bat laguntzarik gabe.':'Termina un caso sin ayuda.'}
  ,{icon:'🏗️',name:eu?'Hiri Eraikitzailea':'Constructora de ciudad',done:stats.city.placed.length>=5,current:stats.city.placed.length,target:5,desc:eu?'Kokatu 5 elementu.':'Coloca 5 elementos.'}
  ,{icon:'🌳',name:eu?'Parkearen Laguna':'Amiga del parque',done:['park','tree','flower'].every(id=>stats.city.placed.some(p=>p.id===id)),current:['park','tree','flower'].filter(id=>stats.city.placed.some(p=>p.id===id)).length,target:3,desc:eu?'Kokatu parkea, zuhaitza eta lorea.':'Coloca parque, árbol y flor.'}
  ,{icon:'🏙️',name:eu?'Hiri Magikoa':'Ciudad mágica',done:stats.city.placed.length>=12,current:stats.city.placed.length,target:12,desc:eu?'Bete 12 lursail.':'Ocupa 12 parcelas.'}
  ,{icon:'🤝',name:eu?'Elkarrekin Eraikia':'Construido juntas',done:team.city.placed.length>=4,current:team.city.placed.length,target:4,desc:eu?'Osatu auzo bat elkarrekin.':'Completa un barrio juntas.'}
  ,{icon:'⭐',name:eu?'Izar Bilatzailea':'Buscadora de estrellas',done:stats.roadStars+team.roadStars>=20,current:stats.roadStars+team.roadStars,target:20,desc:eu?'Bildu 20 izar errepidean.':'Recoge 20 estrellas en la carretera.'}
  ,{icon:'🚗',name:eu?'Gidari Alaia':'Conductora alegre',done:stats.roadRuns+team.roadRuns>=5,current:stats.roadRuns+team.roadRuns,target:5,desc:eu?'Amaitu 5 ibilbide.':'Termina 5 recorridos.'}
  ,{icon:'✨',name:eu?'Bide Garbia':'Camino limpio',done:stats.cleanRoads+team.cleanRoads>=1,current:stats.cleanRoads+team.cleanRoads,target:1,desc:eu?'Amaitu ukitu gabe.':'Termina sin tocar obstáculos.'}
  ,{icon:'🧑‍🤝‍🧑',name:eu?'Kopilotu Onena':'Mejor copiloto',done:team.roadRuns>=3,current:team.roadRuns,target:3,desc:eu?'Amaitu 3 ibilbide elkarrekin.':'Completa 3 partidas juntas.'}
  ,{icon:'🏟️',name:eu?'Zirkuituko Izarra':'Estrella del circuito',done:stats.road.circuitsPlayed.length>=3,current:stats.road.circuitsPlayed.length,target:3,desc:eu?'Jolastu hiru zirkuituetan.':'Juega en los tres circuitos.'}
  ,{icon:'🧼',name:eu?'Gidari Garbia':'Conductora limpia',done:stats.cleanRoads>=1,current:stats.cleanRoads,target:1,desc:eu?'Amaitu lasterketa bat ukitu gabe.':'Termina una carrera sin tocar obstáculos.'}
  ,{icon:'🌈',name:eu?'Turbo Ostadarra':'Turbo arcoíris',done:stats.road.turbos>=3,current:stats.road.turbos,target:3,desc:eu?'Bildu 3 turbo.':'Consigue 3 turbos.'}
  ,{icon:'🛣️',name:eu?'Hiru Pista':'Tres pistas',done:stats.road.circuitsPlayed.length>=3,current:stats.road.circuitsPlayed.length,target:3,desc:eu?'Ezagutu hiru zirkuituak.':'Descubre los tres circuitos.'}
  ,{icon:'🏎️',name:eu?'Bikote Lasterkaria':'Equipo corredor',done:team.roadRuns>=5,current:team.roadRuns,target:5,desc:eu?'Amaitu 5 partida elkarrekin.':'Completa 5 partidas juntas.'}
 ];
};
