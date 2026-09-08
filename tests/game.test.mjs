import assert from 'node:assert/strict';
import test from 'node:test';
import { CARDS, CHARACTERS, CHAPTER_LOOT, CHECKPOINTS, CHECKPOINT_STEPS, CORE_REWARDS, DIFFICULTIES, ENCOUNTERS, ENEMIES, EQUIPMENT_ART, ITEMS, MAP_STEPS, MYSTERY_STATIONS, REWARDS, SKILL_UNLOCKS, attackPreview, buildChapterMap, card, chooseAutoCard, commissionStatus, compareCardKeys, enemyFor, equipmentDropCount, equipmentInnateSkillChance, equipmentRandomSkillChance, equipmentRarityChances, equipmentSkillDropScale, equipmentStats, facilityCost, intent, itemBaseStats, itemFor, itemStats, itemTier, itemUpgradeCost, magicHouseCooldownRemaining, newRun, rerollCost, restore, serialize, skillRewardRank, transition } from '../src/game.mjs';

const leaveHub = (state, stage = 0) => transition(state, { type: 'depart', stage });
const enterBattle = (seed, mode = 'manual') => transition(leaveHub(newRun(seed, mode)), { type: 'node', id: 'c0r0n0' });

test('同一种子生成相同的初始手牌', () => {
  assert.deepEqual(enterBattle(20260827).hand, enterBattle(20260827).hand);
});

test('出牌会消耗能量并进入弃牌堆', () => {
  const state = enterBattle(7);
  const index = state.hand.findIndex(key => card(key).cost <= state.energy);
  const key = state.hand[index];
  const next = transition(state, { type: 'play', index });
  assert.equal(next.energy, state.energy - card(key).cost + (card(key).energy || 0));
  assert.equal(next.played, 1);
  assert.ok(next.discard.includes(key) || next.exhaust.includes(key));
});

test('战斗日志按时间顺序记录并在每次行动后显示双方状态', () => {
  const state = enterBattle(71);
  assert.ok(state.battleLog[0].startsWith('抵达'));
  assert.ok(state.battleLog[1].startsWith('第 1 回合'));
  assert.ok(state.battleLog[2].startsWith('状态：你'));
  const index = state.hand.findIndex(key => card(key).cost <= state.energy);
  const next = transition(state, { type: 'play', index });
  assert.ok(next.battleLog.at(-2).startsWith('你打出'));
  assert.match(next.battleLog.at(-1), new RegExp(`状态：你 \\d+/${next.maxHp} 生命.*${enemyFor(next).name} \\d+/${next.enemy.maxHp} 生命`));
});

test('结束回合会执行敌人意图并开始下一回合', () => {
  const state = enterBattle(11);
  const foeName = enemyFor(state).name;
  const next = transition(state, { type: 'end' });
  assert.equal(next.turn, 2);
  assert.equal(next.energy, 3);
  assert.ok(next.hp < state.hp || next.enemy.block > 0 || next.enemy.charge > 0);
  assert.ok(next.battleLog.some(line => line.startsWith(foeName)));
});

test('技能池包含多种主题，保留牌不会在回合结束时弃掉', () => {
  assert.ok(Object.keys(CARDS).length >= 20);
  const state = enterBattle(12);
  state.hand = ['blanket', 'slash'];
  const next = transition(state, { type: 'end' });
  assert.ok(next.hand.includes('blanket'));
  assert.ok(next.discard.includes('slash'));
});

test('开局可选择自动或手动战斗，进入旅程后不能切换', () => {
  assert.equal(newRun(1).battleMode, 'manual');
  assert.equal(newRun(1, 'auto').battleMode, 'auto');
  const manual = newRun(1, 'manual');
  assert.equal(manual.battleMode, 'manual');
  assert.equal(transition(manual, { type: 'mode', mode: 'auto' }).battleMode, 'manual');
});

test('三名角色拥有不同初始牌组并贯穿存档', () => {
  const decks = Object.keys(CHARACTERS).map(character => newRun(8, 'manual', 'standard', character).deck);
  assert.equal(new Set(decks.map(deck => deck.join(','))).size, 3);
  const gaigai = newRun(8, 'manual', 'standard', 'gaigai');
  assert.equal(gaigai.character, 'gaigai');
  assert.deepEqual(restore(serialize(gaigai)), gaigai);
});

test('房车功能的新标签分别记录已读状态', () => {
  const state = newRun(801, 'manual');
  assert.deepEqual(state.featureSeen, { bag: false, workshop: false, guests: false });
  const bagSeen = transition(state, { type: 'viewFeature', key: 'bag' });
  assert.deepEqual(bagSeen.featureSeen, { bag: true, workshop: false, guests: false });
  const workshopSeen = transition(bagSeen, { type: 'viewFeature', key: 'workshop' });
  assert.deepEqual(workshopSeen.featureSeen, { bag: true, workshop: true, guests: false });
  const traveling = leaveHub(workshopSeen);
  assert.equal(transition(traveling, { type: 'viewFeature', key: 'guests' }), traveling);
});

test('大叔每回合首次发现弱点会增加百分之三十层数并额外抽牌', () => {
  const state = enterBattle(81);
  state.hand = ['mark', 'mark']; state.draw = ['slash', 'guard']; state.energy = 3;
  const first = transition(state, { type: 'play', index: 0 });
  assert.equal(first.hand.length, 2);
  assert.equal(first.traitUsed, true);
  assert.equal(first.enemy.mark, 4);
  const second = transition(first, { type: 'play', index: 0 });
  assert.equal(second.hand.length, 1);
  assert.equal(second.enemy.mark, 7);
  assert.ok(first.battleLog.some(line => line.includes('特性额外 1 层')));
});

test('大叔的首次弱点加成会计算装备提供的弱点强化', () => {
  const state = enterBattle(810);
  state.inventory.find(item => item.id === state.equipment.weapon).affixes = [{ key: 'markPower', value: 2 }];
  state.hand = ['mark']; state.draw = []; state.energy = 3;
  const next = transition(state, { type: 'play', index: 0 });
  assert.equal(next.enemy.mark, 7);
  assert.ok(next.battleLog.some(line => line.includes('特性额外 2 层')));
});

test('每段攻击只消耗一层弱点，多段攻击可以连续触发', () => {
  const state = enterBattle(811);
  state.enemy = { hp: 100, maxHp: 100, block: 0, mark: 3 };
  state.hand = ['slash', 'nova']; state.energy = 3;
  const slashDamage = card('slash').damage + equipmentStats(state).attack;
  assert.equal(attackPreview(state, 'slash'), slashDamage + 3);
  const single = transition(state, { type: 'play', index: 0 });
  assert.equal(single.enemy.mark, 2);
  const expectedNova = attackPreview(single, 'nova');
  const multi = transition(single, { type: 'play', index: 0 });
  assert.equal(single.enemy.hp - multi.enemy.hp, expectedNova);
  assert.equal(multi.enemy.mark, 0);
});

test('弱点伤害无视敌人护盾且预计伤害与实际扣血一致', () => {
  const state = enterBattle(812);
  state.enemy = { hp: 100, maxHp: 100, block: 99, mark: 2 };
  state.hand = ['slash']; state.energy = 3;
  const expected = 2;
  assert.equal(attackPreview(state, 'slash'), expected);
  const attacked = transition(state, { type: 'play', index: 0 });
  assert.equal(state.enemy.hp - attacked.enemy.hp, expected);
  assert.equal(attacked.enemy.mark, 1);
  assert.ok(attacked.enemy.block < state.enemy.block);
  assert.ok(attacked.battleLog.some(line => line.includes('弱点伤害无视护盾')));
  assert.ok(attacked.battleLog.some(line => line.includes('护盾抵消')));
});

