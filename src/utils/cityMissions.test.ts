import { describe, expect, it } from 'vitest';
import { normalizeSavedState } from '../hooks/useProgress';
import { drawCityMission } from './cityMissions';

describe('city missions', () => {
  it.each([['eu', 'seed'], ['es', 'star']] as const)('offers each mission once per cycle in %s at %s', (lang, level) => {
    let used: string[] = [];
    const prompts = new Set<string>();
    for (let index = 0; index < 18; index++) {
      const { mission, usedMissions } = drawCityMission(lang, level, [], used);
      expect(usedMissions).toHaveLength(index + 1);
      expect(new Set(usedMissions).size).toBe(index + 1);
      expect(new Set(mission.options).size).toBe(4);
      expect(mission.options[mission.answer]).toBeTruthy();
      expect(mission.reward.id).toBeTruthy();
      prompts.add(mission.prompt);
      used = usedMissions;
    }
    expect(prompts.size).toBe(18);
    const next = drawCityMission(lang, level, [], used);
    expect(next.usedMissions).toHaveLength(1);
    expect(next.usedMissions[0]).not.toBe(used[used.length - 1]);
  });

  it('retains valid mission history per profile and loads older cities', () => {
    const state = normalizeSavedState({ profiles: {
      nahia: { city: { usedMissions: ['park', 'park', 'unknown', 'route'] } },
      eider: { city: { missions: 6, happiness: 12, placed: [{ id: 'school', x: 0, y: 0 }] } },
    } });
    expect(state.profiles.nahia.city.usedMissions).toEqual(['park', 'route']);
    expect(state.profiles.eider.city).toMatchObject({ missions: 6, happiness: 12, placed: [{ id: 'school', x: 0, y: 0 }], usedMissions: [] });
    expect(state.profiles.team.city.usedMissions).toEqual([]);
  });
});
