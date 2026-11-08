import type { DetectivePuzzle, Difficulty, Language, QuizQuestion, Stats } from '../types';
import { initialRoadProgress } from './roadLogic';

export const random = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
export const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - .5);
export const effectiveLevel = (difficulty: Difficulty, stats: Stats): 'seed' | 'star' => {
  if (difficulty !== 'auto') return difficulty;
  const recent = stats.recent.slice(-5);
  return recent.length >= 5 && recent.filter(Boolean).length >= 4 ? 'star' : 'seed';
};
export function answerChoices<T>(correct: T, wrong: T[]) {
  const distractors = shuffle([...new Set(wrong)].filter(option => option !== correct)).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  return { options, answer: options.indexOf(correct) };
}

export function numberChoices(correct: number) {
  const wrong = [-3, -2, -1, 1, 2, 3, 4].map(offset => correct + offset).filter(value => value >= 0);
  return answerChoices(correct, wrong);
}

const symbols = ['🐟', '🐢', '🐠', '🦀', '⭐', '🌙', '💎', '🍃'];
const facts = [
  { eu: 'Zein animaliak egiten du miau?', es: '¿Qué animal hace miau?', choices: [['Katua', 'El gato'], ['Txakurra', 'El perro'], ['Ahatea', 'El pato'], ['Behia', 'La vaca']] },
  { eu: 'Zein animaliak du oskola?', es: '¿Qué animal tiene caparazón?', choices: [['Dortokak', 'La tortuga'], ['Txoriak', 'El pájaro'], ['Zaldiak', 'El caballo'], ['Tximeletak', 'La mariposa']] },
  { eu: 'Zerekin entzuten dugu?', es: '¿Con qué escuchamos?', choices: [['Belarriekin', 'Con los oídos'], ['Begiekin', 'Con los ojos'], ['Sudurrarekin', 'Con la nariz'], ['Eskuekin', 'Con las manos']] },
  { eu: 'Zein animalia da ugaztuna?', es: '¿Qué animal es mamífero?', choices: [['Izurdea', 'El delfín'], ['Marrazoa', 'El tiburón'], ['Olagarroa', 'El pulpo'], ['Amuarraina', 'La trucha']] },
  { eu: 'Zer biltzen dute erleek loreetan eztia egiteko?', es: '¿Qué recogen las abejas de las flores para hacer miel?', choices: [['Nektarra', 'Néctar'], ['Harea', 'Arena'], ['Harriak', 'Piedras'], ['Hosto lehorrak', 'Hojas secas']] },
  { eu: 'Zein da planetetako bat?', es: '¿Cuál de estos es un planeta?', choices: [['Marte', 'Marte'], ['Ilargia', 'La Luna'], ['Eguzkia', 'El Sol'], ['Halley kometa', 'El cometa Halley']] },
];

function numberQuestion(prompt: string, answer: number, hint?: string, visual?: string): QuizQuestion {
  const { options, answer: index } = numberChoices(answer);
  return { prompt, options: options.map(String), answer: index, hint, visual };
}