test('弱点伤害由当前层数决定而不随攻击力变化', () => {
  const low = enterBattle(813);
  low.enemy = { hp: 100, maxHp: 100, block: 99, mark: 1 };
  low.hand = ['slash']; low.energy = 3;
  const high = structuredClone(low);
  high.inventory.push({ id: 'gear-3', base: 'bookmarkKnife', rarity: '精良', itemLevel: 21, affixes: [], skill: null, skillLevel: 0 });
  high.equipment.weapon = 'gear-3';
  assert.equal(attackPreview(high, 'slash'), attackPreview(low, 'slash'));
  high.enemy.mark = 5;
  assert.equal(attackPreview(high, 'slash'), 5);
});

test('该该每三点最终治疗量转为一点暖意并追加到下一次攻击', () => {
  const state = transition(leaveHub(newRun(82, 'manual', 'standard', 'gaigai')), { type: 'node', id: 'c0r0n0' });
  state.hp = state.maxHp - 1; state.hand = ['mend', 'slash']; state.energy = 3; state.enemy.hp = 100; state.enemy.maxHp = 100;
  const healed = transition(state, { type: 'play', index: 0 });
  const effectiveHealing = card('mend').heal;
  assert.equal(healed.warmth, Math.ceil(effectiveHealing / 3));
  const expected = attackPreview(healed, 'slash');
  const attacked = transition(healed, { type: 'play', index: 0 });
  assert.equal(100 - attacked.enemy.hp, expected);
  assert.equal(attacked.warmth, 0);
});

test('热可可在残血时也能治疗并为下一张攻击保留暖意', () => {
  const state = transition(leaveHub(newRun(821, 'manual', 'challenge', 'gaigai')), { type: 'node', id: 'c0r0n0' });
  state.hp = state.maxHp - 20; state.hand = ['leech']; state.energy = 3; state.enemy.hp = 100; state.enemy.maxHp = 100;
  const next = transition(state, { type: 'play', index: 0 });
  const expectedHealing = card('leech').heal;
  assert.equal(next.hp, state.hp + expectedHealing);
  assert.equal(next.warmth, Math.ceil(expectedHealing / 3));
});

test('该该的暖意可以超过六层并在下一张攻击时全部释放', () => {
  const state = transition(leaveHub(newRun(84, 'manual', 'standard', 'gaigai')), { type: 'node', id: 'c0r0n0' });
  state.hp = state.maxHp; state.warmth = 6;
  state.hand = ['mend', 'slash']; state.energy = 3; state.enemy.hp = 100; state.enemy.maxHp = 100;
  const stored = transition(state, { type: 'play', index: 0 });
  assert.equal(stored.warmth, 10);
  const expected = attackPreview(stored, 'slash');
  const attacked = transition(stored, { type: 'play', index: 0 });
  assert.equal(attacked.warmth, 0);
  assert.equal(100 - attacked.enemy.hp, expected);
});

test('我在这里、热可可和蜂蜜牛奶的一级基础收益一致', () => {
  const total = key => {
    const value = card(key);
    return (value.damage || 0) + (value.block || 0) + (value.heal || 0);
  };
  assert.deepEqual(['riposte', 'leech', 'mend'].map(total), [10, 10, 10]);
});

test('小帅会用护盾反击并保留部分剩余护盾', () => {
  const state = transition(leaveHub(newRun(83, 'manual', 'standard', 'xiaoshuai')), { type: 'node', id: 'c0r0n0' });
  state.block = 30; state.enemy.hp = 100; state.enemy.maxHp = 100;
  const next = transition(state, { type: 'end' });
  assert.ok(next.enemy.hp < 100);
  assert.ok(next.block > equipmentStats(next).block);
});

test('自动战斗会选择可用牌并持续推进', () => {
  let state = enterBattle(23, 'auto');
  const index = chooseAutoCard(state);
  assert.ok(index >= 0);
  assert.ok(card(state.hand[index]).cost <= state.energy);
  const next = transition(state, { type: 'auto' });
  assert.equal(next.played, 1);
  assert.ok(next.battleLog.some(line => line.includes('你打出')));
});

test('自动托管优先攻击，不会代替玩家精确防御', () => {
  const state = enterBattle(230, 'auto');
  state.hand = ['guard', 'slash']; state.energy = 1;
  assert.equal(chooseAutoCard(state), 1);
});

test('每章提供八种非首领遭遇，首领保持独立', () => {
  assert.ok(ENCOUNTERS.every(encounters => encounters.length >= 8));
  assert.ok(ENCOUNTERS.every(encounters => new Set(encounters.map(enemy => enemy.art)).size >= 8));
  const state = leaveHub(newRun(24));
  state.mapRow = 0; state.foe = 0;
  assert.equal(enemyFor(state).name, ENCOUNTERS[0][0].name);
  state.mapRow = 20; state.foe = 1;
  assert.equal(enemyFor(state).name, ENCOUNTERS[0][1].name);
  state.elite = true; state.foe = 2;
  assert.equal(enemyFor(state).name, ENCOUNTERS[0][2].name);
  state.bossFight = true;
  assert.equal(enemyFor(state).name, ENEMIES[0].name);
});

test('第一章普通与精英使用独立敌人池且机制清晰区分', () => {
  const chapter = ENCOUNTERS[0];
  const normal = chapter.filter(enemy => !enemy.eliteOnly);
  const elites = chapter.filter(enemy => enemy.eliteOnly);
  assert.equal(normal.length, 6);
  assert.deepEqual(elites.map(enemy => enemy.name), ['余温茶杯', '缠结线团']);
  assert.deepEqual(elites[0].pattern, [
    { kind: 'attack', value: 7 },
    { kind: 'guard', value: 8 },
    { kind: 'heal', value: 5 },
  ]);
  assert.deepEqual(elites[1].pattern, [
    { kind: 'attack', value: 4, hits: 2 },
    { kind: 'jam', value: 1 },
    { kind: 'guard', value: 7 },
  ]);
  const mechanics = new Set(normal.flatMap(enemy => enemy.pattern.map(move => move.hits ? 'multi' : move.kind)));
  for (const mechanic of ['charge', 'guard', 'multi', 'dispel', 'heal', 'curse']) assert.ok(mechanics.has(mechanic), mechanic);
  assert.ok(Math.min(...elites.map(enemy => enemy.hp * 1.5)) > Math.max(...normal.map(enemy => enemy.hp)));
});

test('第一章精英护盾保留回合成长且茶杯基础治疗为五点', () => {
  const state = enterBattle(243);
  state.stage = 0;
  state.elite = true;
  state.foe = 6;
  state.turn = 2;
  state.mapRow = 0;
  const earlyGuard = intent(state);
  state.turn = 5;
  const lateGuard = intent(state);
  assert.equal(ENCOUNTERS[0][6].pattern[2].value, 5);
  assert.equal(earlyGuard.kind, 'guard');
  assert.equal(lateGuard.kind, 'guard');
  assert.ok(lateGuard.value > earlyGuard.value);
});

test('第一章地图节点不会让普通与精英模板串池', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const nodes = buildChapterMap(0, seed);
    for (const target of nodes.filter(node => ['battle', 'elite'].includes(node.type) && node.row > 0)) {
      const parent = nodes.find(node => node.links.includes(target.id));
      const state = leaveHub(newRun(seed, 'manual'));
      state.mapRow = parent.row; state.currentNode = parent.id; state.visited = [parent.id];
      const battle = transition(state, { type: 'node', id: target.id });
      assert.equal(Boolean(enemyFor(battle).eliteOnly), target.type === 'elite', target.id);
    }
  }
});

