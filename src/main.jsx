import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, Backpack, BookOpen, Check, CircleHelp, Coins, Crown, Flame, Gem, Heart,
  House, Lock, MapPin, Menu, Moon, PackageOpen, Shield, Shirt,
  Sparkles, Swords, Target, TentTree, TrendingUp, Wind, Wrench, X,
} from 'lucide-react';
import {
  CHECKPOINTS, CHECKPOINT_STEPS, CHAPTER_LOOT, CHAPTERS, DIFFICULTIES, ENEMIES, GUESTS, ITEMS, SAVE_KEY, SEGMENT_NAMES, SLOT_LABELS, attackPreview, card,
  chapterMap, chooseAutoCard, commissionStatus, description, enemyFor, equipmentStats, facilityCost, intent, itemFor, itemLines, MAP_STEPS,
  itemName, itemScore, newRun, rerollCost, restore, salvageValue, serialize, transition,
} from './game.mjs';
import './styles.css';
import camperPixel from './assets/pixel/runtime/camper.webp';
import chapter0 from './assets/pixel/runtime/chapter-0.webp';
import chapter1 from './assets/pixel/runtime/chapter-1.webp';
import chapter2 from './assets/pixel/runtime/chapter-2.webp';
import chapter3 from './assets/pixel/runtime/chapter-3.webp';
import chapter4 from './assets/pixel/runtime/chapter-4.webp';
import chapter5 from './assets/pixel/runtime/chapter-5.webp';
import enemiesFlower from './assets/pixel/runtime/enemies-flower.webp';
import enemiesRain from './assets/pixel/runtime/enemies-rain.webp';
import enemiesBooks from './assets/pixel/runtime/enemies-books.webp';
import enemiesCoast from './assets/pixel/runtime/enemies-coast.webp';
import enemiesMarket from './assets/pixel/runtime/enemies-market.webp';
import enemiesTerminal from './assets/pixel/runtime/enemies-terminal.webp';
import dreamCreatures from './assets/pixel/runtime/dream-creatures.webp';
import equipmentAtlas from './assets/pixel/runtime/equipment-atlas.webp';
import skillAtlas from './assets/pixel/runtime/skill-atlas.webp';

const PIXEL_BACKGROUNDS = [chapter0, chapter1, chapter2, chapter3, chapter4, chapter5];
const PIXEL_ENEMIES = [enemiesFlower, enemiesRain, enemiesBooks, enemiesCoast, enemiesMarket, enemiesTerminal];
const CARD_KEYS = ['slash', 'guard', 'mark', 'heavy', 'focus', 'riposte', 'leech', 'quick', 'nova', 'fortify', 'echo', 'mend', 'risk', 'tea', 'listen', 'postcard', 'blanket', 'nightRide', 'kitchenLight', 'unsent', 'photoAlbum', 'morningCall', 'stayAwhile', 'lucidDoor', 'goodnight'];

