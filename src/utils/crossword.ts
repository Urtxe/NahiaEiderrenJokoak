import type { Language, SchoolLevel } from '../types';
import { pickExercises, shuffle } from './gameLogic';

export type CrosswordEntry = { answer: string; clue: string };
export type CrosswordCell = { letter: string; entries: number[] };
export type CrosswordBoard = { cells: (CrosswordCell | null)[][]; entries: Array<CrosswordEntry & { row: number; column: number; direction: 'across' | 'down' }> };

type Pair = { eu: CrosswordEntry; es: CrosswordEntry };
const pairs: Record<SchoolLevel, Pair[]> = {
    lh1: [
      { eu: { answer: 'KATU', clue: 'Etxeko animalia, miau egiten duena.' }, es: { answer: 'GATO', clue: 'Animal de casa que maúlla.' } },
      { eu: { answer: 'SAGAR', clue: 'Zuhaitzean hazten den fruta.' }, es: { answer: 'PERA', clue: 'Fruta verde o amarilla, más ancha por abajo.' } },
      { eu: { answer: 'ETXE', clue: 'Familiarekin bizi garen lekua.' }, es: { answer: 'CASA', clue: 'Lugar donde vive una familia.' } },
      { eu: { answer: 'LUMA', clue: 'Hegaztiek gorputzean dutena.' }, es: { answer: 'ALA', clue: 'Parte con la que vuela un ave.' } },
      { eu: { answer: 'ILARGI', clue: 'Gauez zeruan ikusten dugun astroa.' }, es: { answer: 'LUNA', clue: 'Astro que vemos en el cielo de noche.' } },
      { eu: { answer: 'LORE', clue: 'Koloretsua izan daitekeen landarea.' }, es: { answer: 'FLOR', clue: 'Parte colorida de una planta.' } },
      { eu: { answer: 'BOLA', clue: 'Jolasteko objektu biribila.' }, es: { answer: 'PELOTA', clue: 'Objeto redondo para jugar.' } },
      { eu: { answer: 'URA', clue: 'Edaten dugun likidoa.' }, es: { answer: 'AGUA', clue: 'Líquido que bebemos.' } },
      { eu: { answer: 'BASO', clue: 'Zuhaitz asko dauden lekua.' }, es: { answer: 'BOSQUE', clue: 'Lugar con muchos árboles.' } },
      { eu: { answer: 'EGUZKI', clue: 'Egunez argia eta beroa ematen digu.' }, es: { answer: 'SOL', clue: 'Nos da luz y calor durante el día.' } },
      { eu: { answer: 'ATE', clue: 'Gelara sartzeko irekitzen dugu.' }, es: { answer: 'PUERTA', clue: 'Se abre para entrar en una habitación.' } },
      { eu: { answer: 'TXAKUR', clue: 'Zaunka egiten duen animalia.' }, es: { answer: 'PERRO', clue: 'Animal que ladra.' } },
      { eu: { answer: 'AHATE', clue: 'Urmaelean igeri egiten duen hegaztia.' }, es: { answer: 'PATO', clue: 'Ave que nada en los estanques y hace cuac.' } },
      { eu: { answer: 'GILTZA', clue: 'Sarraila irekitzeko balio du.' }, es: { answer: 'LLAVE', clue: 'Sirve para abrir una cerradura.' } },
      { eu: { answer: 'ELUR', clue: 'Zerutik maluta zuritan erortzen da.' }, es: { answer: 'NIEVE', clue: 'Cae del cielo en copos blancos.' } },
      { eu: { answer: 'ERLE', clue: 'Eztia egiten duen intsektua.' }, es: { answer: 'ABEJA', clue: 'Insecto que fabrica miel.' } },
      { eu: { answer: 'ADAR', clue: 'Zuhaitzaren enborretik ateratzen da.' }, es: { answer: 'RAMA', clue: 'Sale del tronco del árbol.' } },
      { eu: { answer: 'OGI', clue: 'Irinarekin egiten da eta ogitartekoak prestatzeko balio du.' }, es: { answer: 'PAN', clue: 'Se hace con harina y sirve para preparar bocadillos.' } },
    ],
    lh3: [
      { eu: { answer: 'TXIMELETA', clue: 'Hego koloretsuak dituen intsektua.' }, es: { answer: 'MARIPOSA', clue: 'Insecto con alas de colores.' } },
      { eu: { answer: 'ORTZADAR', clue: 'Euriaren ondoren agertzen den kolore arkua.' }, es: { answer: 'ARCOIRIS', clue: 'Arco de colores que aparece tras la lluvia.' } },
      { eu: { answer: 'ITSASO', clue: 'Ur gaziz betetako eremu handia.' }, es: { answer: 'OCEANO', clue: 'Gran extensión de agua salada.' } },
      { eu: { answer: 'MENDIA', clue: 'Tontorra duen lur-eremu altua.' }, es: { answer: 'MONTE', clue: 'Terreno elevado que tiene una cima.' } },
      { eu: { answer: 'LIBURU', clue: 'Orrialdeak ditu eta irakurtzeko balio du.' }, es: { answer: 'CUENTO', clue: 'Relato que podemos leer.' } },
      { eu: { answer: 'URTXINTXA', clue: 'Isats luzea duen animalia zuhaitz-igokaria.' }, es: { answer: 'ARDILLA', clue: 'Animal de cola larga que trepa a los árboles.' } },
      { eu: { answer: 'SUKALDEA', clue: 'Janaria prestatzen dugun etxeko gela.' }, es: { answer: 'COCINA', clue: 'Habitación de la casa donde se prepara la comida.' } },
      { eu: { answer: 'EGUTEGIA', clue: 'Urteko egunak eta hilabeteak erakusten ditu.' }, es: { answer: 'CALENDARIO', clue: 'Muestra los días y meses del año.' } },
      { eu: { answer: 'ELURRA', clue: 'Hotz handiarekin zerutik malutatan erortzen da.' }, es: { answer: 'NIEVE', clue: 'Cae del cielo en copos cuando hace mucho frío.' } },
      { eu: { answer: 'ITSASARGI', clue: 'Itsasontziei bidea erakusten dien kostaldeko dorrea.' }, es: { answer: 'FARO', clue: 'Torre costera que guía a los barcos.' } },
      { eu: { answer: 'BIZIKLETA', clue: 'Bi gurpil eta pedalei esker mugitzen da.' }, es: { answer: 'BICICLETA', clue: 'Tiene dos ruedas y avanza con pedales.' } },
      { eu: { answer: 'PLANETA', clue: 'Izar baten inguruan biraka dabilen astroa.' }, es: { answer: 'PLANETA', clue: 'Astro que gira alrededor de una estrella.' } },
      { eu: { answer: 'SUMENDIA', clue: 'Barrutik laba atera dakiokeen mendia.' }, es: { answer: 'VOLCAN', clue: 'Montaña que puede expulsar lava.' } },
      { eu: { answer: 'ATERKIA', clue: 'Euriak busti ez gaitzan irekitzen dugu.' }, es: { answer: 'PARAGUAS', clue: 'Se abre para que la lluvia no nos moje.' } },
      { eu: { answer: 'BARRASKILOA', clue: 'Oskola bizkarrean daraman animalia motela.' }, es: { answer: 'CARACOL', clue: 'Animal lento que lleva una concha a cuestas.' } },
      { eu: { answer: 'LAPITZA', clue: 'Grafitozko punta duen idazteko tresna.' }, es: { answer: 'LAPIZ', clue: 'Instrumento para escribir con punta de grafito.' } },
      { eu: { answer: 'ZUBIA', clue: 'Ibai edo errepide baten gainetik igarotzeko eraikuntza.' }, es: { answer: 'PUENTE', clue: 'Construcción que permite pasar por encima de un río o una carretera.' } },
      { eu: { answer: 'ITZALA', clue: 'Objektu batek argia oztopatzen duenean sortzen den gune iluna.' }, es: { answer: 'SOMBRA', clue: 'Zona oscura que se forma cuando un objeto bloquea la luz.' } },
    ],
};
const banks: Record<Language, Record<SchoolLevel, CrosswordEntry[]>> = {
  eu: { lh1: pairs.lh1.map(pair => pair.eu), lh3: pairs.lh3.map(pair => pair.eu) },
  es: { lh1: pairs.lh1.map(pair => pair.es), lh3: pairs.lh3.map(pair => pair.es) },
};