test('恢复型敌人会按预告恢复生命但不会超过上限', () => {
  const state = enterBattle(241);
  state.foe = 4; state.turn = 2; state.hand = [];
  state.enemy.maxHp = 100; state.enemy.hp = 90;
  const next = transition(state, { type: 'end' });
  assert.ok(next.enemy.hp > state.enemy.hp);
  assert.ok(next.enemy.hp <= next.enemy.maxHp);
  assert.ok(next.battleLog.some(line => line.includes('恢复')));
});

test('蓄力型敌人会在释放重击后清空蓄力并重新预告', () => {
  const state = enterBattle(242);
  state.foe = 0; state.hand = [];
  const charged = transition(state, { type: 'end' });
  assert.ok(charged.enemy.charge > 0);
  const released = transition(charged, { type: 'end' });
  assert.equal(released.enemy.charge, 0);
  assert.ok(released.hp < charged.hp);
  const chargingAgain = transition(released, { type: 'end' });
  assert.ok(chargingAgain.enemy.charge > 0);
});

test('装备会真实改变攻击与回合格挡', () => {
  let state = newRun(29, 'manual');
  assert.equal(equipmentStats(state).attack, 1);
  assert.equal(equipmentStats(state).block, 1);
  state.inventory.push({ id: 'gear-3', base: 'bookmarkKnife', rarity: '精良', affixes: [], skill: null });
  state.nextItemId = 4;
  state = transition(state, { type: 'equip', key: 'gear-3' });
  const battle = transition(leaveHub(state), { type: 'node', id: 'c0r0n0' });
  assert.equal(battle.block, 1);
  assert.equal(attackPreview(battle, 'slash'), 10);
});

test('普通怪技能装备掉率逐章开放且精英怪不受衰减', () => {
  assert.deepEqual(Array.from({ length: 6 }, (_, stage) => equipmentSkillDropScale(stage)), [.15, .3, .45, .6, .8, 1]);
  assert.equal(equipmentSkillDropScale(0, true), 1);
  assert.equal(equipmentSkillDropScale(5, true), 1);
});

test('普通、精英与 Boss 使用独立且可核对的装备品质概率', () => {
  const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
  const check = (actual, expected) => Object.keys(expected).forEach(key => closeTo(actual[key], expected[key]));
  const normal = newRun(301); normal.stage = 0;
  check(equipmentRarityChances(normal), { normal: .52, fine: .36, rare: .12, legendary: 0 });
  const elite = structuredClone(normal); elite.elite = true;
  check(equipmentRarityChances(elite), { normal: .42, fine: .36, rare: .18, legendary: .04 });
  const boss = structuredClone(normal); boss.bossFight = true;
  check(equipmentRarityChances(boss), { normal: .36, fine: .36, rare: .18, legendary: .1 });
  boss.stage = 5;
  const lateBoss = equipmentRarityChances(boss);
  assert.ok(Math.abs(lateBoss.normal - .285) < 1e-9);
  assert.ok(Math.abs(lateBoss.legendary - .175) < 1e-9);
  assert.equal(Object.values(lateBoss).reduce((sum, chance) => sum + chance, 0), 1);
});

test('随机装备技能不再由稀有和传奇品质高概率保送', () => {
  assert.equal(equipmentRandomSkillChance('普通'), 0);
  assert.equal(equipmentRandomSkillChance('精良'), 0);
  assert.equal(equipmentRandomSkillChance('稀有'), .2);
  assert.equal(equipmentRandomSkillChance('传奇'), .6);
});

test('底材自带技能不会被早期精英和 Boss 保送', () => {
  const normal = newRun(302); normal.stage = 0;
  assert.equal(equipmentInnateSkillChance(normal), .15);
  const elite = structuredClone(normal); elite.elite = true;
  assert.equal(equipmentInnateSkillChance(elite), .3);
  const boss = structuredClone(normal); boss.bossFight = true;
  assert.equal(equipmentInnateSkillChance(boss), .4);
  normal.stage = 5;
  assert.equal(equipmentInnateSkillChance(normal), 1);
});

test('胜利获得经验、升级并按 0 至 3 件规则掉落装备', () => {
  const state = enterBattle(31);
  state.xp = 44;
  state.hand = ['slash']; state.energy = 3; state.enemy.hp = 1;
  const reward = transition(state, { type: 'play', index: 0 });
  assert.equal(reward.level, 2);
  assert.equal(reward.maxHp, 76);
  assert.ok(reward.lastLoots.length >= 0 && reward.lastLoots.length <= 3);
  for (const id of reward.lastLoots) {
    assert.ok(CHAPTER_LOOT[0].includes(itemFor(reward, id).base));
    assert.ok(['weapon', 'armor', 'bag', 'scarf', 'charm', 'decor'].includes(ITEMS[itemFor(reward, id).base].slot));
    assert.ok(reward.journeyNewItems.includes(id));
  }
});

test('本次探索获得的装备和技能会标记为新内容，并在下一次启程时清空', () => {
  let state = newRun(123, 'manual', 'standard', 'gaigai');
  state.phase = 'reward'; state.enemy.hp = 0; state.choices = ['riposte', 'leech', 'quick'];
  state = transition(state, { type: 'reward', key: 'riposte' });
  assert.deepEqual(state.journeyNewCards, ['riposte']);
  state.phase = 'hub'; state.unlocked = 0;
  state.journeyNewItems = [state.inventory[0].id];
  state = transition(state, { type: 'depart', stage: 0 });
  assert.deepEqual(state.journeyNewItems, []);
  assert.deepEqual(state.journeyNewCards, []);
});

test('在背包中查看新卡后会清除同名卡牌的 NEW 标记', () => {
  const state = newRun(124, 'manual');
  state.journeyNewCards = ['mark', 'quick'];
  const viewed = transition(state, { type: 'viewCard', key: 'mark+3' });
  assert.deepEqual(viewed.journeyNewCards, ['quick']);
  assert.deepEqual(viewed.deck, state.deck);
});

test('六章各有八种装备底材并覆盖六个装备位', () => {
  assert.ok(Object.keys(ITEMS).length >= 48);
  for (const pool of CHAPTER_LOOT) {
    assert.equal(pool.length, 8);
    assert.equal(new Set(pool).size, 8);
    assert.ok(pool.every(key => ITEMS[key]));
    assert.deepEqual(new Set(pool.map(key => ITEMS[key].slot)), new Set(['weapon', 'armor', 'bag', 'scarf', 'charm', 'decor']));
  }
});

test('装备会随物品等级跨越普通、进阶和精英底材，后期基础数值显著提高', () => {
  const low = { base: 'morningShears', itemLevel: 1 };
  const advanced = { base: 'morningShears', itemLevel: 21 };
  const elite = { base: 'morningShears', itemLevel: 41 };
  assert.equal(itemTier(low).name, '普通底材');
  assert.equal(itemTier(advanced).name, '进阶底材');
  assert.equal(itemTier(elite).name, '精英底材');
  assert.ok(itemBaseStats(advanced).attack >= itemBaseStats(low).attack * 2);
  assert.ok(itemBaseStats(elite).attack >= itemBaseStats(low).attack * 5);
});

test('装备结构化属性会合并底材与随机词条，供界面直接对比', () => {
  const item = { id: 'gear-99', base: 'wornBlade', itemLevel: 1, rarity: '精良', affixes: [{ key: 'attack', value: 2, prefix: '敏锐的' }, { key: 'block', value: 3, prefix: '安稳的' }], skill: null, skillLevel: 0 };
  assert.deepEqual(itemStats(item), { attack: 3, block: 3 });
});