function atlasStyle(image, index, columns, rows) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${column * 100 / Math.max(1, columns - 1)}% ${row * 100 / Math.max(1, rows - 1)}%`,
  };
}

function cardAtlasStyle(cardKey) {
  return atlasStyle(skillAtlas, Math.max(0, CARD_KEYS.indexOf(cardKey.replace('+', ''))), 5, 5);
}

function gearAtlasStyle(baseKey) {
  for (let row = 0; row < CHAPTER_LOOT.length; row += 1) {
    const column = CHAPTER_LOOT[row].indexOf(baseKey);
    if (column >= 0) return atlasStyle(equipmentAtlas, row * 8 + column, 8, 6);
  }
  return null;
}

function enemySpriteProps(state) {
  if (state.bossFight) return { className: 'sprite-frame-3', style: { backgroundImage: `url(${PIXEL_ENEMIES[state.stage]})` } };
  const art = enemyFor(state).art || 0;
  const column = art % 4;
  const row = Math.floor(art / 4);
  return {
    className: 'creature-sprite',
    style: {
      backgroundImage: `url(${dreamCreatures})`,
      backgroundSize: '400% 400%',
      backgroundPosition: `${column * 100 / 3}% ${row * 100 / 3}%`,
    },
  };
}

const ICONS = { sword: Swords, swords: Swords, shield: Shield, target: Target, sparkles: Sparkles, heart: Heart, wind: Wind, moon: Moon, flame: Flame };
const INTENTS = {
  attack: move => `造成 ${move.value}${move.hits ? ` × ${move.hits}` : ''} 伤害`,
  guard: move => `获得 ${move.value} 护盾`,
  curse: move => `造成 ${move.value} 伤害 · 虚弱`,
};
const capturePress = event => {
  if (event.currentTarget.setPointerCapture && Number.isInteger(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
};
const handleSegmentFrame = (event, values, onSelect) => {
  if (event.target instanceof Element && event.target.closest('button')) return;
  const frame = event.currentTarget.querySelector('.mode-switch, .difficulty-switch') || event.currentTarget;
  const rect = frame.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(.999, (event.clientX - rect.left) / rect.width));
  onSelect(values[Math.floor(ratio * values.length)]);
};

const TooltipContext = React.createContext({ show: () => {}, close: () => {}, open: false });

function TooltipProvider({ children }) {
  const [tip, setTip] = useState(null);
  const timer = useRef(null);
  const close = () => {
    window.clearTimeout(timer.current);
    setTip(null);
  };
  const show = (text, event) => {
    window.clearTimeout(timer.current);
    const source = event?.currentTarget?.getBoundingClientRect?.();
    const rawX = event?.clientX || (source ? source.left + source.width / 2 : window.innerWidth / 2);
    const rawY = event?.clientY || (source ? source.top + source.height / 2 : window.innerHeight / 2);
    const halfWidth = Math.min(180, (window.innerWidth - 24) / 2);
    const x = Math.max(halfWidth + 12, Math.min(window.innerWidth - halfWidth - 12, rawX));
    const below = rawY < 150;
    const y = Math.max(16, Math.min(window.innerHeight - 16, rawY));
    setTip({ text, x, y, below });
    timer.current = window.setTimeout(close, 4200);
  };
  useEffect(() => {
    const dismiss = event => {
      if (!event.target.closest?.('.info-trigger, .info-toast')) close();
    };
    document.addEventListener('pointerdown', dismiss, true);
    return () => { window.clearTimeout(timer.current); document.removeEventListener('pointerdown', dismiss, true); };
  }, []);
  return <TooltipContext.Provider value={{ show, close, open: Boolean(tip) }}>{children}{tip && <button className={`info-toast ${tip.below ? 'below' : 'above'}`} style={{ left: `${tip.x}px`, top: `${tip.y}px` }} onClick={close}><CircleHelp />{tip.text}<X /></button>}</TooltipContext.Provider>;
}

function Tip({ text, children, className = '' }) {
  const { show } = React.useContext(TooltipContext);
  return <button type="button" className={`info-trigger ${className}`} onClick={event => show(text, event)}>{children}</button>;
}

function Bar({ value, max, tone = 'health' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className={`bar ${tone}`}><span style={{ width: `${pct}%` }} /></div>;
}

function ValueFloaters({ items }) {
  return <div className="value-floaters" aria-live="polite">{items.map(item => <span key={item.key} className={item.value >= 0 ? 'gain' : 'loss'}>{item.label} {item.value > 0 ? '+' : ''}{item.value}</span>)}</div>;
}

const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function BattleLogLine({ text, enemyName }) {
  const enemyPattern = enemyName ? `|${escapePattern(enemyName)}` : '';
  const tokens = text.split(new RegExp(`(「[^」]+」|\\d+(?:\\/\\d+)?|你|店主${enemyPattern})`, 'g'));
  return tokens.map((token, index) => {
    if (!token) return null;
    if (/^「[^」]+」$/.test(token)) return <strong className="log-skill" key={index}>{token}</strong>;
    if (/^\d+(?:\/\d+)?$/.test(token)) return <strong className="log-number" key={index}>{token}</strong>;
    if (token === '你' || token === '店主') return <strong className="log-player" key={index}>{token}</strong>;
    if (token === enemyName) return <strong className="log-enemy" key={index}>{token}</strong>;
    return token;
  });
}

function CardView({ cardKey, onClick, disabled = false, preview = 0, compact = false, active = false }) {
  const c = card(cardKey);
  const Icon = ICONS[c.icon] || Sparkles;
  return (
    <button className={`game-card ${c.type} ${compact ? 'compact' : ''} ${active ? 'auto-active' : ''} ${onClick ? '' : 'read-only'}`} onClick={onClick} disabled={disabled}>
      <span className="card-cost">{c.cost}</span>
      <span className="card-school">{c.school}</span>
      <span className="card-art pixel-art" style={cardAtlasStyle(cardKey)}><i className="card-category"><Icon size={compact ? 12 : 14} strokeWidth={1.8} /></i></span>
      <strong>{c.name}</strong>
      <span className="card-rule">{description(cardKey).join('。')}。</span>
      {preview > 0 && <span className="card-preview">预计伤害 {preview}</span>}
      <em>{c.flavor}</em>
    </button>
  );
}

function JourneySetup({ onBack, onStart }) {
  const [mode, setMode] = useState('auto');
  const [difficulty, setDifficulty] = useState('standard');
  return <main className="journey-setup">
    <div className="splash-art camper-art" style={{ backgroundImage: `url(${camperPixel})` }} />
    <div className="setup-shade" />
    <button className="icon-button setup-back" onPointerDown={capturePress} onClick={onBack} aria-label="返回开场"><ArrowLeft /></button>
    <section className="setup-copy">
      <span className="eyebrow">NEW JOURNEY</span>
      <h1>准备启程</h1>
      <p>选择本次旅程的出牌方式与难度。</p>
      <div className="splash-settings">
        <div className="setting-group" onClick={event => handleSegmentFrame(event, ['auto', 'manual'], setMode)}><small>出牌方式</small><div className="mode-switch" aria-label="出牌方式">
          <button className={mode === 'auto' ? 'active' : ''} onPointerDown={capturePress} onClick={() => setMode('auto')}><Sparkles />自动出牌</button>
          <button className={mode === 'manual' ? 'active' : ''} onPointerDown={capturePress} onClick={() => setMode('manual')}><Swords />手动出牌</button>
        </div></div>
        <div className="setting-group" onClick={event => handleSegmentFrame(event, Object.keys(DIFFICULTIES), setDifficulty)}><small>旅程难度</small><div className="difficulty-switch" aria-label="旅程难度">
          {Object.entries(DIFFICULTIES).map(([key, item]) => <button key={key} className={difficulty === key ? 'active' : ''} onPointerDown={capturePress} onClick={() => setDifficulty(key)}>{item.name}</button>)}
        </div></div>
      </div>
      <button className="primary setup-start" onPointerDown={capturePress} onClick={() => onStart(mode, difficulty)}><Moon />进入房车</button>
    </section>
  </main>;
}

function Splash({ saved, onNew, onContinue }) {
  const [configuring, setConfiguring] = useState(false);
  if (configuring) return <JourneySetup onBack={() => setConfiguring(false)} onStart={onNew} />;
  return (
    <main className="splash">
      <div className="splash-art camper-art" style={{ backgroundImage: `url(${camperPixel})` }} />
      <div className="splash-shade" />
      <section className="splash-copy">
        <span className="eyebrow">TRAVELING HOTEL · CARD RPG</span>
        <h1>下一站，晚安</h1>
        <p>驾驶一辆会变成旅店的房车。白天沿途旅行，夜晚进入客人的梦。</p>
        <div className="splash-actions">
          {saved && <button className="primary" onPointerDown={capturePress} onClick={onContinue}>继续旅程</button>}
          <button className={saved ? 'secondary' : 'primary'} onPointerDown={capturePress} onClick={() => setConfiguring(true)}><Sparkles size={18} />开始新旅程</button>
        </div>
      </section>
    </main>
  );
}

function CamperHub({ state, dispatch, onDrawer, onWorkshop, onGuests }) {
  const [selected, setSelected] = useState(Math.min(state.stage, state.unlocked));
  const destination = CHAPTERS[selected];
  const bagUnlocked = state.victories > 0 || state.inventory.length > 2;
  const workshopUnlocked = state.stepsTraveled >= 10 || state.inventory.length >= 5;
  const guestsUnlocked = state.clears.some(count => count > 0);
  const actionCount = Number(bagUnlocked) + Number(workshopUnlocked) + Number(guestsUnlocked);
  return <main className="camper-hub">
    <div className="hub-background" style={{ backgroundImage: `url(${camperPixel})` }} />
    <div className="hub-shade" />
    <header className="hub-topbar">
      <div><Tip text="DAY 表示本次旅程累计完成的战斗数；黄昏是进入梦境前的房车时间。"><span className="eyebrow">DAY {state.victories + 1} · 黄昏</span></Tip><strong>晚安旅行屋</strong></div>
      <div className="hub-resources"><Tip text="生命归零时本局直接结束，需要重新开始旅程。"><span><Heart />{state.hp}/{state.maxHp}</span></Tip><Tip text="旅币用于工坊重抽属性、升级房车和旅途交易。"><span><Coins />{state.gold}</span></Tip></div>
      {bagUnlocked ? <button className="icon-button" onPointerDown={capturePress} onClick={onDrawer} aria-label="打开装备与背包"><Menu /></button> : <span />}
    </header>
    <section className="hub-copy">
      <span className="eyebrow">今晚停靠在</span>
      <h1>{destination.name}</h1>
      <p>{destination.weather} · {destination.subtitle}</p>
      <button className="depart-button" onPointerDown={capturePress} onClick={() => dispatch({ type: 'depart', stage: selected })}><Moon />入夜探索梦境</button>
      <small>50 步夜程 · 每 10 步停靠路标 · 首领掉落区域专属装备</small>
    </section>
    <nav className="destination-strip" aria-label="选择目的地">
      {CHAPTERS.map((chapter, index) => {
        const locked = index > state.unlocked;
        return <button key={chapter.name} className={selected === index ? 'active' : ''} disabled={locked} onPointerDown={capturePress} onClick={() => setSelected(index)} style={{ '--destination': chapter.color }}>
          <span>{locked ? <Lock /> : <MapPin />}</span><b>{chapter.name}</b><small>{locked ? '完成上一站后解锁' : state.clears[index] ? `已探索 ${state.clears[index]} 次` : '新目的地'}</small>
        </button>;
      })}
    </nav>
    {actionCount > 0 && <div className="hub-actions" style={{ '--action-count': actionCount }}>
      {bagUnlocked && <button className={state.victories === 1 ? 'feature-new' : ''} onPointerDown={capturePress} onClick={onDrawer}><PackageOpen /><span><b>整理行囊</b><small>装备、背包与卡牌</small></span></button>}
      {workshopUnlocked && <button className={state.stepsTraveled === 10 ? 'feature-new' : ''} onPointerDown={capturePress} onClick={onWorkshop}><Wrench /><span><b>房车工坊</b><small>重抽属性、拆解装备</small></span></button>}
      {guestsUnlocked && <button className={state.clears.reduce((sum, count) => sum + count, 0) === 1 ? 'feature-new' : ''} onPointerDown={capturePress} onClick={onGuests}><House /><span><b>客人房间</b><small>故事进度与专属纪念品</small></span></button>}
    </div>
    }
  </main>;
}

function Battle({ state, dispatch, outcome = null, battleSpeed = 1, onBattleSpeed }) {
  const { open: tipOpen } = React.useContext(TooltipContext);
  const [tutorialStep, setTutorialStep] = useState(0);
  const enemy = enemyFor(state);
  const move = intent(state);
  const autoIndex = state.battleMode === 'auto' ? chooseAutoCard(state) : -1;
  const recentAction = [...state.battleLog].reverse().find(item => item.startsWith('你打出') || item.startsWith(enemy.name)) || '';
  const enemyHit = (recentAction.startsWith('你打出') && recentAction.includes('伤害')) || outcome === 'victory';
  const playerHit = recentAction.startsWith(enemy.name) && recentAction.includes('伤害');
  const playerGuarded = recentAction.startsWith('你打出') && recentAction.includes('护盾');
  const energyGain = recentAction.startsWith('你打出') && recentAction.includes('能量');
  const actionKey = `${state.turn}-${state.played}-${state.hp}-${state.enemy.hp}-${recentAction}`;
  const sprite = enemySpriteProps(state);
  const previousEnemyHp = useRef(state.enemy.hp);
  const previousPlayerHp = useRef(state.hp);
  const previousPlayerBlock = useRef(state.block);
  const previousEnergy = useRef(state.energy);
  const previousEnemyBlock = useRef(state.enemy.block);
  const previousMark = useRef(state.enemy.mark);
  const battleLogRef = useRef(null);
  const [enemyDelta, setEnemyDelta] = useState(null);
  const [playerDelta, setPlayerDelta] = useState(null);
  const [statDeltas, setStatDeltas] = useState([]);
  const recordStatDelta = (kind, value, label) => {
    if (!value) return;
    setStatDeltas(current => [...current.filter(item => item.kind !== kind), { kind, value, label, key: `${kind}-${Date.now()}-${value}` }]);
  };
  useEffect(() => {
    const value = state.enemy.hp - previousEnemyHp.current;
    if (value) setEnemyDelta({ value, key: `${state.played}-${state.enemy.hp}` });
    previousEnemyHp.current = state.enemy.hp;
  }, [state.enemy.hp, state.played]);
  useEffect(() => {
    const value = state.hp - previousPlayerHp.current;
    if (value) setPlayerDelta({ value, key: `${state.turn}-${state.played}-${state.hp}` });
    previousPlayerHp.current = state.hp;
  }, [state.hp, state.played, state.turn]);
  useEffect(() => {
    recordStatDelta('player-block', state.block - previousPlayerBlock.current, '护盾');
    previousPlayerBlock.current = state.block;
  }, [state.block]);
  useEffect(() => {
    recordStatDelta('energy', state.energy - previousEnergy.current, '能量');
    previousEnergy.current = state.energy;
  }, [state.energy]);
  useEffect(() => {
    recordStatDelta('enemy-block', state.enemy.block - previousEnemyBlock.current, '护盾');
    previousEnemyBlock.current = state.enemy.block;
  }, [state.enemy.block]);
  useEffect(() => {
    recordStatDelta('mark', state.enemy.mark - previousMark.current, '弱点');
    previousMark.current = state.enemy.mark;
  }, [state.enemy.mark]);
  useEffect(() => {
    if (state.battleMode !== 'auto' || state.phase !== 'combat' || !state.tutorialDone || tipOpen) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'auto' }), 720 / battleSpeed);
    return () => window.clearTimeout(timer);
  }, [state, dispatch, tipOpen, battleSpeed]);
  useEffect(() => {
    const element = battleLogRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [state.battleLog.length]);
  return (
    <>
      <section className="battlefield battle-speed-scope" style={{ '--battle-speed': battleSpeed }}>
        <div className="battle-background pixel-art" style={{ backgroundImage: `url(${PIXEL_BACKGROUNDS[state.stage]})` }} />
        <div className="battle-depth" />
        <div key={`enemy-${state.enemy.hp}-${outcome || 'fight'}`} className={`enemy-sprite pixel-art ${sprite.className} ${enemyHit ? 'enemy-hit' : ''} ${outcome === 'victory' ? 'enemy-defeated' : ''}`} style={sprite.style} />
        <div className={`enemy-ground-shadow ${enemyHit ? 'enemy-hit' : ''} ${outcome === 'victory' ? 'enemy-defeated' : ''}`} />
        <div className="enemy-health-float">
          <div><strong>{enemy.name}</strong><Tip text="敌人生命降到 0 即可获胜。"><span>生命 {state.enemy.hp} / {state.enemy.maxHp}</span></Tip></div>
          <Bar value={state.enemy.hp} max={state.enemy.maxHp} tone="enemy" />
          {!outcome && <div className="enemy-next-action"><small>敌人下回合</small><span>{INTENTS[move.kind](move)}</span></div>}
          {state.enemy.block > 0 && <Tip text="敌人护盾会优先抵消你造成的伤害。"><b><Shield size={13} />护盾 {state.enemy.block}</b></Tip>}
          {enemyDelta && <em key={enemyDelta.key} className={`health-delta ${enemyDelta.value > 0 ? 'heal' : 'damage'}`}>{enemyDelta.value > 0 ? '+' : ''}{enemyDelta.value}</em>}
          <div className="enemy-stat-deltas">{statDeltas.filter(item => ['enemy-block', 'mark'].includes(item.kind)).map(item => <em key={item.key} className={`stat-delta ${item.value > 0 ? 'gain' : 'loss'}`}>{item.label} {item.value > 0 ? '+' : ''}{item.value}</em>)}</div>
        </div>
        <div className="scene-vignette" />
        {enemyHit && <div key={`slash-${actionKey}`} className="slash-effect" />}
        {outcome && <div className={`battle-result ${outcome}`}><small>{outcome === 'victory' ? 'DREAM CLEARED' : 'THE DREAM BREAKS'}</small><strong>{outcome === 'victory' ? '胜利' : '挑战失败'}</strong><span>{outcome === 'victory' ? '恭喜，梦境重新安静下来' : '别担心，房车会带你回到灯下'}</span></div>}
        <div className="enemy-panel">
          <div className="enemy-name"><span>{enemy.title}</span><h2>{enemy.name}</h2></div>
          {state.enemy.mark > 0 && <Tip text="弱点会强化你的下一次攻击：每层额外造成 3 点伤害，攻击后全部清空。"><div className="mark"><Target size={14} />弱点 {state.enemy.mark}</div></Tip>}
        </div>
      </section>

      <section className={`combat-ui battle-speed-scope ${playerHit ? 'player-damaged' : ''}`} style={{ '--battle-speed': battleSpeed }}>
        <div key={`player-${state.hp}`} className={`player-row ${playerHit ? 'player-hit' : ''} ${playerDelta?.value > 0 ? 'player-healed' : ''} ${playerGuarded ? 'player-guarded' : ''}`}>
          {playerHit && <div key={`scratch-${actionKey}`} className="player-scratch" aria-hidden="true"><i /><i /><i /></div>}
          {playerDelta?.value > 0 && <div key={`heal-${playerDelta.key}`} className="player-heal-effect" aria-hidden="true"><i /><i /><i /></div>}
          <div className="player-health">
            <div><span className="level-pill">Lv.{state.level}</span><small>生命</small><Heart size={18} fill="currentColor" /><strong>{state.hp}</strong><span>/ {state.maxHp}</span>{state.block > 0 && <Tip text="护盾会优先抵消伤害，并在敌人行动后清空。"><b><Shield size={15} />{state.block}</b></Tip>}</div>
            <Bar value={state.hp} max={state.maxHp} />
          </div>
          <Tip text="能量用于打出卡牌，每回合开始时恢复至 3。"><div key={`energy-${actionKey}`} className={`energy ${energyGain ? 'energy-gain' : ''}`}><Sparkles size={18} /><strong>{state.energy}</strong><span>/ 3</span></div></Tip>
          {playerDelta && <em key={playerDelta.key} className={`health-delta player-delta ${playerDelta.value > 0 ? 'heal' : 'damage'}`}>{playerDelta.value > 0 ? '+' : ''}{playerDelta.value}</em>}
          <div className="player-stat-deltas">{statDeltas.filter(item => ['player-block', 'energy'].includes(item.kind)).map(item => <em key={item.key} className={`stat-delta ${item.value > 0 ? 'gain' : 'loss'}`}>{item.label} {item.value > 0 ? '+' : ''}{item.value}</em>)}</div>
        </div>
        {state.weak > 0 && <Tip text="虚弱会让你造成的基础伤害降低 25%，持续到下一回合。"><div className="status"><Moon size={14} />虚弱：伤害 -25%</div></Tip>}
        <div className="combat-body">
          <div className={`hand ${state.battleMode === 'auto' ? 'auto' : ''}`} aria-label="手牌">
            {state.hand.map((key, index) => (
              <CardView key={`${key}-${index}`} cardKey={key} disabled={state.battleMode === 'auto' || card(key).cost > state.energy}
                preview={attackPreview(state, key)} active={index === autoIndex} onClick={() => dispatch({ type: 'play', index })} />
            ))}
          </div>
          <aside className="battle-log" aria-live="polite">
            <h3><BookOpen size={16} />梦境记录</h3>
            <div ref={battleLogRef}>{state.battleLog.map((item, index) => <p className={item.startsWith('状态：') ? 'battle-status-line' : ''} key={`${item}-${index}`}><BattleLogLine text={item} enemyName={enemy.name} /></p>)}</div>
          </aside>
        </div>
        <div className="turn-controls">
          <Tip text="抽牌堆用完后，弃牌堆会重新洗回抽牌堆。"><span>{state.battleMode === 'auto' ? '自动出牌中 · ' : ''}抽牌 {state.draw.length} · 弃牌 {state.discard.length}</span></Tip>
          <div className="speed-control" aria-label="战斗速度"><small>速度</small>{[1, 2, 3].map(speed => <button key={speed} className={battleSpeed === speed ? 'active' : ''} onClick={() => onBattleSpeed(speed)}>x{speed}</button>)}</div>
          <button className="end-turn" disabled={state.battleMode === 'auto'} onClick={() => dispatch({ type: 'end' })}>{state.battleMode === 'auto' ? '自动行动' : '结束回合'}</button>
        </div>
      </section>
      {!state.tutorialDone && <div className="tutorial-backdrop"><section className="tutorial-card"><span>{tutorialStep + 1} / 3</span><h2>{['打出卡牌', '观察能量与护盾', '抓住敌人弱点'][tutorialStep]}</h2><p>{['卡牌会造成伤害、回复生命或提供护盾。自动模式会替你选择，手动模式可点击卡牌。', '每张牌消耗能量；护盾会先抵消伤害。每回合开始时能量恢复至 3。', '部分卡牌会发现弱点：下次攻击每层额外造成 3 点伤害，攻击后清空。将敌人生命降到 0 即可获胜。'][tutorialStep]}</p><button className="primary" onClick={() => tutorialStep < 2 ? setTutorialStep(tutorialStep + 1) : dispatch({ type: 'tutorialDone' })}>{tutorialStep < 2 ? '下一步' : '开始战斗'}</button></section></div>}
    </>
  );
}

function Reward({ state, dispatch }) {
  const [reviewing, setReviewing] = useState(false);
  const loot = itemFor(state, state.lastLoot);
  return <Overlay variant="reward" background={PIXEL_BACKGROUNDS[state.stage]} eyebrow="DREAM CLEARED · 恭喜" title="胜利" text="梦境已经安宁，今晚的旅途仍会继续。">
    <button className="review-button" onClick={() => setReviewing(true)}><BookOpen size={16} />回顾战斗</button>
    {loot && <div className="loot-banner"><Backpack /><span><small>随机装备已放入背包</small><strong>{itemName(loot)}</strong><em>{itemLines(loot).join(' · ')}</em></span><b>{loot.rarity}</b></div>}
    <div className="reward-progress"><span>角色等级 {state.level}</span><span>{state.xp} / {state.nextXp} XP</span></div>
    <Bar value={state.xp} max={state.nextXp} tone="xp" />
    <section className="reward-choice-block"><h3 className="reward-heading">挑选一张胜利奖励</h3><div className="reward-grid">{state.choices.map(key => <CardView key={key} cardKey={key} compact onClick={() => dispatch({ type: 'reward', key })} />)}</div><button className="text-button" onClick={() => dispatch({ type: 'reward', key: null })}>跳过奖励</button></section>
    {reviewing && <BattleReview entries={state.battleLog} enemyName={enemyFor(state).name} onClose={() => setReviewing(false)} />}
  </Overlay>;
}

const NODE_META = {
  battle: { label: '普通战斗', icon: Moon, tip: '普通战斗：难度较低，胜利后获得经验、卡牌和随机装备。' },
  elite: { label: '精英战斗', icon: Crown, tip: '精英战斗：敌人更强，但装备品质和旅币奖励更高。' },
  camp: { label: '休息', icon: TentTree, tip: '休息站：回复生命、强化卡牌或购买旅途增益。' },
  event: { label: '事件', icon: CircleHelp, tip: '沿途事件：在两个选项中取舍，可能消耗生命或获得旅币。' },
  checkpoint: { label: '路标', icon: MapPin, tip: '路标：每 10 步出现，可恢复生命、强化卡牌或补充旅币。' },
  boss: { label: '首领', icon: Flame, tip: '区域首领：击败后完成本章并解锁下一站。' },
};

function MapView({ state, dispatch }) {
  const { show } = React.useContext(TooltipContext);
  const nodes = chapterMap(state.stage, state.mapSeed);
  const previous = nodes.find(node => node.id === state.currentNode);
  const available = new Set(state.mapRow < 0 ? nodes.filter(node => node.row === 0).map(node => node.id) : (previous?.links || []));
  const byId = Object.fromEntries(nodes.map(node => [node.id, node]));
  const scrollRef = useRef(null);
  const rowHeight = 68;
  const mapHeight = MAP_STEPS * rowHeight + 80;
  const y = row => mapHeight - 54 - row * rowHeight;
  const chapter = CHAPTERS[state.stage];
  const segment = Math.min(4, Math.floor(Math.max(0, state.mapRow + 1) / 10));
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const targetRow = state.mapRow < 0 ? 0 : Math.min(MAP_STEPS - 1, state.mapRow + 1);
    scroller.scrollTop = Math.max(0, y(targetRow) - scroller.clientHeight * .68);
  }, [state.mapRow, state.stage]);
  return <section className="map-view">
    <div className="map-art pixel-art" style={{ backgroundImage: `url(${PIXEL_BACKGROUNDS[state.stage]})` }} /><div className="map-shade" />
    <header className="map-heading"><span className="eyebrow">第 {state.stage + 1} 站 · 第 {segment + 1} 段</span><h1>{chapter.name}</h1><p>{SEGMENT_NAMES[segment]} · 选择发光的下一节点，穿过 50 段夜路。</p></header>
    <div className="map-stats"><Tip text="提升等级会增加生命上限；经验来自战斗。"><span><TrendingUp />Lv.{state.level}</span></Tip><Tip text="当前生命。降到 0 时本局直接结束。"><span><Heart />{state.hp}/{state.maxHp}</span></Tip><Tip text="旅币可用于工坊、设施升级与旅途交易。"><span><Coins />{state.gold}</span></Tip><button onClick={() => dispatch({ type: 'returnHub' })}>返回房车</button></div>
    <div className="map-scroll" ref={scrollRef}>
    <div className="route-map" style={{ height: `${mapHeight}px` }}>
      <svg viewBox={`0 0 100 ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
        {nodes.flatMap(node => node.links.map(link => {
          const next = byId[link];
          const travelled = state.visited.includes(node.id) && state.visited.includes(next.id);
          return <line key={`${node.id}-${link}`} x1={node.x} y1={y(node.row)} x2={next.x} y2={y(next.row)} className={travelled ? 'travelled' : ''} />;
        }))}
      </svg>
      {CHECKPOINT_STEPS.map(step => <div key={step} className="map-milepost" style={{ top: `${y(step - 1)}px` }}><span>{step} · {CHECKPOINTS[step].title}</span></div>)}
      {nodes.map(node => {
        const meta = NODE_META[node.type], Icon = meta.icon;
        const visited = state.visited.includes(node.id), enabled = available.has(node.id);
        return <button key={node.id} className={`map-node ${node.type} ${visited ? 'visited' : ''} ${enabled ? 'available' : ''}`}
          style={{ left: `${node.x}%`, top: `${y(node.row)}px` }} aria-disabled={!enabled} onClick={event => enabled ? dispatch({ type: 'node', id: node.id }) : show(visited ? '这个节点已经走过。' : '需要沿当前节点亮起的连线继续前进。', event)} aria-label={`${meta.label} · 第 ${node.row + 1} 步`}>
          <Icon /><span>{enabled ? '可前往' : meta.label}</span>
        </button>;
      })}
    </div></div>
    <div className="map-legend">{Object.entries(NODE_META).map(([key, meta]) => <Tip key={key} text={meta.tip}><span><meta.icon />{meta.label}</span></Tip>)}</div>
  </section>;
}