type Placed = { answer: string; clue: string; row: number; column: number; direction: 'across' | 'down' };
function canPlace(placed: Placed[], entry: CrosswordEntry, row: number, column: number, direction: Placed['direction']) {
  const letters = [...entry.answer];
  let intersections = 0;
  for (const [index, letter] of letters.entries()) {
    const r = row + (direction === 'down' ? index : 0), c = column + (direction === 'across' ? index : 0);
    for (const word of placed) for (let j = 0; j < word.answer.length; j++) {
      const wr = word.row + (word.direction === 'down' ? j : 0), wc = word.column + (word.direction === 'across' ? j : 0);
      if (r === wr && c === wc) { if (word.answer[j] !== letter) return false; intersections++; }
    }
  }
  return intersections > 0;
}
function layout(entries: CrosswordEntry[]): Placed[] | undefined {
  const first = entries[0];
  for (let attempt = 0; attempt < 80; attempt++) {
    const placed: Placed[] = [{ ...first, row: 0, column: 0, direction: 'across' }];
    for (const entry of entries.slice(1)) {
      const options: Array<{ row: number; column: number; direction: Placed['direction'] }> = [];
      for (const word of placed) for (let i = 0; i < entry.answer.length; i++) for (let j = 0; j < word.answer.length; j++) {
        if (entry.answer[i] !== word.answer[j]) continue;
        const direction = word.direction === 'across' ? 'down' : 'across';
        const row = word.row + (word.direction === 'down' ? j : 0) - (direction === 'down' ? i : 0);
        const column = word.column + (word.direction === 'across' ? j : 0) - (direction === 'across' ? i : 0);
        if (canPlace(placed, entry, row, column, direction)) options.push({ row, column, direction });
      }
      if (options.length) { const option = options[Math.floor(Math.random() * options.length)]; placed.push({ ...entry, ...option }); }
    }
    if (placed.length === entries.length) return placed;
  }
  return undefined;
}

