import type { Ingredient, Language } from '../types';
export const ingredients = (l: Language): Ingredient[] => [
  {id:'star',icon:'⭐',color:'#ffd95e',name:l==='eu'?'izar':'estrella'}, {id:'moon',icon:'🌙',color:'#b8a6ff',name:l==='eu'?'ilargi':'luna'},
  {id:'leaf',icon:'🍃',color:'#78cd8d',name:l==='eu'?'hosto':'hoja'}, {id:'drop',icon:'💧',color:'#72c6ff',name:l==='eu'?'tanta':'gota'},
  {id:'crystal',icon:'💎',color:'#7ee3dc',name:l==='eu'?'kristal':'cristal'}, {id:'berry',icon:'🫐',color:'#9a7ce5',name:l==='eu'?'baia':'baya'}
];
export const potionNames = { eu:['Izar distiratsua','Ilargi lasaia','Ostadarraren dantza','Basoko xuxurla','Hodei goxoa','Marea urdina','Bihotz alaia','Sugearen txinparta','Loreen musua','Eguzki txikia','Amets morea','Ttantta magikoa','Tximeleta hegaldia','Neguko argia','Oihaneko sekretua','Korrikalari azkarra','Barrearen edabea','Lagunarteko nahasketa','Izotz distira','Marrubi ametsa'], es:['Estrella brillante','Luna tranquila','Danza arcoíris','Susurro del bosque','Nube dulce','Marea azul','Corazón alegre','Chispa de dragón','Beso de flores','Sol pequeñito','Sueño violeta','Gota mágica','Vuelo de mariposa','Luz de invierno','Secreto del bosque','Corredora veloz','Poción de risas','Mezcla de amigas','Brillo de hielo','Sueño de fresa'] };
export interface CityItem { id:string; icon:string; type:'building'|'nature'|'decor'; happiness:number; name:{eu:string;es:string}; desc:{eu:string;es:string}; }
export const cityItems:CityItem[]=[
 {id:'house',icon:'🏠',type:'building',happiness:2,name:{eu:'Etxe alaia',es:'Casa alegre'},desc:{eu:'Familientzako etxe beroa.',es:'Un hogar cálido para familias.'}},
 {id:'library',icon:'📚',type:'building',happiness:4,name:{eu:'Liburutegia',es:'Biblioteca'},desc:{eu:'Ipuin eta ideia berriz betea.',es:'Llena de cuentos e ideas nuevas.'}},
 {id:'school',icon:'🏫',type:'building',happiness:3,name:{eu:'Eskola',es:'Escuela'},desc:{eu:'Ikasteko eta lagunak egiteko.',es:'Para aprender y hacer amigas.'}},
 {id:'hospital',icon:'🏥',type:'building',happiness:3,name:{eu:'Ospitalea',es:'Hospital'},desc:{eu:'Denak zaintzeko lekua.',es:'Un lugar para cuidar a todos.'}},
 {id:'park',icon:'🌳',type:'nature',happiness:5,name:{eu:'Parke magikoa',es:'Parque mágico'},desc:{eu:'Jolasteko belar berdea.',es:'Césped verde para jugar.'}},
 {id:'tree',icon:'🌲',type:'nature',happiness:2,name:{eu:'Zuhaitz handia',es:'Árbol grande'},desc:{eu:'Itzala eta txoriak.',es:'Sombra y pajaritos.'}},
 {id:'flower',icon:'🌷',type:'nature',happiness:1,name:{eu:'Loreak',es:'Flores'},desc:{eu:'Kolore pixka bat plazari.',es:'Color para la plaza.'}},
 {id:'lake',icon:'🌊',type:'nature',happiness:4,name:{eu:'Aintzira',es:'Lago'},desc:{eu:'Ahateen etxe urdina.',es:'Casa azul de los patos.'}},
 {id:'bridge',icon:'🌉',type:'decor',happiness:2,name:{eu:'Zubi distiratsua',es:'Puente brillante'},desc:{eu:'Bi auzo elkartzen ditu.',es:'Une dos barrios.'}},
 {id:'lamp',icon:'💡',type:'decor',happiness:1,name:{eu:'Farola',es:'Farola'},desc:{eu:'Gauean argi leuna.',es:'Luz suave por la noche.'}},
 {id:'garden',icon:'🥕',type:'nature',happiness:3,name:{eu:'Baratzea',es:'Huerto'},desc:{eu:'Barazki goxoak hazteko.',es:'Para cultivar verduras ricas.'}},
 {id:'fountain',icon:'⛲',type:'decor',happiness:3,name:{eu:'Iturria',es:'Fuente'},desc:{eu:'Urarekin dantzan.',es:'Baila con el agua.'}}
];