function EventView({ state, dispatch }) {
  return <Overlay background={PIXEL_BACKGROUNDS[state.stage]} eyebrow="沿途事件" title="夜路杂货车" text="亮着小灯的摊主，提出两种交换。">
    <div className="camp-grid">
      <CampChoice icon={Heart} title="喝杯花茶" text="回复最多 12 点生命" onClick={() => dispatch({ type: 'event', choice: 'spring' })} />
      <CampChoice icon={Coins} title="出售旧照片" text="消耗 5 点生命，获得 22 枚旅币" onClick={() => dispatch({ type: 'event', choice: 'bargain' })} />
    </div>
  </Overlay>;
}

function Camp({ state, dispatch }) {
  return <Overlay background={PIXEL_BACKGROUNDS[state.stage]} eyebrow="安全节点" title="亮灯的休息站" text="只能做一次选择，然后继续赶路。">
    <div className="camp-grid">
      <CampChoice icon={Heart} title="在房车里小睡" text="回复最多 18 点生命" onClick={() => dispatch({ type: 'camp', choice: 'rest' })} />
      <CampChoice icon={Sparkles} title="整理一段回忆" text="强化卡组中第一张共鸣牌" onClick={() => dispatch({ type: 'camp', choice: 'upgrade' })} />
      <CampChoice icon={Shield} title="购买柔软靠枕" text="30 旅币 · 每回合获得 2 点护盾" disabled={state.gold < 30 || state.relic} onClick={() => dispatch({ type: 'camp', choice: 'relic' })} />
    </div>
  </Overlay>;
}