test('章节深度决定掉落等级，工坊可以把珍贵低阶装备升入下一档', () => {
  let early = newRun(913, 'manual');
  early = transition(early, { type: 'debug', operation: 'item', base: 'morningShears' });
  const earlyItem = early.inventory[0];
  assert.ok(earlyItem.itemLevel <= 3);
  early.gold = 1000;
  const cost = itemUpgradeCost(earlyItem);
  const upgraded = transition(early, { type: 'upgradeItem', key: earlyItem.id });
  assert.equal(upgraded.gold, 1000 - cost);
  assert.equal(itemFor(upgraded, earlyItem.id).itemLevel, 21);

  let late = newRun(914, 'manual');
  late = transition(late, { type: 'debug', operation: 'jump', stage: 5, row: 48 });
  late = transition(late, { type: 'debug', operation: 'item', base: CHAPTER_LOOT[5][0] });
  assert.ok(late.inventory[0].itemLevel >= 59);
});

test('结算奖励只把独立技能牌收入候补，且章节逐步开放技能池', () => {
  let state = newRun(915, 'manual');
  state.phase = 'reward'; state.enemy.hp = 0; state.choices = ['riposte', 'leech', 'quick'];
  const initialDeckCount = state.deck.length;
  const initialLibraryCount = state.cardLibrary.length;
  const first = transition(state, { type: 'reward', key: 'riposte' });
  assert.equal(first.deck.length, initialDeckCount);
  assert.equal(first.cardLibrary.length, initialLibraryCount + 1);
  assert.equal(card(first.cardLibrary.at(-1)).rank, skillRewardRank(state, 'riposte'));
  first.phase = 'reward'; first.enemy.hp = 0; first.choices = ['riposte', 'leech', 'quick'];
  const second = transition(first, { type: 'reward', key: 'riposte' });
  assert.equal(second.deck.length, initialDeckCount);
  assert.equal(second.cardLibrary.length, initialLibraryCount + 2);
  assert.equal(second.cardLibrary.filter(key => card(key).baseKey === 'riposte').length, 2);

  let late = newRun(916, 'manual');
  late.stage = 5; late.phase = 'combat'; late.enemy = { hp: 1, maxHp: 1, block: 0, mark: 0 }; late.hand = ['slash']; late.energy = 3;
  late = transition(late, { type: 'play', index: 0 });
  assert.ok(late.choices.every(key => REWARDS.includes(key)));
  assert.ok(late.choices.some(key => !new Set(late.cardLibrary.map(key => card(key).baseKey)).has(key)));
});

test('三名角色的核心牌均在连续两次未出现后保底', () => {
  for (const character of Object.keys(CORE_REWARDS)) {
    let state = newRun(920, 'manual', 'standard', character);
    state.coreRewardMisses = 2;
    state.phase = 'combat'; state.enemy = { hp: 1, maxHp: 1, block: 0, mark: 0 }; state.hand = ['slash']; state.energy = 3;
    state = transition(state, { type: 'play', index: 0 });
    assert.equal(state.choices.length, 3);
    assert.equal(new Set(state.choices).size, 3);
    assert.ok(state.choices.includes(CORE_REWARDS[character]));
    assert.equal(state.coreRewardMisses, 0);
  }
});

test('该该的本命卡是蜂蜜牛奶，并与其他角色使用相同保底', () => {
  let state = newRun(921, 'manual', 'standard', 'gaigai');
  state.coreRewardMisses = 2;
  state.phase = 'combat'; state.enemy = { hp: 1, maxHp: 1, block: 0, mark: 0 }; state.hand = ['slash']; state.energy = 3;
  state = transition(state, { type: 'play', index: 0 });
  assert.equal(CORE_REWARDS.gaigai, 'mend');
  assert.ok(state.choices.includes('mend'));
  assert.equal(state.coreRewardMisses, 0);
});

test('卡组按类型和同名牌分组，同名高等级排在前面', () => {
  const keys = ['guard', 'leech', 'slash', 'leech+2', 'mark', 'guard+3'];
  const sorted = [...keys].sort(compareCardKeys);
  assert.ok(sorted.indexOf('leech+2') < sorted.indexOf('leech'));
  assert.equal(sorted.indexOf('leech'), sorted.indexOf('leech+2') + 1);
  assert.ok(sorted.indexOf('slash') < sorted.indexOf('mark'));
  assert.ok(sorted.indexOf('mark') < sorted.indexOf('guard+3'));
});

test('技能掉落等级只由新旧章节与普通、精英、Boss 决定', () => {
  for (const key of REWARDS) {
    const origin = SKILL_UNLOCKS[key];
    for (let stage = origin; stage < 6; stage++) {
      const normal = newRun(930 + stage, 'manual'); normal.stage = stage;
      const expected = Math.min(10, 1 + (stage - origin) * 2);
      normal.mapRow = 1;
      assert.equal(skillRewardRank(normal, key), expected);
      normal.mapRow = 47;
      assert.equal(skillRewardRank(normal, key), expected);
      const elite = structuredClone(normal); elite.elite = true;
      assert.equal(skillRewardRank(elite, key), Math.min(10, expected + 1));
      const boss = structuredClone(normal); boss.bossFight = true;
      assert.equal(skillRewardRank(boss, key), Math.min(10, expected + 2));
    }
  }
  for (let chapter = 0; chapter < 6; chapter++) assert.ok(REWARDS.filter(key => SKILL_UNLOCKS[key] === chapter).length >= 6);
});

test('新增结构化卡牌效果的预计值与实际结算一致', () => {
  const state = enterBattle(942);
  state.enemy = { hp: 500, maxHp: 500, block: 0, mark: 4, charge: 0 };
  state.block = 20; state.energy = 9;
  for (const key of ['tideTurn', 'exposeTruth', 'silentAnswer']) {
    const current = structuredClone(state);
    current.hand = [key];
    const expected = attackPreview(current, key);
    const played = transition(current, { type: 'play', index: 0 });
    assert.equal(current.enemy.hp - played.enemy.hp, expected, key);
  }
});

test('回收牌只取回手牌空位数量且不会让其余弃牌消失', () => {
  const state = enterBattle(829);
  state.hand = ['returnedLetter', ...Array(8).fill('guard')];
  state.discard = ['slash', 'mark'];
  state.energy = 3;
  const next = transition(state, { type: 'play', index: 0 });
  assert.equal(next.hand.length, 9);
  assert.ok(next.hand.includes('mark'));
  assert.ok(next.discard.includes('slash'));
  assert.ok(next.discard.includes('returnedLetter'));
  assert.ok(next.battleLog.some(line => line.includes('取回 1 张弃牌')));
});

test('后期敌人意图依次提供蓄力、驱散、治疗压制与牌堆干扰', () => {
  const state = enterBattle(943);
  state.stage = 5; state.enemy.charge = 0;
  state.turn = 4;
  assert.equal(intent(state).kind, 'charge');
  state.enemy.charge = 33;
  assert.deepEqual(intent(state), { kind: 'chargedAttack', value: 33 });
  state.enemy.charge = 0; state.turn = 2;
  assert.equal(intent(state).kind, 'dispel');
  state.turn = 3;
  assert.equal(intent(state).kind, 'suppress');
  state.turn = 5;
  assert.equal(intent(state).kind, 'jam');
});

test('装备掉落数量符合普通、精英与 Boss 的层级范围', () => {
  const average = flags => {
    const state = newRun(944);
    Object.assign(state, flags);
    let total = 0;
    for (let index = 0; index < 10000; index++) total += equipmentDropCount(state);
    return total / 10000;
  };
  const normal = average({ elite: false, bossFight: false });
  const elite = average({ elite: true, bossFight: false });
  const boss = average({ elite: false, bossFight: true });
  assert.ok(normal > .7 && normal < .86);
  assert.ok(elite > 1.7 && elite < 1.9);
  assert.ok(boss > 2.5 && boss < 2.7);
});

