import { CHARACTERS, DIFFICULTIES, ITEMS, attackPreview, buildChapterMap, card, intent, itemFor, newRun, transition } from '../src/game.mjs';

const RUNS = Number(process.argv[2] || 100);
const TARGET_ROW = Number(process.argv[3] || 9);

function autoEquip(state) {
  const item = itemFor(state, state.lastLoot);
  if (!item) return state;
  const definition = ITEMS[item.base];
  const current = itemFor(state, state.equipment[definition.slot]);
  const score = value => {
    if (!value) return -1;
    const base = ITEMS[value.base];
    const affixes = (value.affixes || []).reduce((sum, affix) => sum + affix.value, 0);
    return (base.attack || 0) * 2 + (base.block || 0) * 1.5 + (base.recovery || 0) * 2 + (base.firstStrike || 0) + affixes + (value.skill ? 8 : 0);
  };
  return score(item) > score(current) ? transition(state, { type: 'equip', key: item.id }) : state;
}

function chooseManualCard(state) {
  const move = intent(state);
  const incoming = move.kind === 'guard' ? 0 : move.value * (move.hits || 1);
  const pierce = DIFFICULTIES[state.difficulty].guardPierce;
  const blockable = Math.max(0, incoming - Math.ceil(incoming * pierce));
  let best = { index: -1, score: -Infinity };
  state.hand.forEach((key, index) => {
    const current = card(key);
    if (current.cost > state.energy) return;
    const damage = attackPreview(state, key);
    let score = damage * 3 + (damage >= state.enemy.hp ? 1000 : 0);
    if (current.block) score += Math.min(current.block, Math.max(0, blockable - state.block)) * 5;
    if (current.heal) score += Math.min(current.heal, state.maxHp - state.hp) * 3;
    if (current.mark) score += current.mark * (state.enemy.mark ? 8 : 15);
    if (current.draw) score += current.draw * 9;
    if (current.energy) score += current.energy * 12;
    if (current.cost === 0) score += 20;
    if (current.self) score -= current.self * (state.hp < 18 ? 10 : 1);
    score -= current.cost;
    if (score > best.score) best = { index, score };
  });
  return best.index;
}

function settle(state, useGear, mode) {
  let next = state;
  let actions = 0;
  while (next.phase === 'combat' && actions++ < 300) {
    if (mode === 'auto') next = transition(next, { type: 'auto' });
    else {
      const index = chooseManualCard(next);
      next = transition(next, index >= 0 ? { type: 'play', index } : { type: 'end' });
    }
  }
  if (next.phase === 'reward') {
    if (useGear) next = autoEquip(next);
    next = transition(next, { type: 'reward', key: next.choices[0] ?? null });
  } else if (next.phase === 'camp') {
    next = transition(next, { type: 'camp', choice: 'rest' });
  } else if (next.phase === 'event') {
    next = transition(next, { type: 'event', choice: 'spring' });
  } else if (next.phase === 'checkpoint') {
    next = transition(next, { type: 'checkpoint', choice: 'rest' });
  }
  return next;
}

function simulate(seed, difficulty, character, useGear, mode) {
  let state = newRun(seed, mode, difficulty, character);
  if (!useGear) state.equipment = { weapon: null, armor: null, bag: null, scarf: null, charm: null, decor: null };
  state = transition(state, { type: 'depart', stage: 0 });
  const map = buildChapterMap(0, state.mapSeed);
  while (state.phase !== 'lost' && state.mapRow < TARGET_ROW) {
    const previous = map.find(node => node.id === state.currentNode);
    const available = state.mapRow < 0 ? map.filter(node => node.row === 0) : map.filter(node => previous?.links.includes(node.id));
    const target = available.toSorted((a, b) => {
      const danger = { battle: 0, elite: 1, event: 2, camp: 3, checkpoint: 4, boss: 5 };
      return (danger[a.type] ?? 9) - (danger[b.type] ?? 9) || a.x - b.x;
    })[0];
    if (!target) break;
    state = settle(transition(state, { type: 'node', id: target.id }), useGear, mode);
  }
  return { survived: state.phase !== 'lost' && state.mapRow >= TARGET_ROW, row: state.mapRow, hp: state.hp };
}

for (const difficulty of ['standard', 'challenge']) {
  for (const character of Object.keys(CHARACTERS)) {
    for (const mode of ['auto', 'manual']) {
      for (const useGear of [false, true]) {
        const results = Array.from({ length: RUNS }, (_, index) => simulate(1000 + index, difficulty, character, useGear, mode));
        const survived = results.filter(result => result.survived).length;
        const averageRow = results.reduce((sum, result) => sum + Math.max(0, result.row), 0) / results.length;
        const averageHp = results.filter(result => result.survived).reduce((sum, result) => sum + result.hp, 0) / Math.max(1, survived);
        console.log(`${difficulty.padEnd(9)} ${character.padEnd(9)} ${mode.padEnd(6)} ${useGear ? 'auto-equip' : 'no-gear   '} survive=${String(survived).padStart(3)}/${RUNS} avg-row=${averageRow.toFixed(1)} avg-hp=${averageHp.toFixed(1)}`);
      }
    }
  }
}