function Checkpoint({ state, dispatch }) {
  const checkpoint = CHECKPOINTS[state.mapRow + 1] || CHECKPOINTS[10];
  const checkpointIcons = { heart: Heart, sparkles: Sparkles, backpack: Backpack, coins: Coins, book: BookOpen, moon: Moon };
  return <Overlay background={PIXEL_BACKGROUNDS[state.stage]} eyebrow={`夜程 ${state.mapRow + 1} / ${MAP_STEPS}`} title={checkpoint.title} text={checkpoint.text}>
    <div className="camp-grid checkpoint-grid">
      {checkpoint.choices.map(choice => <CampChoice key={choice.key} icon={checkpointIcons[choice.icon]} title={choice.title} text={choice.text} onClick={() => dispatch({ type: 'checkpoint', choice: choice.key })} />)}
    </div>
  </Overlay>;
}

function CampChoice({ icon: Icon, title, text, onClick, disabled }) {
  return <button className="camp-choice" onClick={onClick} disabled={disabled}><Icon /><span><strong>{title}</strong><small>{text}</small></span></button>;
}

function Overlay({ background, eyebrow, title, text, children, variant = '' }) {
  return <main className={`overlay ${variant}`}><div className="overlay-art pixel-art" style={{ backgroundImage: `url(${background || chapter0})` }} /><div className="overlay-shade" /><section className="overlay-sheet"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p>{children}</section></main>;
}

