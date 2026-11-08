import { cityItems, type CityItem } from '../data/content';
import type { Language } from '../types';
import { answerChoices, numberChoices, random, shuffle } from './gameLogic';

type Level = 'seed' | 'star';
type Family = 'buildings' | 'numbers' | 'patterns' | 'logic';
type Question = { prompt: string; options: string[]; answer: number; rewardId?: string };
type Template = { id: string; family: Family; question: (lang: Language, level: Level) => Question };
export type CityMission = Question & { reward: CityItem };

const text = (lang: Language, eu: string, es: string) => lang === 'eu' ? eu : es;
const between = (low: number, high: number) => low + Math.floor(Math.random() * (high - low + 1));

function numeric(prompt: string, correct: number): Question {
  const { options, answer } = numberChoices(correct);
  return { prompt, options: options.map(String), answer };
}

const buildings = [
  { id: 'park', eu: 'Non jar ditzakegu kulunkak eta txirristak?', es: '¿Dónde podemos poner columpios y toboganes?' },
  { id: 'library', eu: 'Non har ditzakegu liburuak maileguan?', es: '¿Dónde podemos tomar libros prestados?' },
  { id: 'hospital', eu: 'Zein eraikinetan zaintzen dituzte gaixoak?', es: '¿En qué edificio atienden a las personas enfermas?' },
  { id: 'school', eu: 'Non dituzte haurrek gelak eta jolastokia?', es: '¿Dónde tienen los niños clases y recreo?' },
  { id: 'bridge', eu: 'Zer erabil dezakegu ibaiaren beste aldera oinez joateko?', es: '¿Qué nos permite cruzar el río a pie?' },
  { id: 'lamp', eu: 'Zerk argiztatzen du kalea gauez?', es: '¿Qué ilumina la calle de noche?' },
  { id: 'lake', eu: 'Non ibil daitezke ahateak igerian?', es: '¿Dónde pueden nadar los patos?' },
  { id: 'garden', eu: 'Non landa ditzakegu azenarioak eta letxugak?', es: '¿Dónde podemos cultivar zanahorias y lechugas?' },
];