test('满级技能与初级技能形成明显数值代差', () => {
  assert.equal(card('heavy+10').rank, 10);
  assert.ok(card('heavy+10').damage >= card('heavy').damage * 4);
  assert.ok(card('guard+10').block >= card('guard').block * 4);
});

test('认真倾听每两级增加弱点且每级增加护盾', () => {
  const progression = [3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
  progression.forEach((mark, index) => {
    const ranked = card(index === 0 ? 'mark' : `mark+${index + 1}`);
    assert.equal(ranked.mark, mark);
    assert.equal(ranked.block, index + 1);
    assert.equal(ranked.draw || 0, 0);
  });
});

test('每件装备都有明确的图集映射', () => {
  assert.deepEqual(new Set(Object.keys(EQUIPMENT_ART)), new Set(Object.keys(ITEMS)));
  for (const art of Object.values(EQUIPMENT_ART)) {
    assert.ok(Number.isInteger(art) ? art >= 0 && art < 48 : art.atlas === 'skill' && art.index >= 0 && art.index < 25);
  }
});

test('装备独有特性与自带技能会真实进入战斗规则', () => {
  const state = newRun(315, 'manual');
  state.inventory.push({ id: 'gear-3', base: 'morningShears', rarity: '普通', affixes: [], skill: ITEMS.morningShears.skill || null });
  state.equipment.weapon = 'gear-3';
  state.nextItemId = 4;
  const battle = transition(leaveHub(state), { type: 'node', id: 'c0r0n0' });
  battle.hand = ['slash', 'slash']; battle.energy = 3;
  assert.equal(attackPreview(battle, 'slash'), 11);
  const afterFirst = transition(battle, { type: 'play', index: 0 });
  assert.equal(attackPreview(afterFirst, 'slash'), 9);
});

test('首次战斗会显示一次简明教学，确认后不再阻塞自动战斗', () => {
  const state = enterBattle(316);
  assert.equal(state.tutorialDone, false);
  const ready = transition(state, { type: 'tutorialDone' });
  assert.equal(ready.tutorialDone, true);
  assert.deepEqual(transition(ready, { type: 'tutorialDone' }), ready);
});

test('同一地区可以掉落零到多件独立装备，装备技能会加入战斗牌组', () => {
  let state = enterBattle(310);
  state.hand = ['slash']; state.energy = 3; state.enemy.hp = 1;
  state = transition(state, { type: 'play', index: 0 });
  const firstCount = state.inventory.length;
  state.phase = 'combat'; state.enemy.hp = 1; state.enemy.maxHp = 10; state.hand = ['slash']; state.energy = 3;
  state = transition(state, { type: 'play', index: 0 });
  assert.ok(state.inventory.length >= firstCount && state.inventory.length <= firstCount + 3);

  const skillItem = state.inventory[0];
  skillItem.skill = 'mend'; skillItem.skillLevel = 4;
  state.equipment[ITEMS[skillItem.base].slot] = skillItem.id;
  state.phase = 'map'; state.mapRow = -1; state.currentNode = null; state.visited = [];
  const battle = transition(state, { type: 'node', id: 'c0r0n0' });
  assert.ok([...battle.hand, ...battle.draw].includes('mend+4~gear'));
  assert.equal(card('mend~gear').cost, 0);
  assert.equal(card('mend').cost, 1);
  const restoredBattle = restore(serialize(battle));
  assert.ok([...restoredBattle.hand, ...restoredBattle.draw].includes('mend+4~gear'));
});

test('房车工坊可以重抽随机词条并拆解闲置装备', () => {
  const state = newRun(311);
  state.gold = 100;
  state.inventory.push({ id: 'gear-3', base: 'emberCharm', rarity: '稀有', affixes: [{ key: 'attack', value: 1, prefix: '敏锐的' }], skill: 'mend' });
  state.nextItemId = 4;
  const rerolled = transition(state, { type: 'reroll', key: 'gear-3' });
  assert.equal(rerolled.gold, 58);
  assert.equal(itemFor(rerolled, 'gear-3').skill, 'mend');
  assert.equal(itemFor(rerolled, 'gear-3').affixes.length, 3);
  const salvaged = transition(rerolled, { type: 'salvage', key: 'gear-3' });
  assert.equal(salvaged.gold, 82);
  assert.equal(itemFor(salvaged, 'gear-3'), null);
});

test('房车设施提供永久成长并影响恢复与重抽费用', () => {
  let state = newRun(3111);
  state.gold = 1000;
  assert.equal(facilityCost(0), 80);
  state = transition(state, { type: 'upgradeFacility', key: 'rooms' });
  assert.equal(state.facilities.rooms, 1);
  assert.equal(state.maxHp, 76);
  state = transition(state, { type: 'upgradeFacility', key: 'workshop' });
  const rare = { id: 'gear-99', base: 'emberCharm', rarity: '稀有', affixes: [], skill: null };
  assert.ok(rerollCost(rare, state.facilities.workshop) < rerollCost(rare));
  state = transition(state, { type: 'upgradeFacility', key: 'kitchen' });
  assert.equal(state.facilities.kitchen, 1);
});

test('旅程委托按累计进度发放奖励并进入下一档', () => {
  let state = newRun(3112);
  state.victories = 12;
  const first = commissionStatus(state, 'battles');
  assert.equal(first.target, 12);
  state = transition(state, { type: 'claimCommission', key: 'battles' });
  assert.equal(state.gold, first.reward);
  assert.equal(state.commissionClaims.battles, 1);
  assert.equal(commissionStatus(state, 'battles').target, 24);
  const unchanged = transition(state, { type: 'claimCommission', key: 'battles' });
  assert.equal(unchanged, state);
});

test('完成三次客人梦境可领取一次专属传奇纪念品', () => {
  const state = newRun(312);
  state.clears[0] = 3;
  const rewarded = transition(state, { type: 'claimGuestReward', stage: 0 });
  const gift = itemFor(rewarded, rewarded.lastLoot);
  assert.equal(gift.rarity, '传奇');
  assert.ok(gift.skill);
  assert.equal(rewarded.guestRewards[0], true);
  const repeated = transition(rewarded, { type: 'claimGuestReward', stage: 0 });
  assert.equal(repeated.inventory.length, rewarded.inventory.length);
});

test('普通战斗后继续本章路线，不会提前跳章', () => {
  const state = enterBattle(13);
  state.hand = ['slash'];
  state.energy = 3;
  state.enemy.hp = 1;
  const reward = transition(state, { type: 'play', index: 0 });
  assert.equal(reward.phase, 'reward');
  assert.equal(reward.choices.length, 3);
  const map = transition(reward, { type: 'reward', key: reward.choices[0] });
  assert.equal(map.phase, 'map');
  assert.ok(map.cardLibrary.some(key => card(key).baseKey === reward.choices[0]));
  assert.equal(map.deck.length, 10);
  assert.equal(map.stage, 0);
  const nodes = buildChapterMap(0, map.mapSeed);
  const current = nodes.find(node => node.id === map.currentNode);
  const next = transition(map, { type: 'node', id: current.links[0] });
  assert.notEqual(next, map);
  assert.equal(next.stage, 0);
  assert.ok(['combat', 'mystery', 'checkpoint'].includes(next.phase));
});

test('普通节点返回房车会随机遗失一件本段获得且未装备的物品', () => {
  const state = leaveHub(newRun(130));
  const protectedItem = { id: 'gear-3', base: 'gardenLedger', rarity: '普通', affixes: [], skill: null };
  const lostItem = { id: 'gear-4', base: 'greenhouseApron', rarity: '普通', affixes: [], skill: null };
  state.inventory.push(protectedItem, lostItem);
  state.unsecuredLoot = [protectedItem.id, lostItem.id];
  state.equipment[ITEMS[protectedItem.base].slot] = protectedItem.id;
  state.mapRow = 4; state.currentNode = 'c0r4n0'; state.visited = [state.currentNode];
  const returned = transition(state, { type: 'returnHub' });
  assert.equal(returned.phase, 'hub');
  assert.ok(itemFor(returned, protectedItem.id));
  assert.equal(itemFor(returned, lostItem.id), null);
  assert.deepEqual(returned.unsecuredLoot, []);
  assert.match(returned.log[0], /遗失了本段夜程获得的/);
});

test('普通节点返回房车也可能遗失本段获得的卡牌', () => {
  const state = leaveHub(newRun(1301));
  state.deck.push('listen+2');
  state.unsecuredCards = ['listen+2'];
  state.journeyCardDrops = ['listen+2'];
  state.mapRow = 4; state.currentNode = 'c0r4n0'; state.visited = [state.currentNode];
  const returned = transition(state, { type: 'returnHub' });
  assert.equal(returned.deck.includes('listen+2'), false);
  assert.deepEqual(returned.unsecuredCards, []);
  assert.deepEqual(returned.journeyCardDrops, []);
  assert.match(returned.log[0], /遗失了本段夜程获得的技能/);
});

test('旅途中不能更换装备', () => {
  const state = leaveHub(newRun(1302));
  const originalWeapon = state.equipment.weapon;
  const replacement = { id: 'gear-3', base: 'oldPen', rarity: '普通', itemLevel: 1, affixes: [], skill: null, skillLevel: 0 };
  state.inventory.push(replacement);
  assert.equal(transition(state, { type: 'equip', key: replacement.id }), state);
  assert.equal(state.equipment.weapon, originalWeapon);
});

test('房车内可以一键装备各部位评分最高的物品', () => {
  const state = newRun(1303);
  state.inventory.push(
    { id: 'gear-3', base: 'crownBlade', rarity: '稀有', itemLevel: 21, affixes: [], skill: null, skillLevel: 0 },
    { id: 'gear-4', base: 'emberCharm', rarity: '精良', itemLevel: 12, affixes: [], skill: null, skillLevel: 0 },
  );
  state.nextItemId = 5;
  const equipped = transition(state, { type: 'equipBest' });
  assert.equal(equipped.equipment.weapon, 'gear-3');
  assert.equal(equipped.equipment.charm, 'gear-4');
  assert.equal(equipped.equipment.armor, 'gear-2');
});

test('返回房车后重新进入不会刷新当前地图', () => {
  let state = newRun(2203, 'manual', 'standard');
  state = transition(state, { type: 'depart', stage: 0 });
  const originalSeed = state.mapSeed;
  const originalMap = buildChapterMap(0, originalSeed);
  state = { ...state, mapRow: 3, currentNode: 'c0r3n0', visited: ['c0r3n0'] };
  state = transition(state, { type: 'returnHub' });
  state = transition(state, { type: 'depart', stage: 0 });
  assert.equal(state.mapSeed, originalSeed);
  assert.deepEqual(buildChapterMap(0, state.mapSeed), originalMap);
});

test('返回房车会恢复全部生命，再次启程保持满血', () => {
  let state = leaveHub(newRun(2204, 'manual', 'standard'));
  state.hp = 31;
  state.mapRow = 3; state.currentNode = 'c0r3n0'; state.visited = [state.currentNode];
  state = transition(state, { type: 'returnHub' });
  assert.equal(state.hp, state.maxHp);
  state = transition(state, { type: 'depart', stage: 0 });
  assert.equal(state.hp, state.maxHp);
});

test('未知站点结果来自完整随机池，揭晓后可以重置', () => {
  assert.deepEqual(new Set(MYSTERY_STATIONS.map(station => station.type)), new Set(['event', 'camp', 'memory', 'loadout', 'negative']));
  assert.deepEqual(Object.fromEntries(MYSTERY_STATIONS.map(station => [station.type, station.weight])), { event: 24, camp: 20, memory: 40, loadout: 6, negative: 10 });
  let state = leaveHub(newRun(2205));
  const nodes = buildChapterMap(0, state.mapSeed);
  const mystery = nodes.find(node => node.type === 'mystery');
  const parent = nodes.find(node => node.links.includes(mystery.id));
  state.mapRow = parent.row; state.currentNode = parent.id; state.visited = [parent.id];
  state = transition(state, { type: 'node', id: mystery.id });
  assert.equal(state.phase, 'mystery');
  assert.ok(MYSTERY_STATIONS.some(station => station.type === state.mysteryResult));
  state.mysteryResult = 'negative';
  state = transition(state, { type: 'mystery' });
  assert.equal(magicHouseCooldownRemaining(state, mystery.id), 15);
  const untouched = nodes.find(node => node.type === 'mystery' && node.id !== mystery.id);
  assert.equal(magicHouseCooldownRemaining(state, untouched.id), 0);
  state = transition(state, { type: 'negative', choice: 'continue' });
  assert.equal(state.phase, 'map');
  assert.equal(state.mysteryResult, null);
});

test('牌组整备站可以调整出战与候补并继续赶路', () => {
  const state = leaveHub(newRun(2205, 'manual', 'standard'));
  state.phase = 'loadout';
  state.cardLibrary.push('riposte');
  const activated = transition(state, { type: 'loadout', operation: 'activate', key: 'riposte' });
  assert.equal(activated.deck.length, 11);
  const benched = transition(activated, { type: 'loadout', operation: 'bench', key: 'riposte' });
  assert.equal(benched.deck.length, 10);
  assert.equal(transition(benched, { type: 'loadout', operation: 'bench', key: 'slash' }), benched);
  const continued = transition(benched, { type: 'leaveLoadout' });
  assert.equal(continued.phase, 'map');
});

test('房车可以永久丢弃候补卡，但不能让出战牌组低于十张', () => {
  const state = newRun(2207, 'manual', 'standard');
  const initialSlashCount = state.cardLibrary.filter(key => key === 'slash').length;
  state.cardLibrary.push('slash');
  const discardedBench = transition(state, { type: 'loadout', operation: 'discard', key: 'slash' });
  assert.equal(discardedBench.cardLibrary.filter(key => key === 'slash').length, initialSlashCount);
  assert.equal(discardedBench.deck.length, 10);
  assert.equal(transition(discardedBench, { type: 'loadout', operation: 'discard', key: 'slash' }), discardedBench);
  const expanded = structuredClone(discardedBench);
  expanded.cardLibrary.push('finalPlatform'); expanded.deck.push('finalPlatform');
  const discardedActive = transition(expanded, { type: 'loadout', operation: 'discard', key: 'finalPlatform' });
  assert.equal(discardedActive.deck.length, 10);
  assert.ok(!discardedActive.cardLibrary.includes('finalPlatform'));
});

test('旅途中的整备站不能永久丢弃卡牌', () => {
  const state = leaveHub(newRun(2208, 'manual', 'standard'));
  state.phase = 'loadout'; state.cardLibrary.push('riposte');
  assert.equal(transition(state, { type: 'loadout', operation: 'discard', key: 'riposte' }), state);
});

test('魔法屋冷却期间问号节点可以经过但不会再次抽取', () => {
  let state = leaveHub(newRun(2206));
  const nodes = buildChapterMap(0, state.mapSeed);
  const mystery = nodes.find(node => node.type === 'mystery');
  const parent = nodes.find(node => node.links.includes(mystery.id));
  state.mapRow = parent.row; state.currentNode = parent.id; state.visited = [parent.id];
  state.magicHouseCooldowns[`${state.mapSeed}:${mystery.id}`] = state.stepsTraveled + 10;
  state = transition(state, { type: 'node', id: mystery.id });
  assert.equal(state.phase, 'map');
  assert.ok(state.visited.includes(mystery.id));
  assert.equal(magicHouseCooldownRemaining(state, mystery.id), 9);
  assert.match(state.log[0], /再走 9 步/);
});

test('路标返回房车不会遗失未装备物品并恢复全部生命', () => {
  const state = leaveHub(newRun(131));
  const storedItem = { id: 'gear-3', base: 'gardenLedger', rarity: '普通', affixes: [], skill: null };
  state.inventory.push(storedItem); state.unsecuredLoot = [storedItem.id];
  state.mapRow = 9; state.checkpointRow = 9; state.currentNode = 'c0r9checkpoint'; state.visited = [state.currentNode]; state.hp = 23;
  const returned = transition(state, { type: 'returnHub' });
  assert.ok(itemFor(returned, storedItem.id));
  assert.deepEqual(returned.unsecuredLoot, []);
  assert.equal(returned.hp, returned.maxHp);
});

test('激活路标后可从房车传送回来且下一步固定进入战斗', () => {
  let state = leaveHub(newRun(132, 'manual'));
  state.mapRow = 9; state.currentNode = 'c0r9checkpoint'; state.visited = [state.currentNode]; state.phase = 'checkpoint';
  state = transition(state, { type: 'checkpoint', choice: 'rest' });
  assert.equal(state.chapterCheckpoints[0], 9);
  state = transition(state, { type: 'returnHub' });
  state = transition(state, { type: 'depart', stage: 0 });
  assert.equal(state.mapRow, 9);
  assert.equal(state.checkpointRow, 9);
  assert.equal(state.currentNode, 'c0r9checkpoint');
  assert.deepEqual(state.visited, ['c0r9checkpoint']);
  const checkpoint = buildChapterMap(0, state.mapSeed).find(node => node.id === state.currentNode);
  assert.ok(checkpoint.links.length > 0);
  const battle = transition(state, { type: 'node', id: checkpoint.links[0] });
  assert.equal(battle.phase, 'combat');
});

test('已点亮的休息站可任选传送且重新走前段不会覆盖最远路标', () => {
  let state = newRun(133, 'manual');
  state.chapterCheckpoints[0] = 29;
  state = transition(state, { type: 'depart', stage: 0, row: -1 });
  assert.equal(state.mapRow, -1);
  state = transition({ ...state, phase: 'hub' }, { type: 'depart', stage: 0, row: 9 });
  assert.equal(state.mapRow, 9);
  assert.equal(state.currentNode, 'c0r9checkpoint');
  state.phase = 'checkpoint';
  state = transition(state, { type: 'checkpoint', choice: 'rest' });
  assert.equal(state.chapterCheckpoints[0], 29);
});

test('地图只允许沿连线前进，未知站点抵达后才揭晓事件', () => {
  const state = leaveHub(newRun(19));
  assert.equal(transition(state, { type: 'node', id: 'c0boss' }), state);
  const nodes = buildChapterMap(0, state.mapSeed);
  const eventNode = nodes.find(node => node.type === 'mystery' && node.row > 0);
  const parent = nodes.find(node => node.links.includes(eventNode.id));
  state.mapRow = parent.row; state.currentNode = parent.id; state.visited = [parent.id];
  let event = transition(state, { type: 'node', id: eventNode.id });
  assert.equal(event.phase, 'mystery');
  event.mysteryResult = 'event';
  event = transition(event, { type: 'mystery' });
  assert.equal(event.phase, 'event');
  const next = transition(event, { type: 'event', choice: 'bargain' });
  assert.equal(next.phase, 'map');
  assert.equal(next.gold, state.gold + 22);
  assert.equal(next.mysteryResult, null);
});

test('六个区域每次探索五十步且每步最多三个选择', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const nodes = buildChapterMap(chapter);
    assert.equal(new Set(nodes.map(node => node.row)).size, MAP_STEPS);
    assert.ok(Math.max(...Array.from({ length: MAP_STEPS }, (_, row) => nodes.filter(node => node.row === row).length)) <= 3);
    assert.equal(nodes.filter(node => node.type === 'boss').length, 1);
    assert.ok(nodes.some(node => node.type === 'mystery'));
    assert.ok(nodes.every(node => ['battle', 'elite', 'mystery', 'checkpoint', 'boss'].includes(node.type)));
    const byId = Object.fromEntries(nodes.map(node => [node.id, node]));
    let current = nodes.find(node => node.row === 0), steps = 1;
    while (current.links.length) { current = byId[current.links[0]]; steps++; }
    assert.equal(steps, MAP_STEPS);
    assert.equal(current.type, 'boss');
  }
});