function BattleReview({ entries, enemyName, onClose }) {
  return <div className="battle-review-backdrop" onClick={onClose}><section className="battle-review" role="dialog" aria-modal="true" aria-labelledby="battle-review-title" onClick={event => event.stopPropagation()}>
    <header><div><span className="eyebrow">DREAM RECORD</span><h2 id="battle-review-title">战斗回顾</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭战斗回顾"><X /></button></header>
    <div className="battle-review-list">{entries.map((item, index) => <p className={item.startsWith('状态：') ? 'battle-status-line' : ''} key={`${item}-${index}`}><BattleLogLine text={item} enemyName={enemyName} /></p>)}</div>
  </section></div>;
}

function Finale({ won, state, onEnd }) {
  const [reviewing, setReviewing] = useState(false);
  const sprite = enemySpriteProps(state);
  return <main className={`finale ${won ? 'won' : 'lost'}`}><div className="finale-art pixel-art" style={{ backgroundImage: `url(${PIXEL_BACKGROUNDS[state.stage]})` }} />{!won && <div className={`finale-enemy pixel-art ${sprite.className}`} style={sprite.style} />}<div className="scene-vignette" /><section><span className="eyebrow">JOURNEY ENDED · 本局结束</span><h1>挑战失败</h1><p>生命归零，本次旅程已经结束。你可以回顾刚才的战斗，然后重新开始一局。</p><div className="run-stats"><span>等级 <b>{state.level}</b></span><span>战斗胜利 <b>{state.victories}</b></span><span>回合 <b>{state.totalTurns}</b></span></div><div className="finale-actions"><button className="primary" onClick={onEnd}><X size={18} />结束本局</button><button className="secondary" onClick={() => setReviewing(true)}><BookOpen size={18} />回顾战斗</button></div></section>{reviewing && <BattleReview entries={state.battleLog} enemyName={enemyFor(state).name} onClose={() => setReviewing(false)} />}</main>;
}