export function makeCrossword(lang: Language, level: SchoolLevel, recent: readonly string[] = []): CrosswordBoard {
  const pool = banks[lang][level];
  const previous = recent.slice(-6);
  for (let attempt = 0; attempt < 20; attempt++) {
    // A fresh set may lack crossings. Relax the history preference before giving up on the layout.
    const priority = attempt < 8 ? recent : attempt < 16 ? previous : [];
    const chosen = pickExercises(pool, 6, priority, entry => entry.answer);
    if (chosen.every(entry => previous.includes(entry.answer))) {
      chosen[5] = shuffle(pool.filter(entry => !previous.includes(entry.answer)))[0];
    }
    const placed = layout(chosen);
    if (!placed) continue;
    const minR = Math.min(...placed.map(word => word.row)), minC = Math.min(...placed.map(word => word.column));
    const normalized = placed.map(word => ({ ...word, row: word.row - minR, column: word.column - minC }));
    const height = Math.max(...normalized.map(word => word.row + (word.direction === 'down' ? word.answer.length : 1)));
    const width = Math.max(...normalized.map(word => word.column + (word.direction === 'across' ? word.answer.length : 1)));
    const cells: (CrosswordCell | null)[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => null));
    normalized.forEach((word, index) => [...word.answer].forEach((letter, offset) => {
      const row = word.row + (word.direction === 'down' ? offset : 0), column = word.column + (word.direction === 'across' ? offset : 0);
      const cell = cells[row][column];
      if (cell) { cell.entries.push(index); if (cell.letter !== letter) throw new Error('Crossword has conflicting crossings'); }
      else cells[row][column] = { letter, entries: [index] };
    }));
    return { cells, entries: normalized };
  }
  throw new Error('Unable to create a connected crossword from the word bank');
}
