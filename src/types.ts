export type Language = 'eu' | 'es';
export type ProfileId = 'nahia' | 'eider' | 'team';
export type Difficulty = 'auto' | 'seed' | 'star';
export type GameId = 'animals' | 'potions' | 'race' | 'museum' | 'city' | 'road' | 'garden';
export type View = 'welcome' | 'menu' | 'game' | 'progress' | 'settings';
export interface CityPiece { id: string; x: number; y: number; }
export interface CityProgress { placed: CityPiece[]; unlocked: string[]; missions: number; happiness: number; }
export type RoadCarId = 'red' | 'blue' | 'yellow' | 'duo';
export type CircuitId = 'forest' | 'cloud' | 'moon';
export interface RoadProgress { selectedCar: RoadCarId; selectedCircuit: CircuitId; circuitsPlayed: CircuitId[]; objectives: number; turbos: number; cleanStreak: number; circuitStats: Record<CircuitId,{runs:number;stars:number;distance:number}>; }
export interface Session { game: GameId; date: string; correct: number; total: number; stars: number; }
export interface Stats { stars: number; played: number; animals: number; potions: number; races: number; gardens: number; cases: number; clues: number; maxClueStreak: number; noHelpCases: number; roadStars: number; roadDistance: number; roadRuns: number; obstaclesAvoided: number; cleanRoads: number; correct: number; attempts: number; maxPotionStreak: number; teamWins: number; lastPlayed?: string; days: string[]; best: Record<GameId, number>; recent: boolean[]; sessions: Session[]; city: CityProgress; road: RoadProgress; }
export interface SavedState { version: 4; settings: { language: Language; sound: boolean; difficulty: Difficulty; reducedMotion: boolean }; profiles: Record<ProfileId, Stats>; }
export interface GameResult { game: GameId; score: number; correct: number; total: number; stars: number; animals?: number; potions?: number; races?: number; gardens?: number; cases?: number; clues?: number; maxClueStreak?: number; noHelpCase?: boolean; roadStars?: number; roadDistance?: number; roadRuns?: number; obstaclesAvoided?: number; cleanRoad?: boolean; maxPotionStreak?: number; teamWin?: boolean; }
export interface QuizQuestion { prompt: string; options: string[]; answer: number; hint?: string; visual?: string; }
export interface Ingredient { id: string; icon: string; color: string; name: string; }
export type DetectiveKind = 'memory' | 'difference' | 'order' | 'deduction';
export interface DetectivePuzzle { kind: DetectiveKind; prompt: string; options: string[]; answer: number; display: string[]; hint: string; }