const SLOT_ICONS = { weapon: Swords, armor: Shirt, bag: Backpack, scarf: Wind, charm: Gem, decor: TentTree };

function itemEffect(item) {
  return itemLines(item).join(' · ');
}

function gearAccent(baseKey) {
  const chapter = Math.max(0, CHAPTER_LOOT.findIndex(pool => pool.includes(baseKey)));
  return CHAPTERS[chapter].color;
}

function GearArt({ baseKey, slot, Icon, empty = false }) {
  const style = empty ? null : gearAtlasStyle(baseKey);
  return <span className={`gear-icon ${style ? 'gear-art pixel-art' : 'gear-empty'}`} style={{ ...(style || {}), '--gear-accent': empty ? '#8a938a' : gearAccent(baseKey) }}><i className="gear-category"><Icon /></i></span>;
}

function GearRow({ state, item, equipped, disabled, onEquip }) {
  const base = ITEMS[item.base], Icon = SLOT_ICONS[base.slot];
  const current = itemFor(state, state.equipment[base.slot]);
  const difference = itemScore(item) - itemScore(current);
  return <button className={`gear-row rarity-${item.rarity} ${equipped ? 'equipped' : ''}`} disabled={disabled || equipped} onClick={onEquip}>
    <GearArt baseKey={item.base} slot={base.slot} Icon={Icon} /><span><small>{item.rarity} · {SLOT_LABELS[base.slot]}</small><strong>{itemName(item)}</strong><em>{itemEffect(item)}</em></span>{equipped ? <b><Check />已装备</b> : <b className={difference >= 0 ? 'better' : 'worse'}>{difference >= 0 ? `+${difference}` : difference} · 装备</b>}
  </button>;
}

function WorkshopRow({ state, item, dispatch }) {
  const base = ITEMS[item.base], Icon = SLOT_ICONS[base.slot];
  const equipped = Object.values(state.equipment).includes(item.id);
  const cost = rerollCost(item, state.facilities.workshop), value = salvageValue(item);
  return <div className={`workshop-row rarity-${item.rarity}`}>
    <GearArt baseKey={item.base} slot={base.slot} Icon={Icon} />
    <span><small>{item.rarity} · {SLOT_LABELS[base.slot]}</small><strong>{itemName(item)}</strong><em>{itemEffect(item)}</em></span>
    <div><button disabled={!item.affixes.length || state.gold < cost} onClick={() => dispatch({ type: 'reroll', key: item.id })}><Wrench />重抽属性 · {cost} 旅币</button><button disabled={equipped} onClick={() => dispatch({ type: 'salvage', key: item.id })}>拆解装备 · +{value} 旅币</button></div>
  </div>;
}

const FACILITY_META = [
  { key: 'kitchen', name: '暖灯厨房', icon: Flame, effect: level => `战后额外恢复 ${level * 2} 点生命` },
  { key: 'workshop', name: '随车工坊', icon: Wrench, effect: level => `重抽费用降低 ${level * 12}%` },
  { key: 'rooms', name: '旅客房间', icon: House, effect: level => `永久增加 ${level * 6} 点生命上限` },
];