test('起点和每个路标后的第一步都固定为战斗', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const nodes = buildChapterMap(chapter, 500 + chapter);
    for (const row of [0, 10, 20, 30, 40]) {
      const choices = nodes.filter(node => node.row === row);
      assert.ok(choices.length > 0);
      assert.ok(choices.every(node => node.type === 'battle'));
    }
  }
});

test('隐藏测试面板操作不会破坏存档并可跳转路标', () => {
  let state = newRun(818, 'manual');
  state = transition(state, { type: 'debug', operation: 'gold' });
  state = transition(state, { type: 'debug', operation: 'level' });
  state = transition(state, { type: 'debug', operation: 'item', base: 'morningShears', itemLevel: 47 });
  state = transition(state, { type: 'debug', operation: 'card', key: 'mend', rank: 7 });
  state = transition(state, { type: 'debug', operation: 'upgradeCards' });
  state = transition(state, { type: 'debug', operation: 'jump', stage: 3, row: 19 });
  assert.equal(state.gold, 1000);
  assert.equal(state.level, 2);
  assert.ok(state.inventory.some(item => item.base === 'morningShears' && item.itemLevel === 47));
  assert.ok(state.cardLibrary.some(key => card(key).baseKey === 'mend' && card(key).rank >= 7));
  assert.ok(state.deck.every(key => card(key).rank > 1));
  assert.equal(state.phase, 'map');
  assert.equal(state.stage, 3);
  assert.equal(state.currentNode, 'c3r19checkpoint');
  assert.equal(state.chapterCheckpoints[3], 19);
  assert.deepEqual(restore(serialize(state)), state);
});