export function generateQuestion(level: 'seed' | 'star', lang: Language): QuizQuestion {
  const eu = lang === 'eu';
  const n = Math.floor(Math.random() * (level === 'seed' ? 8 : 10));
  if (n < 4) {
    const max = level === 'seed' ? 10 : 50;
    const a = 1 + Math.floor(Math.random() * (max - 2));
    const b = 1 + Math.floor(Math.random() * Math.min(a, level === 'seed' ? 9 : 20));
    if (level === 'star' && n === 3) {
      const x = 2 + Math.floor(Math.random() * 9), y = 2 + Math.floor(Math.random() * 9);
      return numberQuestion(`${x} × ${y} = ?`, x * y, eu ? 'Biderkatzea batuketaren laburpena da.' : 'Multiplicar es sumar varias veces.');
    }
    const sum = n % 2 === 0;
    return numberQuestion(`${a} ${sum ? '+' : '−'} ${b} = ?`, sum ? a + b : a - b, eu ? 'Kontatu poliki-poliki.' : 'Cuenta despacito.');
  }
  if (n === 4) {
    const count = level === 'seed' ? 2 + Math.floor(Math.random() * 7) : 12 + Math.floor(Math.random() * 24);
    const animal = random(['🐞', '🐟', '🦋', '🐢']);
    return numberQuestion(eu ? `Zenbat ${animal} daude?` : `¿Cuántos ${animal} hay?`, count, undefined, animal.repeat(count));
  }
  if (n === 5) {
    const max = level === 'seed' ? 10 : 50;
    const values = shuffle(Array.from({ length: max }, (_, index) => index + 1)).slice(0, 4);
    const greatest = Math.max(...values);
    const smallest = Math.random() < .5;
    const correct = smallest ? Math.min(...values) : greatest;
    const prompt = smallest ? (eu ? 'Zein da txikiena?' : '¿Cuál es el menor?') : (eu ? 'Zein da handiena?' : '¿Cuál es el mayor?');
    const choices = answerChoices(correct, values);
    return { prompt, options: choices.options.map(String), answer: choices.answer };
  }
  if (n === 6) {
    const [a, b, c, d] = shuffle(symbols);
    const pattern = level === 'seed' ? random([[a, a, b], [a, b, b], [a, b, c]]) : random([[a, b, a, c], [a, b, c, b], [a, a, b, c]]);
    const line = [...pattern, ...pattern];
    const gap = 1 + Math.floor(Math.random() * (line.length - 2));
    const correct = line[gap];
    line[gap] = '❔';
    return { prompt: eu ? 'Zein ikur falta da?' : '¿Qué símbolo falta?', visual: line.join(' '), ...answerChoices(correct, [a, b, c, d]) };
  }
  if (n === 8) {
    const first = 1 + Math.floor(Math.random() * 12);
    const step = 2 + Math.floor(Math.random() * 8);
    const series = [first, first + step, '❔', first + 3 * step, first + 4 * step];
    return numberQuestion(eu ? 'Zein zenbaki falta da?' : '¿Qué número falta?', first + 2 * step, undefined, series.join(' · '));
  }
  const fact = random(level === 'seed' ? facts.slice(0, 3) : facts);
  const [correct, ...wrong] = fact.choices.map(option => option[eu ? 0 : 1]);
  return { prompt: fact[lang], ...answerChoices(correct, wrong) };
}

export function generateQuestions(level: 'seed' | 'star', lang: Language, count: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();
  for (let attempt = 0; questions.length < count && attempt < count * 6; attempt++) {
    const question = generateQuestion(level, lang);
    const key = JSON.stringify([question.prompt, question.visual]);
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(question);
  }
  while (questions.length < count) questions.push(generateQuestion(level, lang));
  return questions;
}

// Every completed activity earns a seed. Accuracy grows it into one or two stars;
// retries are part of learning and never subtract progress.
export const calculateStars = (correct: number, total: number) => 1 + (correct / total >= .6 ? 1 : 0) + (correct / total >= .9 ? 1 : 0);
export const blankStats = (): Stats => ({stars:0,played:0,animals:0,potions:0,races:0,gardens:0,cases:0,clues:0,maxClueStreak:0,noHelpCases:0,roadStars:0,roadDistance:0,roadRuns:0,obstaclesAvoided:0,cleanRoads:0,correct:0,attempts:0,maxPotionStreak:0,teamWins:0,lastPlayed:undefined,days:[],best:{animals:0,potions:0,race:0,museum:0,city:0,road:0,garden:0,words:0,math:0,english:0,shapes:0,stories:0,science:0,teamQuest:0,checkers:0,ticTacToe:0},recent:[],sessions:[],city:{placed:[],unlocked:[],missions:0,happiness:0,usedMissions:[]},road:initialRoadProgress()});
export const detectiveCases = {eu:['Koloreak galdu zituen koadroa','Dinosauroaren ondoko aztarna','Desagertutako koroa','Atzerantz zihoan erlojua','Zilarrezko txoriaren sekretua','Giltza morearen misterioa','Loreen gelako mapa','Izar galduaren bila','Estatuaren poltsikoa','Isilpeko musika-kutxa'],es:['El cuadro que perdió sus colores','La huella junto al dinosaurio','La corona desaparecida','El reloj que iba hacia atrás','El secreto del pájaro plateado','El misterio de la llave violeta','El mapa de la sala de flores','En busca de la estrella perdida','El bolsillo de la estatua','La caja de música secreta']};
const museumObjects = ['🗝️', '👑', '💎', '🦕', '⌛', '🪶', '🎨', '🔔', '🏺', '🪙'];
const keyColors = [
  { icon: '🟡', eu: 'Urrezko giltza', es: 'Llave dorada' },
  { icon: '🟣', eu: 'Giltza morea', es: 'Llave violeta' },
  { icon: '🔵', eu: 'Giltza urdina', es: 'Llave azul' },
  { icon: '🟢', eu: 'Giltza berdea', es: 'Llave verde' },
];
const keyLocations = [
  { icon: '🕰️', eu: 'erlojua', es: 'el reloj' },
  { icon: '📚', eu: 'liburuak', es: 'los libros' },
  { icon: '🏺', eu: 'pitxerra', es: 'la vasija' },
  { icon: '🪴', eu: 'landarea', es: 'la planta' },
];