function FacilityUpgrades({ state, dispatch }) {
  return <section className="facility-upgrades"><div className="facility-heading"><House /><span><strong>改造房车</strong><small>设施最高 3 级，效果永久保留。</small></span></div>
    <div className="facility-grid">{FACILITY_META.map(meta => {
      const level = state.facilities[meta.key], cost = facilityCost(level), Icon = meta.icon;
      return <article key={meta.key}><Icon /><span><small>LV.{level} / 3</small><strong>{meta.name}</strong><em>{meta.effect(level)}</em></span><button disabled={cost === null || state.gold < cost} onClick={() => dispatch({ type: 'upgradeFacility', key: meta.key })}>{cost === null ? <><Check />已完成</> : <><Coins />{cost}</>}</button></article>;
    })}</div>
  </section>;
}

function GuestRooms({ state, dispatch }) {
  return <div className="guest-rooms"><header><House /><span><strong>今晚的住客</strong><small>每次完成对应地区的梦境，都会推进一段入住故事。</small></span></header>
    {GUESTS.map((guest, index) => {
      const locked = index > state.unlocked;
      const progress = Math.min(3, state.clears[index]);
      const claimed = state.guestRewards[index];
      const story = locked ? '完成上一站后，这间客房才会亮灯。' : (progress ? guest.chapters[progress - 1] : guest.wish);
      const rewardLabel = claimed ? '已领取' : progress < 3 ? `再探索 ${3 - progress} 次` : `领取「${guest.gift}」`;
      return <article key={guest.name} className={locked ? 'locked' : ''}>
        <div className="guest-number">{locked ? <Lock /> : String(index + 1).padStart(2, '0')}</div>
        <div className="guest-copy"><small>{guest.room} · {CHAPTERS[index].name}</small><strong>{locked ? '尚未入住' : guest.name}</strong><p>{story}</p><div className="story-progress">{[1, 2, 3].map(step => <i key={step} className={step <= progress ? 'active' : ''} />)}</div></div>
        {!locked && <button disabled={progress < 3 || claimed} onClick={() => dispatch({ type: 'claimGuestReward', stage: index })}>{claimed ? <Check /> : progress >= 3 ? <Gem /> : null}{rewardLabel}</button>}
      </article>;
    })}
  </div>;
}

const COMMISSION_META = [
  { key: 'battles', title: '安抚沿途梦境', icon: Moon },
  { key: 'steps', title: '记录夜路足迹', icon: MapPin },
  { key: 'stories', title: '送旅客到清晨', icon: House },
];

function CommissionBoard({ state, dispatch }) {
  return <section className="commission-board"><header><BookOpen /><span><strong>旅程委托</strong><small>完成后会自动刷新下一档目标。</small></span></header>
    {COMMISSION_META.map(meta => {
      const task = commissionStatus(state, meta.key), Icon = meta.icon, complete = task.value >= task.target;
      return <article key={meta.key}><Icon /><span><strong>{meta.title}</strong><small>{Math.min(task.value, task.target)} / {task.target}</small><Bar value={task.value} max={task.target} tone="xp" /></span><button disabled={!complete} onClick={() => dispatch({ type: 'claimCommission', key: meta.key })}>{complete ? `领取 ${task.reward}` : `奖励 ${task.reward}`}</button></article>;
    })}
  </section>;
}

function Drawer({ state, dispatch, onClose, onRestart, initialTab = 'character' }) {
  const [tab, setTab] = useState(initialTab);
  const stats = equipmentStats(state);
  return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer" onClick={e => e.stopPropagation()}>
    <button className="icon-button close" onClick={onClose} aria-label="关闭"><X /></button><span className="eyebrow">旅行屋档案</span><h2>店主与行囊</h2>
    <div className="level-card"><span>LV</span><strong>{state.level}</strong><div><b>梦境旅店店主</b><small>{state.xp} / {state.nextXp} XP</small><Bar value={state.xp} max={state.nextXp} tone="xp" /></div></div>
    <div className="drawer-stats"><Tip text="伤害会加到所有攻击卡牌的基础伤害上。"><span><Swords />伤害 +{stats.attack}</span></Tip><Tip text="每回合开始时自动获得这些护盾。"><span><Shield />护盾 +{stats.block}</span></Tip><Tip text="每场战斗胜利后额外回复的生命。"><span><Heart />恢复 +{stats.recovery}</span></Tip></div>
    <nav className="drawer-tabs"><button className={tab === 'character' ? 'active' : ''} onClick={() => setTab('character')}>装备</button><button className={tab === 'bag' ? 'active' : ''} onClick={() => setTab('bag')}>背包 {state.inventory.length}</button><button className={tab === 'deck' ? 'active' : ''} onClick={() => setTab('deck')}>卡组 {state.deck.length}</button><button className={tab === 'workshop' ? 'active' : ''} onClick={() => setTab('workshop')}>工坊</button><button className={tab === 'guests' ? 'active' : ''} onClick={() => setTab('guests')}>客人</button></nav>
    {tab === 'character' && <><div className="equipment-grid">{Object.entries(SLOT_LABELS).map(([slot, label]) => { const id = state.equipment[slot], item = itemFor(state, id), Icon = SLOT_ICONS[slot]; return <div className="equipment-slot" key={slot}><GearArt baseKey={item?.base || slot} slot={slot} Icon={Icon} empty={!item} /><small>{label}</small><strong>{item ? itemName(item) : '未装备'}</strong><em>{item ? itemEffect(item) : '无属性加成'}</em></div>; })}</div><div className="log"><h3><BookOpen />最近战报</h3>{state.log.slice(0, 6).map((item, i) => <p key={i}>{item}</p>)}</div></>}
    {tab === 'bag' && <div className="inventory-list">{state.inventory.map(item => { const slot = ITEMS[item.base].slot; return <GearRow key={item.id} state={state} item={item} equipped={state.equipment[slot] === item.id} disabled={state.phase === 'combat'} onEquip={() => dispatch({ type: 'equip', key: item.id })} />; })}{state.phase === 'combat' && <p className="bag-hint">梦境中不能更换装备。</p>}</div>}
    {tab === 'deck' && <div className="deck-list">{state.deck.map((key, i) => <CardView key={`${key}-${i}`} cardKey={key} compact />)}</div>}
    {tab === 'workshop' && <div className="workshop"><header><Wrench /><span><strong>房车工坊</strong><small>重抽属性：花旅币重新随机词条；拆解装备：销毁装备并换回旅币。附带技能不会被重抽。</small></span><b><Coins />{state.gold}</b></header><FacilityUpgrades state={state} dispatch={dispatch} />{state.inventory.map(item => <WorkshopRow key={item.id} state={state} item={item} dispatch={dispatch} />)}</div>}
    {tab === 'guests' && <><CommissionBoard state={state} dispatch={dispatch} /><GuestRooms state={state} dispatch={dispatch} /></>}
    <button className="danger" onClick={onRestart}>放弃并重新开始</button>
  </aside></div>;
}

