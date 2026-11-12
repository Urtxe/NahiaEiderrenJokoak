import type { Language } from '../types';
import type { CheckersSide } from '../utils/boardGames';

export type TeamScore = { nahia: number; eider: number; draws: number };

export function TeamMatchControls({ lang, score, choosingStarter, disabled, onStart }: {
  lang: Language;
  score: TeamScore;
  choosingStarter: boolean;
  disabled: boolean;
  onStart: (side: CheckersSide) => void;
}) {
  const eu = lang === 'eu';
  return <>
    <div className="team-score" role="group" aria-label={eu ? 'Saio honetako markagailua' : 'Marcador de esta sesión'}>
      <span>Nahia <strong>{score.nahia}</strong></span>
      <span>{eu ? 'Berdinketak' : 'Empates'} <strong>{score.draws}</strong></span>
      <span>Eider <strong>{score.eider}</strong></span>
    </div>
    {choosingStarter && <fieldset className="team-starter" disabled={disabled}>
      <legend>{eu ? 'Nor hasiko da partida honetan?' : '¿Quién empieza esta partida?'}</legend>
      <div className="choice-row">
        <button className="secondary" onClick={() => onStart('nahia')}>Nahia</button>
        <button className="secondary" onClick={() => onStart('eider')}>Eider</button>
      </div>
    </fieldset>}
  </>;
}
