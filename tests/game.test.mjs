import assert from 'node:assert/strict';
import test from 'node:test';
import { CARDS, CHARACTERS, CHAPTER_LOOT, CHECKPOINTS, CORE_REWARDS, DIFFICULTIES, ENCOUNTERS, ENEMIES, EQUIPMENT_ART, ITEMS, MAP_STEPS, attackPreview, buildChapterMap, card, chooseAutoCard, commissionStatus, enemyFor, equipmentStats, facilityCost, itemBaseStats, itemFor, itemStats, itemTier, itemUpgradeCost, memoryCooldownRemaining, newRun, rerollCost, restore, serialize, skillRewardRank, transition } from '../src/game.mjs';

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
  assert.ok(next.hp < state.hp || next.enemy.block > 0);
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

test('大叔每回合首次发现弱点会额外抽牌', () => {
  const state = enterBattle(81);
  state.hand = ['mark', 'mark']; state.draw = ['slash', 'guard']; state.energy = 3;
  const first = transition(state, { type: 'play', index: 0 });
  assert.equal(first.hand.length, 2);
  assert.equal(first.traitUsed, true);
  const second = transition(first, { type: 'play', index: 0 });
  assert.equal(second.hand.length, 1);
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

test('该该把溢出治疗转为暖意并追加到下一次攻击', () => {
  const state = transition(leaveHub(newRun(82, 'manual', 'standard', 'gaigai')), { type: 'node', id: 'c0r0n0' });
  state.hp = state.maxHp - 1; state.hand = ['mend', 'slash']; state.energy = 3; state.enemy.hp = 100; state.enemy.maxHp = 100;
  const healed = transition(state, { type: 'play', index: 0 });
  assert.equal(healed.warmth, Math.round(card('mend').heal * DIFFICULTIES.standard.healing) - 1);
  const expected = attackPreview(healed, 'slash');
  const attacked = transition(healed, { type: 'play', index: 0 });
  assert.equal(100 - attacked.enemy.hp, expected);
  assert.equal(attacked.warmth, 0);
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

test('胜利获得经验、升级并掉落装备', () => {
  const state = enterBattle(31);
  state.xp = 44;
  state.hand = ['slash']; state.energy = 3; state.enemy.hp = 1;
  const reward = transition(state, { type: 'play', index: 0 });
  assert.equal(reward.level, 2);
  assert.equal(reward.maxHp, 76);
  assert.ok(reward.lastLoot);
  assert.ok(CHAPTER_LOOT[0].includes(itemFor(reward, reward.lastLoot).base));
  assert.ok(['weapon', 'armor', 'bag', 'scarf', 'charm', 'decor'].includes(ITEMS[itemFor(reward, reward.lastLoot).base].slot));
  assert.ok(reward.journeyNewItems.includes(reward.lastLoot));
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

test('结算奖励只新增技能牌且优先提供未拥有技能，章节逐步开放技能池', () => {
  let state = newRun(915, 'manual');
  state.phase = 'reward'; state.enemy.hp = 0; state.choices = ['riposte', 'leech', 'quick'];
  const initialCount = state.deck.length;
  const first = transition(state, { type: 'reward', key: 'riposte' });
  assert.equal(first.deck.length, initialCount + 1);
  assert.equal(card(first.deck.at(-1)).rank, skillRewardRank(state, 'riposte'));
  first.phase = 'reward'; first.enemy.hp = 0; first.choices = ['riposte', 'leech', 'quick'];
  const second = transition(first, { type: 'reward', key: 'riposte' });
  assert.equal(second.deck.length, initialCount + 2);
  assert.equal(second.deck.filter(key => card(key).baseKey === 'riposte').length, 2);

  let late = newRun(916, 'manual');
  late.stage = 5; late.phase = 'combat'; late.enemy = { hp: 1, maxHp: 1, block: 0, mark: 0 }; late.hand = ['slash']; late.energy = 3;
  late = transition(late, { type: 'play', index: 0 });
  assert.ok(late.choices.every(key => ['mark', 'riposte', 'leech', 'quick', 'fortify', 'nova', 'tea', 'listen', 'nightRide', 'echo', 'postcard', 'photoAlbum', 'unsent', 'risk', 'kitchenLight', 'stayAwhile', 'lucidDoor', 'mend', 'blanket', 'morningCall', 'goodnight'].includes(key)));
  assert.ok(late.choices.some(key => !new Set(late.deck.map(key => card(key).baseKey)).has(key)));
});

test('角色核心牌进入流派成长位且连续四次未出现后保底', () => {
  for (const character of Object.keys(CORE_REWARDS)) {
    let state = newRun(920, 'manual', 'standard', character);
    state.coreRewardMisses = 4;
    state.phase = 'combat'; state.enemy = { hp: 1, maxHp: 1, block: 0, mark: 0 }; state.hand = ['slash']; state.energy = 3;
    state = transition(state, { type: 'play', index: 0 });
    assert.equal(state.choices.length, 3);
    assert.equal(new Set(state.choices).size, 3);
    assert.ok(state.choices.includes(CORE_REWARDS[character]));
    assert.equal(state.coreRewardMisses, 0);
  }
});

test('技能掉落等级按章节基础和章内路段统一递进', () => {
  const keys = ['riposte', 'leech', 'quick', 'fortify', 'nova', 'tea', 'listen', 'nightRide'];
  const segmentOffsets = [[0, 0], [0, 1], [0, 2], [1, 2], [1, 2]];
  for (let stage = 0; stage < 6; stage++) {
    const baseRank = stage + 1;
    for (let segment = 0; segment < 5; segment++) {
      const state = newRun(930 + stage, 'manual');
      state.stage = stage; state.mapRow = segment * 10 + 2;
      for (const key of keys) {
        const rank = skillRewardRank(state, key);
        assert.ok(rank >= baseRank + segmentOffsets[segment][0]);
        assert.ok(rank <= baseRank + segmentOffsets[segment][1]);
        assert.equal(skillRewardRank(state, key), rank);
      }
    }
  }
  const opening = newRun(940, 'manual');
  opening.stage = 0; opening.mapRow = 0; opening.elite = true;
  assert.ok(keys.every(key => skillRewardRank(opening, key) === 1));
  const boss = newRun(941, 'manual');
  boss.stage = 5; boss.mapRow = 49; boss.bossFight = true;
  assert.ok(keys.every(key => skillRewardRank(boss, key) === 8));
});

test('满级技能与初级技能形成明显数值代差', () => {
  assert.equal(card('heavy+10').rank, 10);
  assert.ok(card('heavy+10').damage >= card('heavy').damage * 4);
  assert.ok(card('guard+10').block >= card('guard').block * 4);
});

test('认真倾听以弱点和抽牌交替成长', () => {
  const progression = [
    [2, 0], [3, 0], [4, 0], [5, 0], [5, 1],
    [6, 1], [7, 1], [7, 2], [8, 2], [9, 2],
  ];
  progression.forEach(([mark, draw], index) => {
    const ranked = card(index === 0 ? 'mark' : `mark+${index + 1}`);
    assert.equal(ranked.mark, mark);
    assert.equal(ranked.draw || 0, draw);
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

test('同一地区可以反复掉落独立装备，装备技能会加入战斗牌组', () => {
  let state = enterBattle(310);
  state.hand = ['slash']; state.energy = 3; state.enemy.hp = 1;
  state = transition(state, { type: 'play', index: 0 });
  const firstId = state.lastLoot;
  const firstCount = state.inventory.length;
  state.phase = 'combat'; state.enemy.hp = 1; state.enemy.maxHp = 10; state.hand = ['slash']; state.energy = 3;
  state = transition(state, { type: 'play', index: 0 });
  assert.equal(state.inventory.length, firstCount + 1);
  assert.notEqual(state.lastLoot, firstId);

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
  assert.ok(map.deck.some(key => card(key).baseKey === reward.choices[0]));
  assert.ok(map.deck.length >= 10 && map.deck.length <= 11);
  assert.equal(map.stage, 0);
  const nodes = buildChapterMap(0, map.mapSeed);
  const current = nodes.find(node => node.id === map.currentNode);
  const next = transition(map, { type: 'node', id: current.links[0] });
  assert.notEqual(next, map);
  assert.equal(next.stage, 0);
  assert.ok(['combat', 'camp', 'memory', 'event', 'checkpoint'].includes(next.phase));
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

test('路标返回房车不会遗失未装备物品', () => {
  const state = leaveHub(newRun(131));
  const storedItem = { id: 'gear-3', base: 'gardenLedger', rarity: '普通', affixes: [], skill: null };
  state.inventory.push(storedItem); state.unsecuredLoot = [storedItem.id];
  state.mapRow = 9; state.checkpointRow = 9; state.currentNode = 'c0r9checkpoint'; state.visited = [state.currentNode];
  const returned = transition(state, { type: 'returnHub' });
  assert.ok(itemFor(returned, storedItem.id));
  assert.deepEqual(returned.unsecuredLoot, []);
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

test('地图只允许沿连线前进，事件选择会返回地图', () => {
  const state = leaveHub(newRun(19));
  assert.equal(transition(state, { type: 'node', id: 'c0boss' }), state);
  const nodes = buildChapterMap(0, state.mapSeed);
  const eventNode = nodes.find(node => node.type === 'event' && node.row > 0);
  const parent = nodes.find(node => node.links.includes(eventNode.id));
  state.mapRow = parent.row; state.currentNode = parent.id; state.visited = [parent.id];
  const event = transition(state, { type: 'node', id: eventNode.id });
  assert.equal(event.phase, 'event');
  const next = transition(event, { type: 'event', choice: 'bargain' });
  assert.equal(next.phase, 'map');
  assert.equal(next.gold, state.gold + 22);
});

test('六个区域每次探索五十步且每步最多三个选择', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const nodes = buildChapterMap(chapter);
    assert.equal(new Set(nodes.map(node => node.row)).size, MAP_STEPS);
    assert.ok(Math.max(...Array.from({ length: MAP_STEPS }, (_, row) => nodes.filter(node => node.row === row).length)) <= 3);
    assert.equal(nodes.filter(node => node.type === 'boss').length, 1);
    assert.ok(nodes.some(node => node.type === 'camp'));
    assert.ok(nodes.some(node => node.type === 'memory'));
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
  assert.ok(state.deck.some(key => card(key).baseKey === 'mend' && card(key).rank >= 7));
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

test('标准和挑战难度会降低治疗并让部分伤害穿透护盾', () => {
  const relaxed = enterBattle(551, 'manual');
  relaxed.difficulty = 'relaxed'; relaxed.hp = 40; relaxed.hand = ['mend']; relaxed.energy = 1;
  const relaxedHeal = transition(relaxed, { type: 'play', index: 0 }).hp - relaxed.hp;
  const challenge = structuredClone(relaxed);
  challenge.difficulty = 'challenge';
  const challengeHeal = transition(challenge, { type: 'play', index: 0 }).hp - challenge.hp;
  assert.ok(relaxedHeal > challengeHeal);

  relaxed.hand = []; relaxed.block = 100;
  challenge.hand = []; challenge.block = 100;
  assert.equal(transition(relaxed, { type: 'end' }).hp, relaxed.hp);
  assert.ok(transition(challenge, { type: 'end' }).hp < challenge.hp);
});

test('暖灯休息站可恢复继续或打包热饮返回房车', () => {
  const state = leaveHub(newRun(36, 'manual'));
  state.mapRow = 8; state.currentNode = 'c0r8n1'; state.visited = [state.currentNode]; state.hp = 20;
  const checkpoint = transition(state, { type: 'node', id: 'c0r9checkpoint' });
  assert.equal(checkpoint.phase, 'checkpoint');
  const rested = transition(checkpoint, { type: 'checkpoint', choice: 'rest' });
  assert.equal(rested.phase, 'map');
  assert.ok(rested.hp > checkpoint.hp);

  const packed = transition(checkpoint, { type: 'checkpoint', choice: 'hotDrink' });
  assert.equal(packed.phase, 'hub');
  assert.equal(packed.hotDrinkBattles, 3);
  assert.equal(packed.chapterCheckpoints[0], 9);
  assert.equal(packed.hp, packed.maxHp);
});

test('整理回忆站用两张同名同等级技能合成一张高一级技能', () => {
  const state = leaveHub(newRun(363, 'manual'));
  state.phase = 'memory';
  state.currentNode = 'c0r5n0';
  state.mapRow = 5;
  state.stepsTraveled = 6;
  state.deck = ['slash', 'slash', 'slash+2', 'slash+2', 'guard'];
  state.unsecuredCards = ['slash', 'slash'];
  state.journeyCardDrops = ['slash', 'slash'];
  const merged = transition(state, { type: 'memory', cardKey: 'slash' });
  assert.equal(merged.phase, 'map');
  assert.equal(merged.deck.length, 4);
  assert.equal(merged.deck.filter(key => key === 'slash').length, 0);
  assert.equal(merged.deck.filter(key => key === 'slash+2').length, 3);
  assert.deepEqual(merged.unsecuredCards, ['slash+2']);
  assert.deepEqual(merged.journeyCardDrops, ['slash+2']);
  assert.equal(memoryCooldownRemaining(merged, state.currentNode), 15);
  assert.equal(memoryCooldownRemaining({ ...merged, stepsTraveled: 16 }, state.currentNode), 5);

  const mismatched = structuredClone(state);
  mismatched.phase = 'memory';
  mismatched.deck = ['slash', 'slash+2', 'guard'];
  assert.equal(transition(mismatched, { type: 'memory', cardKey: 'slash' }), mismatched);

  const capped = structuredClone(state);
  capped.phase = 'memory';
  capped.deck = ['slash+10', 'slash+10'];
  assert.equal(transition(capped, { type: 'memory', cardKey: 'slash+10' }), capped);
});

test('四个里程碑拥有不同功能和实际结算', () => {
  assert.deepEqual(Object.keys(CHECKPOINTS).map(Number), [10, 20, 30, 40]);
  assert.equal(new Set(Object.values(CHECKPOINTS).map(stop => stop.title)).size, 4);

  const shop = leaveHub(newRun(360, 'manual'));
  shop.phase = 'checkpoint'; shop.mapRow = 19; shop.hp = 40;
  shop.inventory.push({ id: 'gear-3', base: 'emberCharm', itemLevel: 4, rarity: '普通', affixes: [], skill: null, skillLevel: 0 });
  shop.nextItemId = 4;
  const traded = transition(shop, { type: 'checkpoint', choice: 'tradeGear' });
  assert.equal(traded.phase, 'hub');
  assert.equal(traded.inventory.find(item => item.id === 'gear-3').rarity, '精良');

  const cinema = leaveHub(newRun(361, 'manual'));
  cinema.phase = 'checkpoint'; cinema.mapRow = 29; cinema.hp = 20;
  const cinemaRest = transition(cinema, { type: 'checkpoint', choice: 'cinemaRest' });
  assert.equal(cinemaRest.phase, 'map');
  assert.ok(cinemaRest.hp > cinema.hp);
  const upgraded = transition(cinema, { type: 'checkpoint', choice: 'upgradeLowestCard' });
  assert.equal(upgraded.phase, 'hub');
  assert.equal(upgraded.deck.length, cinema.deck.length);
  assert.ok(upgraded.deck.some(key => key === 'slash+2'));

  const finale = leaveHub(newRun(362, 'manual'));
  finale.phase = 'checkpoint'; finale.mapRow = 39;
  const prepared = transition(finale, { type: 'checkpoint', choice: 'emergencyLight' });
  assert.equal(prepared.phase, 'hub');
  assert.equal(prepared.emergencyLight, true);
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
  const hub = transition(reward, { type: 'reward', key: null });
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
    state = transition(state, { type: 'reward', key: null });
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
  assert.deepEqual(restore(serialize(oldState)).guestRewards, [false, false, false, false, false, false]);
  const deepState = leaveHub(newRun(171));
  deepState.mapRow = 19; deepState.currentNode = 'c0r19checkpoint'; deepState.visited = ['c0r9checkpoint', 'c0r19checkpoint'];
  assert.deepEqual(restore(serialize(deepState)), deepState);
  const versionNine = structuredClone(deepState);
  versionNine.version = 9; versionNine.currentNode = 'c0r19n1'; versionNine.visited = ['c0r9n0', 'c0r19n1'];
  assert.equal(restore(serialize(versionNine)).currentNode, 'c0r19checkpoint');
  const threeSlotSave = structuredClone(state);
  threeSlotSave.version = 18;
  threeSlotSave.equipment = { weapon: 'gear-1', armor: 'gear-2', charm: null };
  assert.deepEqual(Object.keys(restore(serialize(threeSlotSave)).equipment), ['weapon', 'armor', 'bag', 'scarf', 'charm', 'decor']);
  const versionTwentyOne = structuredClone(state);
  versionTwentyOne.version = 21; delete versionTwentyOne.unsecuredLoot;
  assert.deepEqual(restore(serialize(versionTwentyOne)).unsecuredLoot, []);
  const versionTwentyTwo = structuredClone(state);
  versionTwentyTwo.version = 22; versionTwentyTwo.stage = 2; versionTwentyTwo.checkpointRow = 19; delete versionTwentyTwo.chapterCheckpoints;
  assert.equal(restore(serialize(versionTwentyTwo)).chapterCheckpoints[2], 19);
  const versionTwentyThree = structuredClone(state);
  versionTwentyThree.version = 23;
  for (const item of versionTwentyThree.inventory) { delete item.itemLevel; delete item.skillLevel; }
  const migratedProgression = restore(serialize(versionTwentyThree));
  assert.ok(migratedProgression.inventory.every(item => item.itemLevel >= 1 && item.skillLevel === 0));
  const versionTwentyFour = structuredClone(state);
  versionTwentyFour.version = 24; delete versionTwentyFour.journeyNewItems; delete versionTwentyFour.journeyNewCards;
  const migratedNewLabels = restore(serialize(versionTwentyFour));
  assert.deepEqual(migratedNewLabels.journeyNewItems, []);
  assert.deepEqual(migratedNewLabels.journeyNewCards, []);
  const versionTwentySix = structuredClone(state);
  versionTwentySix.version = 26; delete versionTwentySix.unsecuredCards; delete versionTwentySix.journeyCardDrops;
  const migratedJourneyCards = restore(serialize(versionTwentySix));
  assert.deepEqual(migratedJourneyCards.unsecuredCards, []);
  assert.deepEqual(migratedJourneyCards.journeyCardDrops, []);
  const versionTwentySeven = structuredClone(state);
  versionTwentySeven.version = 27; delete versionTwentySeven.coreRewardMisses;
  assert.equal(restore(serialize(versionTwentySeven)).coreRewardMisses, 0);
  assert.equal(restore('{"version":999}'), null);
  assert.equal(restore('not-json'), null);
});