test('不同路线种子会生成不规则但始终可达的地图', () => {
  const first = buildChapterMap(0, 101);
  const second = buildChapterMap(0, 202);
  assert.notDeepEqual(first.map(node => [node.row, node.x, node.links]), second.map(node => [node.row, node.x, node.links]));
  assert.ok(first.some(node => node.row > 0 && node.row < 49 && node.x !== 20 && node.x !== 50 && node.x !== 80));
  for (const target of first.filter(node => node.row > 0)) {
    assert.ok(first.some(node => node.links.includes(target.id)));
  }
});

test('开局难度贯穿整局且会改变敌人强度', () => {
  const standard = newRun(55, 'manual');
  assert.equal(standard.difficulty, 'standard');
  const relaxed = newRun(55, 'manual', 'relaxed');
  assert.equal(transition(relaxed, { type: 'difficulty', difficulty: 'challenge' }).difficulty, 'relaxed');
  const standardBattle = transition(leaveHub(standard), { type: 'node', id: 'c0r0n0' });
  const relaxedBattle = transition(leaveHub(relaxed), { type: 'node', id: 'c0r0n0' });
  assert.ok(standardBattle.enemy.maxHp > relaxedBattle.enemy.maxHp);
});

test('所有难度均按卡面治疗，标准和挑战难度由护盾穿透提高压力', () => {
  const relaxed = enterBattle(551, 'manual');
  relaxed.difficulty = 'relaxed'; relaxed.hp = 40; relaxed.hand = ['mend']; relaxed.energy = 1;
  const relaxedHeal = transition(relaxed, { type: 'play', index: 0 }).hp - relaxed.hp;
  const challenge = structuredClone(relaxed);
  challenge.difficulty = 'challenge';
  const challengeHeal = transition(challenge, { type: 'play', index: 0 }).hp - challenge.hp;
  assert.equal(relaxedHeal, challengeHeal);

  relaxed.hand = []; relaxed.block = 100;
  challenge.hand = []; challenge.block = 100;
  assert.equal(transition(relaxed, { type: 'end' }).hp, relaxed.hp);
  assert.ok(transition(challenge, { type: 'end' }).hp < challenge.hp);
});