function App() {
  const [saved, setSaved] = useState(() => restore(localStorage.getItem(SAVE_KEY)));
  const [state, setState] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [settling, setSettling] = useState(null);
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [valueFloaters, setValueFloaters] = useState([]);
  const previousState = useRef(null);
  const previousBattleKey = useRef(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const reportPointer = event => {
      const target = event.target instanceof Element ? event.target : null;
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const button = target?.closest('button') || hit?.closest?.('button');
      const rect = button?.getBoundingClientRect();
      console.info('[pointer-debug]', JSON.stringify({
        type: event.type,
        pointerType: event.pointerType || 'mouse',
        client: [Math.round(event.clientX), Math.round(event.clientY)],
        target: target ? `${target.tagName.toLowerCase()}.${String(target.className || '').replace(/\s+/g, '.')}` : null,
        hit: hit ? `${hit.tagName.toLowerCase()}.${String(hit.className || '').replace(/\s+/g, '.')}` : null,
        button: button?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) || null,
        rect: rect ? [Math.round(rect.left), Math.round(rect.top), Math.round(rect.right), Math.round(rect.bottom)] : null,
        viewport: [window.innerWidth, window.innerHeight],
        visualViewport: window.visualViewport ? [Math.round(window.visualViewport.width), Math.round(window.visualViewport.height), window.visualViewport.scale, Math.round(window.visualViewport.offsetTop)] : null,
        dpr: window.devicePixelRatio,
      }));
    };
    document.addEventListener('pointerdown', reportPointer, true);
    document.addEventListener('pointerup', reportPointer, true);
    document.addEventListener('click', reportPointer, true);
    return () => {
      document.removeEventListener('pointerdown', reportPointer, true);
      document.removeEventListener('pointerup', reportPointer, true);
      document.removeEventListener('click', reportPointer, true);
    };
  }, []);
  useEffect(() => { if (state) localStorage.setItem(SAVE_KEY, serialize(state)); }, [state]);
  useEffect(() => {
    if (!state || state.phase !== 'combat') return;
    const battleKey = `${state.stage}-${state.mapRow}-${state.bossFight ? 'boss' : 'node'}`;
    if (previousBattleKey.current !== battleKey) setBattleSpeed(1);
    previousBattleKey.current = battleKey;
  }, [state?.phase, state?.stage, state?.mapRow, state?.bossFight]);
  useEffect(() => {
    const previous = previousState.current;
    previousState.current = state;
    if (!previous || !state) return;
    const changes = [];
    const add = (label, value) => { if (value) changes.push({ label, value, key: `${label}-${Date.now()}-${value}` }); };
    if (state.phase === previous.phase && state.phase !== 'combat') add('生命', state.hp - previous.hp);
    add('旅币', state.gold - previous.gold);
    add('经验', state.xp - previous.xp);
    add('等级', state.level - previous.level);
    add('生命上限', state.maxHp - previous.maxHp);
    if (changes.length) setValueFloaters(changes);
  }, [state]);
  useEffect(() => {
    if (!state || !['reward', 'lost'].includes(state.phase)) { setSettling(null); return undefined; }
    setSettling(state.phase);
    const timer = window.setTimeout(() => setSettling(null), 1250 / battleSpeed);
    return () => window.clearTimeout(timer);
  }, [state?.phase, state?.played, battleSpeed]);
  const enemy = useMemo(() => state ? enemyFor(state) : null, [state]);
  const location = state?.phase === 'map' ? CHAPTERS[state.stage].name : state?.phase === 'camp' ? '亮灯的休息站' : state?.phase === 'checkpoint' ? CHECKPOINTS[state.mapRow + 1]?.title || '夜程路标' : state?.phase === 'event' ? '夜路岔口' : enemy?.place;
  const startNew = (mode = 'auto', difficulty = 'standard') => { const next = newRun(Date.now() >>> 0, mode, difficulty); localStorage.setItem(SAVE_KEY, serialize(next)); setSaved(next); setDrawer(false); setState(next); };
  const resetRun = () => { localStorage.removeItem(SAVE_KEY); setSaved(null); setDrawer(false); setState(null); };
  const dispatch = React.useCallback(action => setState(current => transition(current, action)), []);
  if (!state) return <Splash saved={saved} onContinue={() => setState(saved)} onNew={startNew} />;
  if (state.phase === 'lost' && !settling) return <><Finale won={false} state={state} onEnd={resetRun} /><ValueFloaters items={valueFloaters} /></>;
  if (state.phase === 'hub') return <><CamperHub state={state} dispatch={dispatch} onDrawer={() => setDrawer('character')} onWorkshop={() => setDrawer('workshop')} onGuests={() => setDrawer('guests')} />{drawer && <Drawer initialTab={drawer} state={state} dispatch={dispatch} onClose={() => setDrawer(false)} onRestart={() => window.confirm('确定清空旅店存档？') && resetRun()} />}<ValueFloaters items={valueFloaters} /></>;
  return <main className="game-shell">
    <header className="topbar"><div><Tip text={`当前为${DIFFICULTIES[state.difficulty].name}难度，${state.battleMode === 'auto' ? '系统会自动选择卡牌' : '由你手动选择卡牌'}；这两项设置会贯穿整局。`}><span>Lv.{state.level} · 第 {state.stage + 1} / {ENEMIES.length} 站 · {DIFFICULTIES[state.difficulty].name} · {state.battleMode === 'auto' ? '自动' : '手动'}</span></Tip><strong>{location}</strong></div><div className="route">{ENEMIES.map((_, i) => <i key={i} className={i <= state.stage ? 'active' : ''} />)}</div><button className="icon-button" onClick={() => setDrawer(true)} aria-label="打开角色与背包"><Menu /></button></header>
    {state.phase === 'map' && <MapView state={state} dispatch={dispatch} />}
    {(state.phase === 'combat' || settling) && <Battle state={state} dispatch={dispatch} battleSpeed={battleSpeed} onBattleSpeed={setBattleSpeed} outcome={settling === 'reward' ? 'victory' : settling === 'lost' ? 'defeat' : null} />}
    {state.phase === 'reward' && !settling && <Reward state={state} dispatch={dispatch} />}
    {state.phase === 'camp' && <Camp state={state} dispatch={dispatch} />}
    {state.phase === 'checkpoint' && <Checkpoint state={state} dispatch={dispatch} />}
    {state.phase === 'event' && <EventView state={state} dispatch={dispatch} />}
    {drawer && <Drawer initialTab={drawer === true ? 'character' : drawer} state={state} dispatch={dispatch} onClose={() => setDrawer(false)} onRestart={() => window.confirm('确定放弃当前旅途？') && resetRun()} />}
    <ValueFloaters items={valueFloaters} />
  </main>;
}

createRoot(document.getElementById('root')).render(<TooltipProvider><App /></TooltipProvider>);