const bank: Template[] = [
  ...buildings.map(({ id, eu, es }): Template => ({
    id,
    family: 'buildings',
    question: lang => {
      const candidates = cityItems.filter(item => buildings.some(building => building.id === item.id));
      const correct = candidates.find(item => item.id === id)!;
      const { options, answer } = answerChoices(correct, candidates);
      return { prompt: text(lang, eu, es), options: options.map(item => item.name[lang]), answer, rewardId: id };
    },
  })),
  { id: 'flowers', family: 'numbers', question: (lang, level) => {
    const planted = between(3, level === 'seed' ? 9 : 29);
    const missing = between(2, level === 'seed' ? 7 : 14);
    return numeric(text(lang, `Parkean ${planted + missing} lore behar dira. Dagoeneko ${planted} landatu ditugu. Zenbat falta dira?`, `En el parque hacen falta ${planted + missing} flores. Ya hemos plantado ${planted}. ¿Cuántas faltan?`), missing);
  } },
  { id: 'lamps', family: 'numbers', question: (lang, level) => {
    const first = between(2, level === 'seed' ? 8 : 25);
    const second = between(3, level === 'seed' ? 9 : 23);
    return numeric(text(lang, `Kale batean ${first} farola daude eta bestean ${second}. Zenbat daude guztira?`, `En una calle hay ${first} farolas y en otra ${second}. ¿Cuántas hay en total?`), first + second);
  } },
  { id: 'seats', family: 'numbers', question: (lang, level) => {
    const benches = between(2, level === 'seed' ? 4 : 7);
    const seats = between(2, level === 'seed' ? 4 : 6);
    return numeric(text(lang, `Plazan ${benches} banku daude. Banku bakoitzean ${seats} lagun eseri daitezke. Zenbat lagun eser daitezke guztira?`, `En la plaza hay ${benches} bancos. En cada banco caben ${seats} personas. ¿Cuántas pueden sentarse en total?`), benches * seats);
  } },
  { id: 'seedlings', family: 'numbers', question: (lang, level) => {
    const plots = between(2, level === 'seed' ? 3 : 6);
    const plants = between(2, level === 'seed' ? 4 : 8);
    return numeric(text(lang, `${plots * plants} landare banatuko ditugu ${plots} lursailetan, guztietan kopuru bera jarriz. Zenbat jarriko ditugu lursail bakoitzean?`, `Repartimos ${plots * plants} plantas entre ${plots} parcelas por igual. ¿Cuántas ponemos en cada parcela?`), plants);
  } },
  { id: 'opening', family: 'numbers', question: (lang, level) => {
    const hour = between(8, 11);
    const duration = between(1, level === 'seed' ? 2 : 4);
    return numeric(text(lang, `Liburutegia ${hour}:00etan irekitzen da eta ${duration} orduz dago zabalik. Zein ordutan ixten da?`, `La biblioteca abre a las ${hour}:00 y permanece abierta ${duration} horas. ¿A qué hora cierra?`), hour + duration);
  } },
  { id: 'decoration', family: 'patterns', question: (lang, level) => {
    const [a, b, c, d] = shuffle(['🌳', '💡', '🌷', '⛲', '🏡', '🪴']);
    const repeat = level === 'seed' ? [a, a, b] : [a, b, a, c];
    const sequence = [...repeat, ...repeat];
    const gap = between(1, sequence.length - 2);
    const correct = sequence[gap];
    sequence[gap] = '❔';
    return { prompt: text(lang, `Zein apaingarri falta da? ${sequence.join(' ')}`, `¿Qué adorno falta? ${sequence.join(' ')}`), ...answerChoices(correct, [a, b, c, d]) };
  } },
  { id: 'addresses', family: 'patterns', question: (lang, level) => {
    const first = between(1, 9);
    const step = between(2, level === 'seed' ? 3 : 8);
    const series = `${first}, ${first + step}, ❔, ${first + step * 3}, ${first + step * 4}`;
    return numeric(text(lang, `Etxeek eredu bera jarraitzen dute. Zein zenbaki falta da? ${series}`, `Los números de las casas siguen un patrón. ¿Cuál falta? ${series}`), first + step * 2);
  } },
  { id: 'districts', family: 'logic', question: (lang, level) => {
    const smallest = level === 'seed' || Math.random() < .5;
    const start = between(2, level === 'seed' ? 6 : 23);
    const values = shuffle([start, start + 1, start + 3, start + 6]);
    const labels = ['A', 'B', 'C', 'D'];
    const count = values.map((value, index) => `${labels[index]}: ${value}`).join(' · ');
    const prompt = smallest
      ? text(lang, `Zein auzotan daude zuhaitz gutxien? ${count}`, `¿Qué barrio tiene menos árboles? ${count}`)
      : text(lang, `Zein auzotan daude zuhaitz gehien? ${count}`, `¿Qué barrio tiene más árboles? ${count}`);
    return { prompt, ...answerChoices(labels[values.indexOf(smallest ? Math.min(...values) : Math.max(...values))], labels) };
  } },
  { id: 'route', family: 'logic', question: (lang, level) => {
    const [first, middle, last, unused] = shuffle(['library', 'park', 'school', 'bridge', 'hospital', 'lake'])
      .slice(0, 4).map(id => cityItems.find(item => item.id === id)!.name[lang]);
    const prompt = level === 'seed'
      ? text(lang, `Ibilbidea: ${first} → ${middle} → ${last}. Zein leku bisitatuko dugu bigarren?`, `Ruta: ${first} → ${middle} → ${last}. ¿Qué lugar visitaremos en segundo lugar?`)
      : text(lang, `Lehen geldialdia ${first} da, eta azkena ${last}. Beste geldialdia ${middle} da. Zein dago erdian?`, `La primera parada es ${first}, y la última es ${last}. También paramos en ${middle}. ¿Qué parada va en medio?`);
    return { prompt, ...answerChoices(middle, [first, last, unused]) };
  } },
  { id: 'signs', family: 'logic', question: lang => {
    const [shape, correct] = random([
      ['🔺', 3], ['🟦', 4], ['🛑', 8],
    ] as const);
    return numeric(text(lang, `Zenbat alde ditu seinale honen formak? ${shape}`, `¿Cuántos lados tiene la forma de esta señal? ${shape}`), correct);
  } },
];

export function normalizeCityMissions(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && bank.some(template => template.id === id)))].slice(0, bank.length)
    : [];
}

export function drawCityMission(lang: Language, level: Level, owned: string[], usedMissions: string[]) {
  const previous = bank.find(template => template.id === usedMissions[usedMissions.length - 1]);
  const remaining = bank.filter(template => !usedMissions.includes(template.id));
  const cycle = remaining.length ? remaining : bank;
  const varied = cycle.filter(template => template.family !== previous?.family);
  const template = random(varied.length ? varied : cycle);
  const question = template.question(lang, level);
  const available = cityItems.filter(item => !owned.includes(item.id));
  const reward = cityItems.find(item => item.id === question.rewardId) ?? random(available.length ? available : cityItems);
  return {
    mission: { ...question, reward } satisfies CityMission,
    usedMissions: [...(remaining.length ? usedMissions : []), template.id],
  };
}