test('暖灯休息站可回满后继续或无额外收益地返回房车', () => {
  const state = leaveHub(newRun(36, 'manual'));
  state.mapRow = 8; state.currentNode = 'c0r8n1'; state.visited = [state.currentNode]; state.hp = 20;
  const checkpoint = transition(state, { type: 'node', id: 'c0r9checkpoint' });
  assert.equal(checkpoint.phase, 'checkpoint');
  const rested = transition(checkpoint, { type: 'checkpoint', choice: 'rest' });
  assert.equal(rested.phase, 'map');
  assert.equal(rested.hp, rested.maxHp);

  const returned = transition(checkpoint, { type: 'checkpoint', choice: 'returnHub' });
  assert.equal(returned.phase, 'hub');
  assert.equal(returned.chapterCheckpoints[0], 9);
  assert.equal(returned.hp, returned.maxHp);
});

test('战斗结算可以只放弃选牌并保留装备奖励', () => {
  const state = enterBattle(364);
  state.hand = ['slash']; state.energy = 3; state.enemy.hp = 1;
  const reward = transition(state, { type: 'play', index: 0 });
  const librarySize = reward.cardLibrary.length;
  const inventorySize = reward.inventory.length;
  const continued = transition(reward, { type: 'reward', key: null });
  assert.equal(continued.phase, 'map');
  assert.equal(continued.cardLibrary.length, librarySize);
  assert.equal(continued.inventory.length, inventorySize);
});

test('整理回忆站用两张同名同等级技能合成一张高一级技能', () => {
  const state = leaveHub(newRun(363, 'manual'));
  state.phase = 'memory';
  state.currentNode = 'c0r5n0';
  state.mapRow = 5;
  state.stepsTraveled = 6;
  state.deck = ['slash', 'slash', 'slash+2', 'slash+2', 'guard'];
  state.cardLibrary = [...state.deck];
  state.unsecuredCards = ['slash', 'slash'];
  state.journeyCardDrops = ['slash', 'slash'];
  const merged = transition(state, { type: 'memory', cardKey: 'slash' });
  assert.equal(merged.phase, 'map');
  assert.equal(merged.deck.length, 4);
  assert.equal(merged.deck.filter(key => key === 'slash').length, 0);
  assert.equal(merged.deck.filter(key => key === 'slash+2').length, 3);
  assert.equal(merged.cardLibrary.filter(key => key === 'slash+2').length, 3);
  assert.deepEqual(merged.unsecuredCards, ['slash+2']);
  assert.deepEqual(merged.journeyCardDrops, ['slash+2']);

  const mismatched = structuredClone(state);
  mismatched.phase = 'memory';
  mismatched.deck = ['slash', 'slash+2', 'guard'];
  mismatched.cardLibrary = [...mismatched.deck];
  assert.equal(transition(mismatched, { type: 'memory', cardKey: 'slash' }), mismatched);

  const capped = structuredClone(state);
  capped.phase = 'memory';
  capped.deck = ['slash+10', 'slash+10'];
  capped.cardLibrary = [...capped.deck];
  assert.equal(transition(capped, { type: 'memory', cardKey: 'slash+10' }), capped);
});

test('四个里程碑都可选择回满继续或回满返回房车', () => {
  assert.deepEqual(Object.keys(CHECKPOINTS).map(Number), [10, 20, 30, 40]);
  assert.equal(new Set(Object.values(CHECKPOINTS).map(stop => stop.title)).size, 4);

  const restChoices = ['rest', 'shortRest', 'cinemaRest', 'deepRest'];
  for (const [index, step] of CHECKPOINT_STEPS.entries()) {
    const base = leaveHub(newRun(360 + index, 'manual'));
    base.phase = 'checkpoint'; base.mapRow = step - 1; base.hp = 20;
    const rested = transition(base, { type: 'checkpoint', choice: restChoices[index] });
    assert.equal(rested.phase, 'map');
    assert.equal(rested.hp, rested.maxHp);

    const returned = transition(base, { type: 'checkpoint', choice: 'returnHub' });
    assert.equal(returned.phase, 'hub');
    assert.equal(returned.hp, returned.maxHp);
    assert.deepEqual(returned.inventory, base.inventory);
    assert.deepEqual(returned.cardLibrary, base.cardLibrary);
  }
});

test('战败后本局结束，不能从路标直接复活', () => {
  const state = leaveHub(newRun(361, 'manual'));
  state.mapRow = 23; state.currentNode = 'c0r23n1'; state.visited = ['c0r9checkpoint', 'c0r19checkpoint', state.currentNode];
  state.checkpointRow = 19; state.level = 3; state.hp = 0; state.phase = 'lost';
  const retried = transition(state, { type: 'retry' });
  assert.equal(retried, state);
  assert.equal(retried.phase, 'lost');
  assert.equal(retried.hp, 0);
});

test('击败区域 Boss 后返回房车并解锁下一站', () => {
  const state = leaveHub(newRun(37, 'manual'));
  const originalMapSeed = state.mapSeed;
  state.mapRow = 48; state.currentNode = 'c0r48n1'; state.visited = ['c0r48n1'];
  const boss = transition(state, { type: 'node', id: 'c0boss' });
  assert.equal(boss.bossFight, true);
  boss.enemy.hp = 1; boss.hand = ['slash']; boss.energy = 3;
  const reward = transition(boss, { type: 'play', index: 0 });
  const hub = transition(reward, { type: 'reward', key: reward.choices[0] });
  assert.equal(hub.phase, 'hub');
  assert.equal(hub.unlocked, 1);
  assert.equal(hub.stage, 1);
  assert.equal(hub.clears[0], 1);
  assert.equal(hub.mapRow, -1);
  assert.deepEqual(hub.visited, []);
  assert.notEqual(hub.mapSeed, originalMapSeed);
});

test('已通关区域可以反复探索并累计次数', () => {
  let state = newRun(41, 'manual');
  for (let run = 0; run < 2; run++) {
    state = leaveHub(state, 0);
    state.mapRow = 48; state.currentNode = 'c0r48n1'; state.visited = [state.currentNode];
    state = transition(state, { type: 'node', id: 'c0boss' });
    state.enemy.hp = 1; state.hand = ['slash']; state.energy = 3;
    state = transition(state, { type: 'play', index: 0 });
    state = transition(state, { type: 'reward', key: state.choices[0] });
  }
  assert.equal(state.phase, 'hub');
  assert.equal(state.clears[0], 2);
  assert.equal(state.unlocked, 1);
  assert.equal(state.victories, 2);
});

test('存档可恢复，异常存档会被拒绝', () => {
  const state = newRun(17);
  assert.deepEqual(restore(serialize(state)), state);
  const oldState = structuredClone(state);
  oldState.version = 8;
  delete oldState.guestRewards;
  assert.equal(restore(serialize(oldState)), null);
  const deepState = leaveHub(newRun(171));
  deepState.mapRow = 19; deepState.currentNode = 'c0r19checkpoint'; deepState.visited = ['c0r9checkpoint', 'c0r19checkpoint'];
  assert.deepEqual(restore(serialize(deepState)), deepState);
  assert.equal(restore('{"version":999}'), null);
  assert.equal(restore('not-json'), null);
});