export function generateDetectivePuzzle(level: 'seed' | 'star', lang: Language): DetectivePuzzle {
  const eu = lang === 'eu';
  const kind = random<DetectivePuzzle['kind']>(['memory', 'difference', 'order', 'deduction']);
  if (kind === 'memory') {
    const display = shuffle(museumObjects).slice(0, level === 'seed' ? 4 : 6);
    const correct = random(display);
    return { kind, display, ...answerChoices(correct, museumObjects.filter(item => !display.includes(item))),
      prompt: eu ? 'Zein objektu ikusi duzu erakusleihoan?' : '¿Qué objeto viste en la vitrina?',
      hint: eu ? 'Gogoratu erakusleihoan zeuden formak.' : 'Recuerda las formas que había en la vitrina.' };
  }
  if (kind === 'difference') {
    const [odd, ...pairs] = shuffle(museumObjects).slice(0, 4);
    const repeats = level === 'seed' ? 2 : 3;
    const display = shuffle([odd, ...pairs.flatMap(item => Array<string>(repeats).fill(item))]);
    return { kind, display, ...answerChoices(odd, pairs),
      prompt: eu ? 'Zein objektu agertzen da behin bakarrik?' : '¿Qué objeto aparece una sola vez?',
      hint: eu ? 'Zenbatu mota bakoitzeko objektuak.' : 'Cuenta los objetos de cada tipo.' };
  }
  if (kind === 'order') {
    const first = level === 'seed' ? 1 : 11;
    const count = level === 'seed' ? 4 : 5;
    const options = shuffle(Array.from({ length: level === 'seed' ? 12 : 60 }, (_, index) => String(first + index))).slice(0, count);
    if (options.every((value, index) => index === 0 || Number(value) > Number(options[index - 1]))) options.reverse();
    return { kind, options, answer: 0, display: [],
      prompt: eu ? 'Sakatu zenbakiak txikitik handira.' : 'Pulsa los números de menor a mayor.',
      hint: eu ? 'Hasi zenbakirik txikienarekin.' : 'Empieza por el número más pequeño.' };
  }
  const locations = shuffle(keyLocations);
  const index = Math.floor(Math.random() * keyColors.length);
  const target = locations[index];
  const others = locations.filter(location => location !== target).map(location => location[lang]).join(', ');
  const prompt = level === 'seed'
    ? (eu ? `Zein giltza dago ikur honen ondoan? ${target.icon}` : `¿Qué llave está junto a este dibujo? ${target.icon}`)
    : (eu ? `Baztertu objektu hauen ondoko giltzak: ${others}. Zein geratzen da?` : `Descarta las llaves junto a estos objetos: ${others}. ¿Cuál queda?`);
  return { kind, prompt, ...answerChoices(keyColors[index][lang], keyColors.map(color => color[lang])),
    display: keyColors.map((color, i) => `${color.icon} ${locations[i].icon}`),
    hint: eu ? 'Begiratu kolorea eta ondoko objektua.' : 'Mira cada color y el objeto que tiene al lado.' };
}
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
