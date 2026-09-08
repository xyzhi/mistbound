import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle, ArrowLeft, Backpack, BookOpen, Check, CircleHelp, Coins, Combine, Crown, Flame, FlaskConical, Gem, Heart, Hourglass,
  House, Lock, MapPin, Menu, Moon, PackageOpen, Shield, Shirt,
  Sparkles, Swords, Target, TentTree, Trash2, TrendingUp, Volume2, VolumeX, Wind, Wrench, X,
} from 'lucide-react';
import {
  AFFIX_LABELS, CARDS, CHARACTERS, CHECKPOINTS, CHECKPOINT_STEPS, CHAPTER_LOOT, CHAPTERS, DIFFICULTIES, ENEMIES, EQUIPMENT_ART, GUESTS, ITEMS, MYSTERY_STATIONS, SAVE_KEY, SEGMENT_NAMES, SLOT_LABELS, attackBreakdown, card,
  cardBaseKey, cardRank, chapterMap, chooseAutoCard, commissionStatus, compareCardKeys, description, enemyFor, equipmentStats, facilityCost, intent, itemFor, itemLines, MAP_STEPS,
  itemName, itemScore, itemStats, itemTier, itemUpgradeCost, magicHouseCooldownRemaining, newRun, rankedCardKey, rerollCost, restore, salvageValue, serialize, skillRewardRank, transition, upgradeCardKey,
} from './game.mjs';
import './styles.css';
import camperPixel from './assets/pixel/runtime/camper.webp';
import chapter0 from './assets/pixel/runtime/chapter-0.webp';
import chapter1 from './assets/pixel/runtime/chapter-1.webp';
import chapter2 from './assets/pixel/runtime/chapter-2.webp';
import chapter3 from './assets/pixel/runtime/chapter-3.webp';
import chapter4 from './assets/pixel/runtime/chapter-4.webp';
import chapter5 from './assets/pixel/runtime/chapter-5.webp';
import bossFlower from './assets/pixel/runtime/enemies-flower-boss.png';
import bossRain from './assets/pixel/runtime/enemies-rain-boss.png';
import bossBooks from './assets/pixel/runtime/enemies-books-boss.png';
import bossCoast from './assets/pixel/runtime/enemies-coast-boss.png';
import bossMarket from './assets/pixel/runtime/enemies-market-boss.png';
import bossTerminal from './assets/pixel/runtime/enemies-terminal-boss.png';
import dreamCreatures from './assets/pixel/runtime/dream-creatures.webp';
import equipmentAtlas from './assets/pixel/runtime/equipment-atlas.webp';
import skillAtlas from './assets/pixel/runtime/skill-atlas.webp';
import characterAtlas from './assets/pixel/runtime/character-atlas.webp';
import { pcmBase64 as nightDrivePcm, sampleRate as nightDriveSampleRate } from './assets/audio/night-drive-loop.js';

const PIXEL_BACKGROUNDS = [chapter0, chapter1, chapter2, chapter3, chapter4, chapter5];
const PIXEL_BOSSES = [bossFlower, bossRain, bossBooks, bossCoast, bossMarket, bossTerminal];
const CARD_KEYS = Object.keys(CARDS).filter(key => key !== 'doubt');
const BATTLE_SPEED_KEY = 'mistbound-battle-speed';
const MUSIC_ENABLED_KEY = 'mistbound-music-enabled';
const CHARACTER_KEYS = Object.keys(CHARACTERS);
const CHARACTER_LINES = {
  uncle: { victory: '今晚的故事，我认真听完了。', defeat: '先回车里坐坐，故事还没结束。' },
  gaigai: { victory: '太好了，回去给大家煮一锅热可可！', defeat: '没关系，喝点热的，我们再出发。' },
  xiaoshuai: { victory: '裂缝补好了，至少今晚不会漏风。', defeat: '记住裂开的地方，下次会补得更牢。' },
};

function atlasStyle(image, index, columns, rows) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${column * 100 / Math.max(1, columns - 1)}% ${row * 100 / Math.max(1, rows - 1)}%`,
  };
}

function characterStyle(key, zoom = 1) {
  const index = Math.max(0, CHARACTER_KEYS.indexOf(key));
  if (zoom === 1) return atlasStyle(characterAtlas, index, 3, 1);
  const imageWidth = 3 * zoom;
  const x = (0.5 - (index + 0.5) * zoom) / (1 - imageWidth) * 100;
  const y = (0.5 - 0.35 * zoom) / (1 - zoom) * 100;
  return { backgroundImage: `url(${characterAtlas})`, backgroundSize: `${imageWidth * 100}% ${zoom * 100}%`, backgroundPosition: `${x}% ${y}%` };
}

function cardAtlasStyle(cardKey) {
  const model = card(cardKey);
  const artKey = model.art || model.baseKey;
  const atlasKeys = ['slash', 'guard', 'mark', 'heavy', 'focus', 'riposte', 'leech', 'quick', 'nova', 'fortify', 'echo', 'mend', 'risk', 'tea', 'listen', 'postcard', 'blanket', 'nightRide', 'kitchenLight', 'unsent', 'photoAlbum', 'morningCall', 'stayAwhile', 'lucidDoor', 'goodnight'];
  return atlasStyle(skillAtlas, Math.max(0, atlasKeys.indexOf(artKey)), 5, 5);
}

function gearAtlasStyle(baseKey) {
  const art = EQUIPMENT_ART[baseKey];
  if (Number.isInteger(art)) return atlasStyle(equipmentAtlas, art, 8, 6);
  if (art?.atlas === 'skill') return atlasStyle(skillAtlas, art.index, 5, 5);
  return null;
}

function enemySpriteProps(state) {
  if (state.bossFight) return { className: 'boss-sprite', style: { backgroundImage: `url(${PIXEL_BOSSES[state.stage]})` } };
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
  charge: move => `蓄力 · 下回合造成 ${move.value} 伤害`,
  chargedAttack: move => `释放蓄力 · 造成 ${move.value} 伤害`,
  dispel: move => `驱散一半护盾 · 造成 ${move.value} 伤害`,
  suppress: move => `治疗压制 ${move.value} 回合`,
  jam: move => `塞入 ${move.value} 张杂念`,
  heal: move => `恢复 ${move.value} 点生命`,
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
const MusicContext = React.createContext({ enabled: true, toggle: () => {}, playSfx: () => {} });

function MusicProvider({ children }) {
  const contextRef = useRef(null);
  const sourceRef = useRef(null);
  const musicGainRef = useRef(null);
  const [enabled, setEnabled] = useState(() => localStorage.getItem(MUSIC_ENABLED_KEY) !== 'off');
  const startMusic = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!contextRef.current) {
      const context = new AudioContextClass();
      const bytes = Uint8Array.from(atob(nightDrivePcm), character => character.charCodeAt(0));
      const samples = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const buffer = context.createBuffer(1, bytes.length / 2, nightDriveSampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < channel.length; index++) channel[index] = samples.getInt16(index * 2, true) / 32768;
      const gain = context.createGain();
      gain.gain.value = .24;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      gain.connect(context.destination);
      source.start();
      contextRef.current = context;
      sourceRef.current = source;
      musicGainRef.current = gain;
    }
    contextRef.current.resume().catch(() => {});
    return contextRef.current;
  };
  const playSfx = kind => {
    if (!enabled) return;
    const context = startMusic();
    if (!context) return;
    const now = context.currentTime;
    const musicGain = musicGainRef.current?.gain;
    if (musicGain && kind !== 'mysteryTick') {
      musicGain.cancelScheduledValues(now);
      musicGain.setValueAtTime(musicGain.value, now);
      musicGain.linearRampToValueAtTime(.12, now + .025);
      musicGain.linearRampToValueAtTime(.24, now + .38);
    }
    const voice = (frequency, offset, duration, volume, type = 'sine', endFrequency = frequency) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + offset);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + offset + duration);
      gain.gain.setValueAtTime(.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(volume, now + offset + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, now + offset + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + duration + .015);
    };
    const sounds = {
      tap: () => voice(340, 0, .055, .07, 'triangle', 260),
      confirm: () => { voice(440, 0, .075, .09, 'triangle', 520); voice(660, .055, .105, .075, 'sine', 760); },
      card: () => { voice(210, 0, .12, .105, 'triangle', 390); voice(620, .035, .09, .06, 'sine', 780); },
      guard: () => { voice(260, 0, .16, .09, 'triangle', 190); voice(520, .025, .22, .075, 'sine', 720); voice(780, .08, .18, .045, 'sine', 620); },
      route: () => { voice(520, 0, .11, .08, 'sine', 610); voice(820, .07, .16, .07, 'sine', 980); },
      warning: () => { voice(180, 0, .18, .11, 'sawtooth', 105); voice(120, .09, .16, .075, 'triangle', 82); },
      hit: () => { voice(145, 0, .105, .13, 'square', 62); voice(360, 0, .055, .065, 'sawtooth', 130); },
      hurt: () => { voice(115, 0, .2, .145, 'sawtooth', 48); voice(72, .035, .18, .095, 'square', 42); },
      heal: () => { voice(440, 0, .18, .07); voice(554, .07, .2, .075); voice(659, .14, .24, .07); },
      victory: () => [523, 659, 784, 1047].forEach((note, index) => voice(note, index * .085, .28, .085, 'triangle')),
      defeat: () => [220, 185, 147].forEach((note, index) => voice(note, index * .13, .3, .1, 'triangle', note * .82)),
      mysteryTick: () => { voice(280, 0, .045, .045, 'square', 220); voice(720, 0, .035, .022, 'triangle', 620); },
      mysteryReveal: () => { [392, 523, 659].forEach((note, index) => voice(note, index * .075, .24, .09, 'triangle', note * 1.08)); voice(1047, .24, .32, .075, 'sine', 1319); },
      mysteryBad: () => { voice(196, 0, .34, .12, 'sawtooth', 98); voice(147, .12, .3, .09, 'triangle', 73); },
    };
    (sounds[kind] || sounds.tap)();
  };
  useEffect(() => {
    localStorage.setItem(MUSIC_ENABLED_KEY, enabled ? 'on' : 'off');
    if (!enabled) {
      contextRef.current?.suspend().catch(() => {});
      return undefined;
    }
    startMusic();
    document.addEventListener('pointerdown', startMusic, { once: true, capture: true });
    document.addEventListener('keydown', startMusic, { once: true, capture: true });
    return () => {
      document.removeEventListener('pointerdown', startMusic, true);
      document.removeEventListener('keydown', startMusic, true);
    };
  }, [enabled]);
  const toggle = () => setEnabled(current => {
    const next = !current;
    if (next) startMusic();
    else contextRef.current?.suspend().catch(() => {});
    return next;
  });
  useEffect(() => {
    const handleButtonSound = event => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      if (!button || button.disabled) return;
      const kind = button.dataset.sfx
        || (button.matches('.game-card') ? 'card'
          : button.matches('.map-node') ? 'route'
            : button.matches('.confirm-danger, .danger') ? 'warning'
              : button.matches('.primary, .depart-button, .end-turn') ? 'confirm' : 'tap');
      playSfx(kind);
    };
    document.addEventListener('click', handleButtonSound, true);
    return () => document.removeEventListener('click', handleButtonSound, true);
  }, [enabled]);
  useEffect(() => () => { sourceRef.current?.stop(); contextRef.current?.close(); }, []);
  return <MusicContext.Provider value={{ enabled, toggle, playSfx }}>{children}</MusicContext.Provider>;
}

function MusicToggle({ compact = false }) {
  const { enabled, toggle } = React.useContext(MusicContext);
  const Icon = enabled ? Volume2 : VolumeX;
  return <button type="button" className={`music-control secondary ${compact ? 'compact' : ''}`} onClick={toggle} aria-label={enabled ? '关闭游戏声音' : '开启游戏声音'} aria-pressed={enabled}><Icon />{!compact && <span>声音{enabled ? '开启' : '关闭'}</span>}</button>;
}

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
  return <div className="value-floaters" aria-live="polite">{items.map(item => <span key={item.key} className={item.tone || (item.value >= 0 ? 'gain' : 'loss')}>{item.text || <>{item.label} {item.value > 0 ? '+' : ''}{item.value}</>}</span>)}</div>;
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

function CardView({ cardKey, onClick, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, handIndex, disabled = false, preview = null, compact = false, active = false, selected = false, detached = false, playReady = false, ghost = false, ghostTarget = false, isNew = false, style }) {
  const c = card(cardKey);
  const Icon = ICONS[c.icon] || Sparkles;
  const interactive = Boolean(onClick || onPointerDown);
  return (
    <button className={`game-card ${c.type} ${c.equipmentGranted ? 'equipment-granted' : ''} ${compact ? 'compact' : ''} ${active ? 'auto-active' : ''} ${selected ? 'selected' : ''} ${detached ? 'detached' : ''} ${playReady ? 'play-ready' : ''} ${ghost ? 'throw-ghost' : ''} ${ghostTarget ? 'enemy-target' : ''} ${interactive ? '' : 'read-only'}`} style={style} data-hand-index={handIndex} tabIndex={ghost ? -1 : undefined} aria-hidden={ghost || undefined} onClick={onClick} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} disabled={disabled}>
      <span className="card-cost">{c.cost}</span>
      {isNew && <span className="new-badge">NEW</span>}
      <span className="card-school">{c.equipmentGranted ? '装备技' : c.school}</span>
      <span className="card-art pixel-art" style={cardAtlasStyle(cardKey)}><i className="card-category"><Icon size={compact ? 12 : 14} strokeWidth={1.8} /></i></span>
      <strong>{c.name}</strong>
      <span className="card-rule">{description(cardKey).join('。')}。</span>
      {preview?.total > 0 && <span className="card-preview">预计伤害 {preview.total}</span>}
      <em>{c.flavor}</em>
    </button>
  );
}

function JourneySetup({ onBack, onStart }) {
  const [mode, setMode] = useState('manual');
  const [difficulty, setDifficulty] = useState('standard');
  const [character, setCharacter] = useState('gaigai');
  const [step, setStep] = useState('character');
  const back = () => step === 'rules' ? setStep('character') : onBack();
  return <main className="journey-setup">
    <div className="splash-art camper-art" style={{ backgroundImage: `url(${camperPixel})` }} />
    <div className="setup-shade" />
    <button className="icon-button setup-back" onPointerDown={capturePress} onClick={back} aria-label="返回上一步"><ArrowLeft /></button>
    <section className={`setup-copy ${step === 'character' ? 'character-step' : ''}`}>
      <span className="eyebrow">NEW JOURNEY</span>
      <h1>{step === 'character' ? '今晚谁值班？' : '准备启程'}</h1>
      <p>{step === 'character' ? '角色特性会改变初始牌组和更容易遇到的技能流派。' : `已选择 ${CHARACTERS[character].name}，再决定本次旅程的出牌方式与难度。`}</p>
      {step === 'character' ? <div className="character-picker">
        {Object.entries(CHARACTERS).map(([key, hero]) => <button key={key} className={`character-choice ${character === key ? 'active' : ''}`} onClick={() => setCharacter(key)}>
          <span className="character-portrait pixel-art" style={characterStyle(key)} />
          <span className="character-heading"><strong>{hero.name}</strong>{hero.recommended && <em>新手推荐</em>}</span>
          <b>{hero.style}</b>
          <p>{hero.description}</p>
        </button>)}
      </div> : <div className="splash-settings">
        <div className="setting-group" onClick={event => handleSegmentFrame(event, ['auto', 'manual'], setMode)}><small>出牌方式</small><div className="mode-switch" aria-label="出牌方式">
          <button className={mode === 'auto' ? 'active' : ''} onPointerDown={capturePress} onClick={() => setMode('auto')}><Sparkles />自动出牌</button>
          <button className={mode === 'manual' ? 'active' : ''} onPointerDown={capturePress} onClick={() => setMode('manual')}><Swords />手动出牌</button>
        </div><p className="difficulty-hint">{mode === 'auto' ? '托管会根据敌方意图选择攻防与恢复，但复杂组合仍由手动操作更稳。' : '根据敌方下一步行动安排攻击与防御。'}</p></div>
        <div className="setting-group" onClick={event => handleSegmentFrame(event, Object.keys(DIFFICULTIES), setDifficulty)}><small>旅程难度</small><div className="difficulty-switch" aria-label="旅程难度">
          {Object.entries(DIFFICULTIES).map(([key, item]) => <button key={key} className={difficulty === key ? 'active' : ''} onPointerDown={capturePress} onClick={() => setDifficulty(key)}>{item.name}</button>)}
        </div><p className="difficulty-hint">{DIFFICULTIES[difficulty].hint}</p></div>
      </div>}
      {step === 'character'
        ? <button className="primary setup-start" onPointerDown={capturePress} onClick={() => setStep('rules')}>选择 {CHARACTERS[character].name}，下一步</button>
        : <button className="primary setup-start" onPointerDown={capturePress} onClick={() => onStart(mode, difficulty, character)}><Moon />进入房车</button>}
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
          <MusicToggle />
        </div>
      </section>
    </main>
  );
}

const featureUnlocks = state => ({
  bag: state.victories > 0 || state.inventory.length > 2,
  workshop: state.stepsTraveled >= 10 || state.inventory.length >= 5,
  guests: state.clears.some(count => count > 0),
});

function CamperHub({ state, dispatch, onDrawer, onWorkshop, onGuests }) {
  const initialDestination = Math.min(state.stage, state.unlocked);
  const [selected, setSelected] = useState(initialDestination);
  const [departureRow, setDepartureRow] = useState(state.chapterCheckpoints?.[initialDestination] ?? -1);
  const destination = CHAPTERS[selected];
  const selectedCheckpoint = state.chapterCheckpoints?.[selected] ?? -1;
  const availableWaypoints = [-1, ...CHECKPOINT_STEPS.map(step => step - 1).filter(row => row <= selectedCheckpoint)];
  const { bag: bagUnlocked, workshop: workshopUnlocked, guests: guestsUnlocked } = featureUnlocks(state);
  const actionCount = Number(bagUnlocked) + Number(workshopUnlocked) + Number(guestsUnlocked);
  return <main className="camper-hub">
    <div className="hub-background" style={{ backgroundImage: `url(${camperPixel})` }} />
    <div className="hub-shade" />
    <header className="hub-topbar">
      <button className="hub-character" onPointerDown={capturePress} onClick={onDrawer} aria-label={`查看${CHARACTERS[state.character].name}的角色与装备`}>
        <span className="hub-character-avatar pixel-art" style={characterStyle(state.character, 2.2)} />
        <span><small className="eyebrow">DAY {state.victories + 1} · 黄昏</small><strong>{CHARACTERS[state.character].name} · 晚安旅行屋</strong></span>
      </button>
      <div className="hub-resources"><Tip text="生命归零时本局直接结束，需要重新开始旅程。"><span><Heart />{state.hp}/{state.maxHp}</span></Tip><Tip text="旅币用于工坊重抽属性、升级房车和旅途交易。"><span><Coins />{state.gold}</span></Tip></div>
      {bagUnlocked ? <button className="icon-button" onPointerDown={capturePress} onClick={onDrawer} aria-label="打开装备与背包"><Menu /></button> : <span />}
    </header>
    <section className="hub-copy">
      <span className="eyebrow">今晚停靠在</span>
      <h1>{destination.name}</h1>
      <p>{destination.weather} · {destination.subtitle}</p>
      {selectedCheckpoint >= 0 && <label className="waypoint-picker">
        <span>启程位置</span>
        <select value={departureRow} onChange={event => setDepartureRow(Number(event.target.value))}>
          {availableWaypoints.map(row => <option key={row} value={row}>{row < 0 ? '第 1 步 · 夜程起点' : `第 ${row + 1} 步 · 已点亮休息站`}</option>)}
        </select>
      </label>}
      <button className="depart-button" onPointerDown={capturePress} onClick={() => dispatch({ type: 'depart', stage: selected, row: departureRow })}><Moon />{departureRow >= 0 ? `传送至第 ${departureRow + 1} 步` : '从第 1 步启程'}</button>
      <small>{selectedCheckpoint >= 0 ? `已点亮第 10 至 ${selectedCheckpoint + 1} 步休息站，可随时传送` : '50 步夜程 · 每 10 步停靠路标 · 首领掉落区域专属装备'}</small>
    </section>
    <nav className="destination-strip" aria-label="选择目的地">
      {CHAPTERS.map((chapter, index) => {
        const locked = index > state.unlocked;
        return <button key={chapter.name} className={selected === index ? 'active' : ''} disabled={locked} onPointerDown={capturePress} onClick={() => { setSelected(index); setDepartureRow(state.chapterCheckpoints?.[index] ?? -1); }} style={{ '--destination': chapter.color }}>
          <span>{locked ? <Lock /> : <MapPin />}</span><b>{chapter.name}</b><small>{locked ? '完成上一站后解锁' : (state.chapterCheckpoints?.[index] ?? -1) >= 0 ? `第 ${state.chapterCheckpoints[index] + 1} 步路标` : state.clears[index] ? `已探索 ${state.clears[index]} 次` : '新目的地'}</small>
        </button>;
      })}
    </nav>
    {actionCount > 0 && <div className="hub-actions" style={{ '--action-count': actionCount }}>
      {bagUnlocked && <button className={!state.featureSeen.bag ? 'feature-new' : ''} onPointerDown={capturePress} onClick={onDrawer}><PackageOpen /><span><b>整理行囊</b><small>装备、背包与卡牌</small></span></button>}
      {workshopUnlocked && <button className={!state.featureSeen.workshop ? 'feature-new' : ''} onPointerDown={capturePress} onClick={onWorkshop}><Wrench /><span><b>房车工坊</b><small>重抽属性、拆解装备</small></span></button>}
      {guestsUnlocked && <button className={!state.featureSeen.guests ? 'feature-new' : ''} onPointerDown={capturePress} onClick={onGuests}><House /><span><b>客人房间</b><small>故事进度与专属纪念品</small></span></button>}
    </div>
    }
  </main>;
}

function Battle({ state, dispatch, outcome = null, battleSpeed = 1, onBattleSpeed }) {
  const { open: tipOpen } = React.useContext(TooltipContext);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [selectedCard, setSelectedCard] = useState(-1);
  const [dragX, setDragX] = useState(0);
  const [dragLift, setDragLift] = useState(0);
  const [cardDetached, setCardDetached] = useState(false);
  const [playReady, setPlayReady] = useState(false);
  const [throwGhosts, setThrowGhosts] = useState([]);
  const handGesture = useRef(null);
  const dissolveTimers = useRef(new Set());
  const handGap = state.hand.length <= 1 ? 0
    : state.hand.length === 2 ? 12
      : state.hand.length === 3 ? 4
        : state.hand.length === 4 ? -24
          : state.hand.length === 5 ? -48
            : -64;
  const enemy = enemyFor(state);
  const move = intent(state);
  const battleEquipmentStats = equipmentStats(state);
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
  const spawnThrowGhost = (cardKey, rect) => {
    if (!rect) return;
    const c = card(cardKey);
    const enemyTarget = Boolean(c.damage || c.mark || c.markBurst || c.consumeMark);
    const enemyRect = enemyTarget ? document.querySelector('.enemy-sprite')?.getBoundingClientRect() : null;
    const ghostId = `${Date.now()}-${cardKey}`;
    setThrowGhosts(current => [...current, {
      id: ghostId, cardKey, left: rect.left, top: rect.top, width: rect.width, height: rect.height,
      enemyTarget: Boolean(enemyRect),
      throwX: enemyRect ? enemyRect.left + enemyRect.width / 2 - (rect.left + rect.width / 2) : 0,
      throwY: enemyRect ? enemyRect.top + enemyRect.height / 2 - (rect.top + rect.height / 2) : 0,
    }]);
    const timer = window.setTimeout(() => {
      setThrowGhosts(current => current.filter(item => item.id !== ghostId));
      dissolveTimers.current.delete(timer);
    }, enemyRect ? 460 : 340);
    dissolveTimers.current.add(timer);
  };
  useEffect(() => {
    if (state.battleMode !== 'auto' || state.phase !== 'combat' || !state.tutorialDone || tipOpen) return undefined;
    const timer = window.setTimeout(() => {
      const activeCard = document.querySelector('.hand .game-card.auto-active');
      if (autoIndex >= 0 && activeCard) spawnThrowGhost(state.hand[autoIndex], activeCard.getBoundingClientRect());
      dispatch({ type: 'auto' });
    }, 720 / battleSpeed);
    return () => window.clearTimeout(timer);
  }, [state, dispatch, tipOpen, battleSpeed]);
  useEffect(() => {
    const element = battleLogRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [state.battleLog.length]);
  useEffect(() => {
    setSelectedCard(-1);
    setDragX(0);
    setDragLift(0);
    setCardDetached(false);
    setPlayReady(false);
  }, [state.hand, state.turn]);
  useEffect(() => () => dissolveTimers.current.forEach(timer => window.clearTimeout(timer)), []);
  const playThreshold = () => Math.min(48, window.innerHeight * .065);
  const beginCardGesture = (index, event) => {
    if (state.battleMode === 'auto' || card(state.hand[index]).cost > state.energy) return;
    event.preventDefault();
    handGesture.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, index, detached: false };
    setSelectedCard(index);
    setDragX(0);
    setDragLift(0);
    setCardDetached(false);
    setPlayReady(false);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveCardGesture = event => {
    const gesture = handGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    event.preventDefault();
    const swipeDistance = Math.max(0, gesture.startY - event.clientY);
    const threshold = playThreshold();
    if (gesture.detached) {
      if (swipeDistance < threshold) {
        gesture.detached = false;
        delete gesture.detachX;
        delete gesture.detachY;
        delete gesture.detachLift;
        setDragX(0);
        setDragLift(-swipeDistance);
        setCardDetached(false);
        setPlayReady(false);
      } else {
        setDragX(event.clientX - gesture.detachX);
        setDragLift(gesture.detachLift + event.clientY - gesture.detachY);
        return;
      }
    }
    setDragLift(-Math.min(threshold, swipeDistance));
    if (swipeDistance >= threshold) {
      gesture.detached = true;
      gesture.detachX = event.clientX;
      gesture.detachY = event.clientY;
      gesture.detachLift = -threshold;
      setCardDetached(true);
      setPlayReady(true);
      return;
    }
    const hand = event.currentTarget.closest('.hand');
    const candidates = [...hand.querySelectorAll('.game-card:not(:disabled)')];
    const nearest = candidates.reduce((best, element) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(event.clientX - (rect.left + rect.width / 2));
      return !best || distance < best.distance ? { element, distance } : best;
    }, null);
    if (!nearest) return;
    const index = Number(nearest.element.dataset.handIndex);
    if (index !== gesture.index) {
      gesture.index = index;
      setSelectedCard(index);
    }
  };
  const finishCardGesture = (event, cancelled = false) => {
    const gesture = handGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    event.preventDefault();
    handGesture.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const swipeDistance = gesture.startY - event.clientY;
    if (!cancelled && (gesture.detached || swipeDistance >= playThreshold())) {
      const hand = event.currentTarget.closest('.hand');
      const playedElement = hand?.querySelector(`[data-hand-index="${gesture.index}"]`);
      const rect = playedElement?.getBoundingClientRect();
      spawnThrowGhost(state.hand[gesture.index], rect);
      setDragX(0);
      setDragLift(0);
      setCardDetached(false);
      setPlayReady(false);
      dispatch({ type: 'play', index: gesture.index });
      return;
    }
    setDragX(0);
    setDragLift(0);
    setCardDetached(false);
    setPlayReady(false);
  };
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
          {enemy.trait && <div className="enemy-trait"><b>{enemy.trait}</b><span>{enemy.traitText}</span></div>}
          {state.enemy.mark > 0 && <Tip text="当前弱点层数就是下一段攻击追加的无视护盾伤害。每段消耗 1 层，因此 4 层弱点会依次追加 4、3、2、1 点伤害。"><div className="mark"><Target size={14} />弱点 {state.enemy.mark}</div></Tip>}
        </div>
      </section>

      <section className={`combat-ui battle-speed-scope ${playerHit ? 'player-damaged' : ''}`} style={{ '--battle-speed': battleSpeed }}>
        <div key={`player-${state.hp}`} className={`player-row ${playerHit ? 'player-hit' : ''} ${playerDelta?.value > 0 ? 'player-healed' : ''} ${playerGuarded ? 'player-guarded' : ''}`}>
          {playerHit && <div key={`scratch-${actionKey}`} className="player-scratch" aria-hidden="true"><i /><i /><i /></div>}
          {playerDelta?.value > 0 && <div key={`heal-${playerDelta.key}`} className="player-heal-effect" aria-hidden="true"><i /><i /><i /></div>}
          <span className="battle-character-avatar pixel-art" style={characterStyle(state.character, 2.2)} aria-label={CHARACTERS[state.character].name} />
          <div className="player-health">
            <div><span className="level-pill">Lv.{state.level}</span><small>{CHARACTERS[state.character].name}</small><Heart size={18} fill="currentColor" /><strong>{state.hp}</strong><span>/ {state.maxHp}</span>{state.block > 0 && <Tip text={state.character === 'xiaoshuai' ? '护盾优先抵消伤害；小帅会反击 35%，并把剩余护盾的 20% 带到下回合。' : '护盾会优先抵消伤害，并在敌人行动后清空。'}><b><Shield size={15} />{state.block}</b></Tip>}</div>
            <Bar value={state.hp} max={state.maxHp} />
          </div>
          <Tip text="能量用于打出卡牌，每回合开始时恢复至 3。"><div key={`energy-${actionKey}`} className={`energy ${energyGain ? 'energy-gain' : ''}`}><Sparkles size={18} /><strong>{state.energy}</strong><span>/ 3</span></div></Tip>
          {playerDelta && <em key={playerDelta.key} className={`health-delta player-delta ${playerDelta.value > 0 ? 'heal' : 'damage'}`}>{playerDelta.value > 0 ? '+' : ''}{playerDelta.value}</em>}
          <div className="player-stat-deltas">{statDeltas.filter(item => ['player-block', 'energy'].includes(item.kind)).map(item => <em key={item.key} className={`stat-delta ${item.value > 0 ? 'gain' : 'loss'}`}>{item.label} {item.value > 0 ? '+' : ''}{item.value}</em>)}</div>
        </div>
        <div className="battle-equipment-stats" aria-label="当前装备加成">
          <span title="加到每张攻击牌的基础伤害"><Swords /><small>伤害</small><b>+{battleEquipmentStats.attack}</b></span>
          <span title="每回合开始时获得的护盾"><Shield /><small>护盾</small><b>+{battleEquipmentStats.block}</b></span>
          <span title="每场战斗胜利后的额外恢复"><Heart /><small>恢复</small><b>+{battleEquipmentStats.recovery}</b></span>
          <span title="加到弱点牌发现的弱点层数"><Target /><small>弱点</small><b>+{battleEquipmentStats.markPower}</b></span>
        </div>
        <div className="battle-statuses">
          {state.weak > 0 && <Tip text="虚弱会让你造成的基础伤害降低 25%，持续到下一回合。"><div className="status"><Moon size={14} />虚弱：伤害 -25%</div></Tip>}
          {state.character === 'gaigai' && state.warmth > 0 && <Tip text="每张治疗牌每 3 点最终治疗量积攒 1 点暖意，向上取整。暖意没有上限，下一张攻击牌会消耗全部暖意并追加等量伤害。"><div className="status warmth-status"><Flame size={14} />暖意 {state.warmth}</div></Tip>}
        </div>
        <div className="combat-body">
          <div className={`hand ${state.battleMode === 'auto' ? 'auto' : ''}`} style={{ '--fan-gap': `${handGap}px` }} aria-label="手牌">
            {state.hand.map((key, index) => {
              const offset = index - (state.hand.length - 1) / 2;
              return (
              <CardView key={`${key}-${index}`} cardKey={key} disabled={state.battleMode === 'auto' || card(key).cost > state.energy}
                preview={attackBreakdown(state, key)} active={index === autoIndex} selected={index === selectedCard} detached={index === selectedCard && cardDetached} playReady={index === selectedCard && playReady}
                style={{ '--fan-offset': offset, '--fan-y': Math.abs(offset) * 7, '--fan-z': 20 - Math.round(Math.abs(offset)), '--drag-x': `${index === selectedCard ? dragX : 0}px`, '--drag-lift': `${index === selectedCard ? dragLift : 0}px` }}
                handIndex={index} onPointerDown={event => beginCardGesture(index, event)} onPointerMove={moveCardGesture}
                onPointerUp={event => finishCardGesture(event)} onPointerCancel={event => finishCardGesture(event, true)} />
              );
            })}
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
      {throwGhosts.map(item => <CardView key={item.id} cardKey={item.cardKey} ghost ghostTarget={item.enemyTarget} style={{ left: item.left, top: item.top, width: item.width, height: item.height, '--throw-x': `${item.throwX}px`, '--throw-y': `${item.throwY}px` }} />)}
      {!state.tutorialDone && <div className="tutorial-backdrop"><section className="tutorial-card"><span>{tutorialStep + 1} / 3</span><h2>{['上滑打出卡牌', '观察能量与护盾', '抓住敌人弱点'][tutorialStep]}</h2><p>{['按住卡牌左右移动可换牌；上滑越过金色提示后，卡牌会脱离牌组并跟随手指，松手即可打出。自动模式会替你操作。', '每张牌消耗能量；护盾会先抵消伤害。每回合开始时能量恢复至 3。', '部分卡牌会发现弱点：每段攻击消耗 1 层，并额外造成 3 点无视护盾的生命伤害。多段攻击可以连续触发。'][tutorialStep]}</p><button className="primary" onClick={() => tutorialStep < 2 ? setTutorialStep(tutorialStep + 1) : dispatch({ type: 'tutorialDone' })}>{tutorialStep < 2 ? '下一步' : '开始战斗'}</button></section></div>}
    </>
  );
}

function Reward({ state, dispatch }) {
  const [reviewing, setReviewing] = useState(false);
  const [confirmingSkip, setConfirmingSkip] = useState(false);
  const [picked, setPicked] = useState(null);
  const pickTimer = useRef(null);
  const loots = (state.lastLoots || []).map(id => itemFor(state, id)).filter(Boolean);
  const pickedRank = picked ? skillRewardRank(state, picked) : 0;
  const pickedCard = picked ? card(rankedCardKey(picked, pickedRank)) : null;
  useEffect(() => () => window.clearTimeout(pickTimer.current), []);
  const chooseReward = key => {
    if (picked) return;
    setPicked(key);
    pickTimer.current = window.setTimeout(() => dispatch({ type: 'reward', key }), 650);
  };
  return <Overlay variant="reward" background={PIXEL_BACKGROUNDS[state.stage]} eyebrow="DREAM CLEARED · 恭喜" title="胜利" text="梦境已经安宁，今晚的旅途仍会继续。">
    <div className="result-character"><span className="result-character-avatar pixel-art" style={characterStyle(state.character, 2)} /><p><strong>{CHARACTERS[state.character].name}</strong>“{CHARACTER_LINES[state.character].victory}”</p></div>
    <button className="review-button" onClick={() => setReviewing(true)}><BookOpen size={16} />回顾战斗</button>
    {loots.length > 0 && <div className="reward-loots">{loots.map(loot => <div key={loot.id} className={`loot-banner rarity-${loot.rarity}`}><Backpack /><span><small>物品等级 {loot.itemLevel} · {itemTier(loot).name} · 已放入背包</small><strong>{itemName(loot)}</strong><em>{itemLines(loot).join(' · ')}</em></span><b>{loot.rarity}</b></div>)}</div>}
    <div className="reward-progress"><span>角色等级 {state.level}</span><span>{state.xp} / {state.nextXp} XP</span></div>
    <Bar value={state.xp} max={state.nextXp} tone="xp" />
    <section className={`reward-choice-block ${picked ? 'has-picked' : ''}`}><h3 className="reward-heading">{picked ? '这段回忆已经收好' : '选择一张技能收入候补'}</h3>{pickedCard && <div className="reward-picked" role="status" aria-live="polite"><Check /><span><small>已收入候补</small><strong>{pickedCard.name} · Lv.{pickedCard.rank}</strong></span></div>}<div className="reward-grid">{state.choices.map((key, index) => {
      const offset = index - (state.choices.length - 1) / 2;
      const previewRank = skillRewardRank(state, key);
      return <CardView key={key} cardKey={rankedCardKey(key, previewRank)} compact active={picked === key} style={{ '--fan-offset': offset, '--fan-y': Math.abs(offset) * 5, '--fan-z': 10 - Math.abs(offset) }} onClick={() => chooseReward(key)} disabled={Boolean(picked)} />;
    })}</div></section>
    <button className="skip-reward-button secondary" disabled={Boolean(picked)} onClick={() => setConfirmingSkip(true)}>放弃选牌</button>
    {reviewing && <BattleReview entries={state.battleLog} enemyName={enemyFor(state).name} onClose={() => setReviewing(false)} />}
    {confirmingSkip && <SkipCardRewardConfirm onCancel={() => setConfirmingSkip(false)} onConfirm={() => dispatch({ type: 'reward', key: null })} />}
  </Overlay>;
}

const NODE_META = {
  battle: { label: '普通战斗', icon: Moon, tip: '普通战斗：难度较低，胜利后获得经验、卡牌和随机装备。' },
  elite: { label: '精英战斗', icon: Crown, tip: '精英战斗：敌人更强，但装备品质和旅币奖励更高。' },
  mystery: { label: '未知际遇', icon: CircleHelp, tip: '未知际遇：踏入后才会随机揭晓休息、合成、整备、沿途事件或低概率负面事件。' },
  checkpoint: { label: '路标', icon: MapPin, tip: '路标：每 10 步出现，可回满生命继续探索，或安全返回房车。' },
  boss: { label: '首领', icon: Flame, tip: '区域首领：击败后完成本章并解锁下一站。' },
};

function JourneyRewardsModal({ state, onClose }) {
  const [selectedGear, setSelectedGear] = useState(null);
  const cards = state.journeyCardDrops || [];
  const items = (state.journeyNewItems || []).map(id => itemFor(state, id)).filter(Boolean);
  const total = cards.length + items.length;
  return <div className="journey-cards-backdrop" onClick={onClose}>
    <section className="journey-cards-dialog" role="dialog" aria-modal="true" aria-labelledby="journey-cards-title" onClick={event => event.stopPropagation()}>
      <header><div><small>本次夜程收获</small><h2 id="journey-cards-title">本次收获</h2><p>共 {total} 件 · 卡牌 {cards.length} · 装备 {items.length}</p></div><button onClick={onClose}>关闭</button></header>
      {total > 0 ? <div className="journey-rewards-content">
        {cards.length > 0 && <section className="journey-reward-section"><header><strong>获得的卡牌</strong><span>{cards.length} 张</span></header><div className="journey-cards-grid">{cards.map((key, index) => <CardView key={`${key}-${index}`} cardKey={key} compact isNew />)}</div></section>}
        {items.length > 0 && <section className="journey-reward-section"><header><strong>获得的装备</strong><span>{items.length} 件</span></header><div className="journey-gear-grid">{items.map(item => <GearRow key={item.id} item={item} equipped={Object.values(state.equipment).includes(item.id)} isNew onOpen={() => setSelectedGear(item.id)} />)}</div><small className="journey-readonly-hint">旅途中只能查看，回到房车后才能更换装备。</small></section>}
      </div> : <div className="journey-cards-empty"><BookOpen /><strong>还没有获得收获</strong><span>战斗胜利和部分沿途事件会带来新卡牌与装备。</span></div>}
    </section>
    {selectedGear && itemFor(state, selectedGear) && <div onClick={event => event.stopPropagation()}><GearDetail state={state} item={itemFor(state, selectedGear)} disabled onClose={() => setSelectedGear(null)} onEquip={() => {}} /></div>}
  </div>;
}

function MapView({ state, dispatch }) {
  const { show } = React.useContext(TooltipContext);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [showJourneyCards, setShowJourneyCards] = useState(false);
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
  const atCheckpoint = state.mapRow === state.checkpointRow;
  const equipped = new Set(Object.values(state.equipment).filter(Boolean));
  const unsecuredItemCount = (state.unsecuredLoot || []).filter(id => itemFor(state, id) && !equipped.has(id)).length;
  const unsecuredCardCount = (state.unsecuredCards || []).length;
  const journeyItemCount = (state.journeyNewItems || []).filter(id => itemFor(state, id)).length;
  const journeyRewardCount = (state.journeyCardDrops?.length || 0) + journeyItemCount;
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const targetRow = state.mapRow < 0 ? 0 : Math.min(MAP_STEPS - 1, state.mapRow + 1);
    scroller.scrollTop = Math.max(0, y(targetRow) - scroller.clientHeight * .68);
  }, [state.mapRow, state.stage]);
  return <section className="map-view">
    <div className="map-art pixel-art" style={{ backgroundImage: `url(${PIXEL_BACKGROUNDS[state.stage]})` }} /><div className="map-shade" />
    <header className="map-heading"><span className="eyebrow">第 {state.stage + 1} 站 · 第 {segment + 1} 段</span><h1>{chapter.name}</h1><p>{SEGMENT_NAMES[segment]} · 选择发光的下一节点，穿过 50 段夜路。</p></header>
    <div className="map-stats"><Tip text="提升等级会增加生命上限；经验来自战斗。"><span><TrendingUp />Lv.{state.level}</span></Tip><Tip text="当前生命。降到 0 时本局直接结束。"><span><Heart />{state.hp}/{state.maxHp}</span></Tip><Tip text="旅币可用于工坊、设施升级与旅途交易。"><span><Coins />{state.gold}</span></Tip><div className="map-actions"><button onClick={() => setConfirmReturn(true)}>返回房车</button><button onClick={() => setShowJourneyCards(true)}>本次收获 {journeyRewardCount}</button></div></div>
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
        const meta = NODE_META[node.type];
        const visited = state.visited.includes(node.id), enabled = available.has(node.id), current = state.currentNode === node.id;
        const nodeCooldown = node.type === 'mystery' ? magicHouseCooldownRemaining(state, node.id) : 0;
        const coolingDown = nodeCooldown > 0;
        const Icon = coolingDown ? Hourglass : meta.icon;
        return <button key={node.id} className={`map-node ${node.type} ${coolingDown ? 'cooldown' : ''} ${visited ? 'visited' : ''} ${enabled ? 'available' : ''} ${current ? 'current' : ''}`}
          style={{ left: `${node.x}%`, top: `${y(node.row)}px` }} aria-disabled={!enabled} onClick={event => enabled ? dispatch({ type: 'node', id: node.id }) : coolingDown ? show(`魔法屋重新洗牌中，还需前进 ${nodeCooldown} 步。`, event) : show(visited ? '这个节点已经走过。' : '需要沿当前节点亮起的连线继续前进。', event)} aria-label={`${meta.label} · 第 ${node.row + 1} 步${coolingDown ? ` · 冷却剩余 ${nodeCooldown} 步` : ''}`}>
          {current ? <i className="map-character-avatar pixel-art" style={characterStyle(state.character, 2.3)} /> : <Icon />}<span>{coolingDown ? `${nodeCooldown} 步` : enabled ? '可前往' : meta.label}</span>
        </button>;
      })}
    </div></div>
    <div className="map-legend">{Object.entries(NODE_META).map(([key, meta]) => <Tip key={key} text={meta.tip}><span><meta.icon />{meta.label}</span></Tip>)}</div>
    {confirmReturn && <ReturnHubConfirm safe={atCheckpoint} atStart={state.mapRow < 0} unsecuredItemCount={unsecuredItemCount} unsecuredCardCount={unsecuredCardCount} onCancel={() => setConfirmReturn(false)} onConfirm={() => { setConfirmReturn(false); dispatch({ type: 'returnHub' }); }} />}
    {showJourneyCards && <JourneyRewardsModal state={state} onClose={() => setShowJourneyCards(false)} />}
  </section>;
}

function MysteryStation({ state, dispatch }) {
  const { playSfx } = React.useContext(MusicContext);
  const [rolling, setRolling] = useState(true);
  const [reelIndex, setReelIndex] = useState(0);
  const result = MYSTERY_STATIONS.find(station => station.type === state.mysteryResult) || MYSTERY_STATIONS[0];
  useEffect(() => {
    playSfx('mysteryTick');
    const interval = window.setInterval(() => {
      setReelIndex(index => (index + 1) % MYSTERY_STATIONS.length);
      playSfx('mysteryTick');
    }, 120);
    const timer = window.setTimeout(() => {
      window.clearInterval(interval);
      setRolling(false);
      playSfx(state.mysteryResult === 'negative' ? 'mysteryBad' : 'mysteryReveal');
    }, 1080);
    return () => { window.clearInterval(interval); window.clearTimeout(timer); };
  }, []);
  const shown = rolling ? MYSTERY_STATIONS[reelIndex] : result;
  return <Overlay background={PIXEL_BACKGROUNDS[state.stage]} eyebrow="未知际遇" title="命运魔法屋" text="路上的故事正在重新洗牌，停下时才知道今晚会遇见什么。" variant="mystery-overlay">
    <div className={`mystery-machine ${rolling ? 'is-rolling' : 'is-revealed'}`}>
      <div className="mystery-lights" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} />)}</div>
      <div className="mystery-window"><CircleHelp /><small>{rolling ? '沿途事件抽取中' : '本次际遇'}</small><strong>{shown.label}</strong></div>
      <div className="mystery-track" aria-hidden="true">{MYSTERY_STATIONS.map(station => <span key={station.type}>{station.label}</span>)}</div>
    </div>
    <button className="primary mystery-enter" disabled={rolling} onClick={() => dispatch({ type: 'mystery' })}>{rolling ? '正在揭晓...' : `进入${result.label}`}</button>
  </Overlay>;
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
      <CampChoice icon={Shield} title="购买柔软靠枕" text="30 旅币 · 每回合获得 2 点护盾" disabled={state.gold < 30 || state.relic} onClick={() => dispatch({ type: 'camp', choice: 'relic' })} />
    </div>
  </Overlay>;
}

function MemoryStation({ state, dispatch }) {
  const [merging, setMerging] = useState(null);
  const mergeTimer = useRef(null);
  const mergeable = useMemo(() => {
    const counts = new Map();
    for (const key of state.cardLibrary) counts.set(key, (counts.get(key) || 0) + 1);
    return [...counts.entries()]
      .filter(([key, count]) => count >= 2 && cardRank(key) < 10 && !key.endsWith('~gear'))
      .sort(([left], [right]) => cardRank(left) - cardRank(right) || card(left).name.localeCompare(card(right).name, 'zh-CN'));
  }, [state.cardLibrary]);
  useEffect(() => () => window.clearTimeout(mergeTimer.current), []);
  const merge = key => {
    if (merging) return;
    setMerging(key);
    mergeTimer.current = window.setTimeout(() => dispatch({ type: 'memory', cardKey: key }), 1200);
  };
  return <Overlay background={PIXEL_BACKGROUNDS[state.stage]} eyebrow="技能合成站" title="整理回忆" text="选择一组相同回忆：两张同名、同等级技能合成为一张高一级技能。">
    {mergeable.length ? <div className={`memory-grid ${merging ? 'is-merging' : ''}`}>{mergeable.map(([key, count]) => <div className="memory-choice" key={key}>
      <CardView cardKey={key} compact onClick={() => merge(key)} />
      <strong>{count} 张 Lv.{cardRank(key)}</strong>
      <span>合成为 1 张 Lv.{cardRank(key) + 1}</span>
    </div>)}</div> : <div className="memory-empty"><Combine /><strong>暂时没有可以合成的技能</strong><p>需要至少两张同名、同等级且未满级的卡牌。</p></div>}
    <button className="memory-leave secondary" disabled={Boolean(merging)} onClick={() => dispatch({ type: 'memory', cardKey: null })}>{mergeable.length ? '暂不整理' : '继续赶路'}</button>
    {merging && <div className="memory-merge-feedback" role="status" aria-live="polite">
      <div className="memory-merge-stage">
        <span className="memory-merge-source source-left"><CardView cardKey={merging} compact /></span>
        <span className="memory-merge-source source-right"><CardView cardKey={merging} compact /></span>
        <Combine className="memory-merge-icon" />
        <span className="memory-merge-result"><CardView cardKey={upgradeCardKey(merging)} compact /></span>
      </div>
      <strong>{card(merging).name}合成成功</strong>
      <span>Lv.{cardRank(merging)} → Lv.{cardRank(merging) + 1}</span>
    </div>}
  </Overlay>;
}

function CardLibraryPanel({ state, dispatch }) {
  const { show } = React.useContext(TooltipContext);
  const [pendingDiscard, setPendingDiscard] = useState(null);
  const canManage = ['hub', 'loadout'].includes(state.phase);
  const groups = useMemo(() => {
    const counts = new Map();
    for (const key of state.cardLibrary) counts.set(key, { key, total: (counts.get(key)?.total || 0) + 1, active: 0 });
    for (const key of state.deck) {
      const group = counts.get(key);
      if (group) group.active++;
    }
    return [...counts.values()].sort((left, right) => compareCardKeys(left.key, right.key));
  }, [state.cardLibrary, state.deck]);
  const manage = (operation, group, event) => {
    if (!canManage) return show('只有在房车或牌组整备站才能调整出战牌组。', event);
    if (operation === 'activate' && group.active >= group.total) return show('这张牌没有候补副本，无法继续上场。', event);
    if (operation === 'bench' && group.active <= 0) return show('这张牌当前不在出战牌组中。', event);
    if (operation === 'bench' && state.deck.length <= 10) return show('出战牌组至少保留 10 张，当前不能下场。', event);
    if (operation === 'discard') {
      if (state.phase !== 'hub') return show('永久丢弃只能在房车内进行，避免影响本次探索的遗失判定。', event);
      const hasBenchedCopy = group.total > group.active;
      if (!hasBenchedCopy && state.deck.length <= 10) return show('没有候补副本，且出战牌组至少需要保留 10 张。', event);
      setPendingDiscard(group);
      return;
    }
    dispatch({ type: 'loadout', operation, key: group.key });
  };
  return <div className="card-library">
    <header><span><strong>出战 {state.deck.length} 张</strong><small>技能库 {state.cardLibrary.length} 张</small></span>{state.deck.length < 10 && <b>出战牌不足 10 张，可从候补补充</b>}</header>
    <div className="card-library-grid">{groups.map(group => <article className="card-library-entry" key={group.key}>
      <CardView cardKey={group.key} compact isNew={state.journeyNewCards?.includes(cardBaseKey(group.key))} onClick={() => dispatch({ type: 'viewCard', key: group.key })} />
      <div className="card-library-status"><span>出战 {group.active} / 总计 {group.total}</span><span>候补 {group.total - group.active}</span></div>
      <div className="card-library-actions"><button className={!canManage || group.active >= group.total ? 'is-disabled' : ''} aria-disabled={!canManage || group.active >= group.total} onClick={event => manage('activate', group, event)}>出战</button><button className={!canManage || group.active <= 0 || state.deck.length <= 10 ? 'is-disabled' : ''} aria-disabled={!canManage || group.active <= 0 || state.deck.length <= 10} onClick={event => manage('bench', group, event)}>下场</button><button className={`discard-card ${state.phase !== 'hub' || (group.total <= group.active && state.deck.length <= 10) ? 'is-disabled' : ''}`} aria-disabled={state.phase !== 'hub' || (group.total <= group.active && state.deck.length <= 10)} onClick={event => manage('discard', group, event)}><Trash2 />丢弃</button></div>
    </article>)}</div>
    {pendingDiscard && <DiscardCardConfirm cardKey={pendingDiscard.key} onCancel={() => setPendingDiscard(null)} onConfirm={() => { dispatch({ type: 'loadout', operation: 'discard', key: pendingDiscard.key }); setPendingDiscard(null); }} />}
  </div>;
}

function LoadoutStation({ state, dispatch }) {
  return <Overlay background={PIXEL_BACKGROUNDS[state.stage]} eyebrow="牌组整备站" title="整理出战牌组" text="旅途中也可以调整出战与候补。新获得的技能默认进入候补。" variant="loadout-overlay">
    <CardLibraryPanel state={state} dispatch={dispatch} />
    <button className="memory-leave secondary" onClick={() => dispatch({ type: 'leaveLoadout' })}>完成整备，继续赶路</button>
  </Overlay>;
}

function NegativeStation({ state, dispatch }) {
  const costsGold = state.gold >= 12;
  return <Overlay background={PIXEL_BACKGROUNDS[state.stage]} eyebrow="低概率负面际遇" title="失序路段" text={costsGold ? '迷雾拦住去路，需要留下 12 枚旅币才能继续。' : '旅币不足，失序夜风会带走少量生命，但不会令生命降到 0。'}>
    <div className="negative-event"><AlertTriangle /><strong>{costsGold ? '失去 12 枚旅币' : `失去最多 ${Math.max(1, Math.ceil(state.maxHp * .08))} 点生命`}</strong><span>未知路标并不总会带来好运。</span></div>
    <button className="confirm-danger mystery-enter" onClick={() => dispatch({ type: 'negative', choice: 'continue' })}>承担代价并继续</button>
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
  return <main className={`finale ${won ? 'won' : 'lost'}`}><div className="finale-art pixel-art" style={{ backgroundImage: `url(${PIXEL_BACKGROUNDS[state.stage]})` }} />{!won && <div className={`finale-enemy pixel-art ${sprite.className}`} style={sprite.style} />}<div className="scene-vignette" /><section><span className="finale-character pixel-art" style={characterStyle(state.character, 1.8)} /><span className="eyebrow">JOURNEY ENDED · 本局结束</span><h1>挑战失败</h1><p>“{CHARACTER_LINES[state.character].defeat}”</p><small>生命归零，本次旅程已经结束。可以回顾刚才的战斗，然后重新开始一局。</small><div className="run-stats"><span>等级 <b>{state.level}</b></span><span>战斗胜利 <b>{state.victories}</b></span><span>回合 <b>{state.totalTurns}</b></span></div><div className="finale-actions"><button className="primary" onClick={onEnd}><X size={18} />结束本局</button><button className="secondary" onClick={() => setReviewing(true)}><BookOpen size={18} />回顾战斗</button></div></section>{reviewing && <BattleReview entries={state.battleLog} enemyName={enemyFor(state).name} onClose={() => setReviewing(false)} />}</main>;
}

const SLOT_ICONS = { weapon: Swords, armor: Shirt, bag: Backpack, scarf: Wind, charm: Gem, decor: TentTree };
const COMPACT_STAT_LABELS = { attack: '伤害', block: '护盾', recovery: '恢复', firstStrike: '首攻', healing: '治疗', markPower: '弱点', skillPower: '牌盾' };

function itemCoreStats(item) {
  return Object.entries(itemStats(item)).map(([key, value]) => `${COMPACT_STAT_LABELS[key] || AFFIX_LABELS[key]} +${value}`);
}

function gearAccent(baseKey) {
  const chapter = Math.max(0, CHAPTER_LOOT.findIndex(pool => pool.includes(baseKey)));
  return CHAPTERS[chapter].color;
}

function GearArt({ baseKey, slot, Icon, empty = false }) {
  const style = empty ? null : gearAtlasStyle(baseKey);
  return <span className={`gear-icon ${style ? 'gear-art pixel-art' : 'gear-empty'}`} style={{ ...(style || {}), '--gear-accent': empty ? '#8a938a' : gearAccent(baseKey) }}><i className="gear-category"><Icon /></i></span>;
}

function GearRow({ item, equipped, onOpen, isNew = false }) {
  const base = ITEMS[item.base], Icon = SLOT_ICONS[base.slot];
  const grantedSkill = item.skill ? card(item.skill) : null;
  return <button className={`gear-card rarity-${item.rarity} ${equipped ? 'equipped' : ''}`} onClick={onOpen} title={`查看 ${itemName(item)} 详情`}>
    <GearArt baseKey={item.base} slot={base.slot} Icon={Icon} />
    <span className="gear-item-level">Lv.{item.itemLevel || 1} · {itemTier(item).name.replace('底材', '')}</span>
    <span className="gear-rarity">{item.rarity}</span>
    <strong>{itemName(item)}</strong>
    <span className="gear-core-stats">{itemCoreStats(item).map(line => <i key={line}>{line}</i>)}</span>
    {grantedSkill && <span className="gear-skill-label" aria-label={`自带技能：${grantedSkill.name}`}><Sparkles /><b>自带技能：{grantedSkill.name}</b></span>}
    {equipped && <span className="gear-equipped-badge" aria-label="已装备"><Check /></span>}
    {isNew && <span className="new-badge">NEW</span>}
  </button>;
}

function EquippedSlot({ item, slot, label, active, onOpen }) {
  if (item) return <GearRow item={item} equipped onOpen={onOpen} />;
  const Icon = SLOT_ICONS[slot];
  return <button className={`equipment-slot ${active ? 'active' : ''}`} onClick={onOpen}>
    <GearArt baseKey={slot} slot={slot} Icon={Icon} empty />
    <small>{label}</small><strong>未装备</strong><em>点击选择装备</em>
  </button>;
}

function GearDetail({ state, item, disabled, onEquip, onClose }) {
  const base = ITEMS[item.base], Icon = SLOT_ICONS[base.slot];
  const equipped = state.equipment[base.slot] === item.id;
  const current = itemFor(state, state.equipment[base.slot]);
  const difference = itemScore(item) - itemScore(current);
  const candidateStats = itemStats(item);
  const currentStats = itemStats(current);
  const comparisonKeys = [...new Set([...Object.keys(currentStats), ...Object.keys(candidateStats)])];
  const skill = item.skill ? card(rankedCardKey(item.skill, item.skillLevel || 1, true)) : null;
  const currentSkill = current?.skill ? card(rankedCardKey(current.skill, current.skillLevel || 1, true)) : null;
  return <div className="gear-detail-backdrop" onClick={onClose}>
    <section className={`gear-detail rarity-${item.rarity}`} onClick={event => event.stopPropagation()}>
      <button className="icon-button gear-detail-close" onClick={onClose} aria-label="关闭装备详情"><X /></button>
      <header><GearArt baseKey={item.base} slot={base.slot} Icon={Icon} /><span><small>{item.rarity} · {itemTier(item).name} · 物品等级 {item.itemLevel || 1}</small><h3>{itemName(item)}</h3><em>{base.flavor}</em></span></header>
      {!equipped && current && <div className="gear-detail-compare">
        <div className="gear-compare-heading"><span><small>当前装备</small><strong>{itemName(current)}</strong></span><span><small>候选装备</small><strong>{itemName(item)}</strong></span></div>
        <div className="gear-compare-table">{comparisonKeys.map(key => {
          const before = currentStats[key] || 0;
          const after = candidateStats[key] || 0;
          const delta = after - before;
          return <div className="gear-compare-row" key={key}><span>{AFFIX_LABELS[key]}</span><b>{before}</b><i aria-hidden="true">→</i><b>{after}</b><em className={delta > 0 ? 'better' : delta < 0 ? 'worse' : 'same'}>{delta > 0 ? `+${delta}` : delta}</em></div>;
        })}</div>
        <div className="gear-compare-skills"><GearSkillComparison label="当前技能" skill={currentSkill} /><GearSkillComparison label="候选技能" skill={skill} /></div>
      </div>}
      <div className="gear-detail-score"><span>装备评分 <b>{itemScore(item)}</b></span>{!equipped && current && <span className={difference >= 0 ? 'better' : 'worse'}>{difference >= 0 ? `比当前高 ${difference}` : `比当前低 ${Math.abs(difference)}`}</span>}</div>
      <div className="gear-detail-lines"><small>完整词条</small>{itemLines(item).map(line => <p key={line}>{line}</p>)}</div>
      {skill && <div className="gear-detail-skill"><span className="gear-detail-skill-art pixel-art" style={cardAtlasStyle(item.skill)} /><span><small>装备自带技能 · Lv.{skill.rank}</small><strong>{skill.name}</strong><p>消耗 {skill.cost} 点行动力 · {description(skill.key).join(' · ')}</p></span></div>}
      <button className="gear-detail-action" disabled={disabled || equipped} onClick={onEquip}>{equipped ? <><Check />已装备</> : disabled ? '战斗中不能更换装备' : `装备到「${SLOT_LABELS[base.slot]}」`}</button>
    </section>
  </div>;
}

function GearSkillComparison({ label, skill }) {
  return <span className={skill ? '' : 'empty'}><small>{label}</small>{skill ? <><strong>{skill.name} · Lv.{skill.rank}</strong><p>{description(skill.key).join(' · ')}</p></> : <strong>无自带技能</strong>}</span>;
}

function WorkshopRow({ state, item, dispatch, onOpen }) {
  const equipped = Object.values(state.equipment).includes(item.id);
  const cost = rerollCost(item, state.facilities.workshop), value = salvageValue(item), upgradeCost = itemUpgradeCost(item);
  return <article className="workshop-card">
    <GearRow item={item} equipped={equipped} onOpen={onOpen} isNew={state.journeyNewItems?.includes(item.id)} />
    <div className="workshop-card-actions"><button disabled={!item.affixes.length || state.gold < cost} onClick={() => dispatch({ type: 'reroll', key: item.id })}><Wrench />重抽属性<small>{cost} 旅币</small></button><button disabled={upgradeCost === null || state.gold < upgradeCost} onClick={() => dispatch({ type: 'upgradeItem', key: item.id })}><TrendingUp />升阶底材<small>{upgradeCost === null ? '已是精英' : `${upgradeCost} 旅币`}</small></button><button disabled={equipped} onClick={() => dispatch({ type: 'salvage', key: item.id })}><PackageOpen />拆解装备<small>获得 {value} 旅币</small></button></div>
  </article>;
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
      return <article key={meta.key}><Icon /><span><small>LV.{level} / 3</small><strong>{meta.name}</strong><em>{meta.effect(level)}</em></span><button disabled={cost === null || state.gold < cost} onClick={() => dispatch({ type: 'upgradeFacility', key: meta.key })}>{cost === null ? <><Check />已完成</> : <><Wrench />升级设施<small><Coins />{cost} 旅币</small></>}</button></article>;
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

const DRAWER_TUTORIAL_KEY = 'mistbound-drawer-tutorials';
const DRAWER_TUTORIALS = {
  character: { title: '装备与替换', text: '点击任一装备槽位，会展开同类装备列表。列表中的卡牌点击后会直接替换当前装备。' },
  bag: { title: '快速比较装备', text: '卡面只保留名称和核心数值。点击卡牌可查看完整词条、技能，以及与当前装备的详细对比。' },
  deck: { title: '查看当前卡组', text: '这里显示本局已经获得的全部技能卡。装备自带技能会在进入战斗时额外加入牌堆。' },
  workshop: { title: '重抽与拆解', text: '重抽属性会保留装备和自带技能，只刷新随机词条；拆解会永久销毁装备并返还旅币。' },
  guests: { title: '客人与旅程委托', text: '完成委托可以领取旅币；反复探索对应地区，会推进住客故事并解锁专属纪念品。' },
};

function readDrawerTutorials() {
  try { return JSON.parse(localStorage.getItem(DRAWER_TUTORIAL_KEY) || '{}'); } catch { return {}; }
}

function DebugPanel({ state, dispatch, onClose }) {
  const [stage, setStage] = useState(state.stage);
  const [row, setRow] = useState(-1);
  const [base, setBase] = useState(CHAPTER_LOOT[state.stage]?.[0] || Object.keys(ITEMS)[0]);
  const [skill, setSkill] = useState(CARD_KEYS[0]);
  const [itemLevel, setItemLevel] = useState(Math.min(60, state.stage * 10 + 1));
  const [skillLevel, setSkillLevel] = useState(1);
  const act = (operation, extra = {}) => dispatch({ type: 'debug', operation, ...extra });
  return createPortal(<div className="debug-backdrop" onClick={onClose}>
    <section className="debug-panel" role="dialog" aria-modal="true" aria-labelledby="debug-panel-title" onClick={event => event.stopPropagation()}>
      <header><span><small>仅供开发测试</small><h2 id="debug-panel-title"><FlaskConical />测试面板</h2></span><button onClick={onClose}>关闭</button></header>
      <div className="debug-status"><span>Lv.{state.level}</span><span>{state.gold} 旅币</span><span>{state.hp}/{state.maxHp} 生命</span><span>背包 {state.inventory.length}</span></div>
      <section className="debug-section">
        <h3>跳转进度</h3>
        <div className="debug-fields">
          <label>章节<select value={stage} onChange={event => { const next = Number(event.target.value); setStage(next); setBase(CHAPTER_LOOT[next][0]); setItemLevel(Math.min(60, next * 10 + 1)); }}>{CHAPTERS.map((chapter, index) => <option key={chapter.name} value={index}>{index + 1}. {chapter.name}</option>)}</select></label>
          <label>位置<select value={row} onChange={event => setRow(Number(event.target.value))}><option value={-1}>章节起点</option><option value={9}>第 10 步路标</option><option value={19}>第 20 步路标</option><option value={29}>第 30 步路标</option><option value={39}>第 40 步路标</option><option value={48}>首领前</option></select></label>
        </div>
        <button className="debug-primary" onClick={() => act('jump', { stage, row })}>跳转到所选位置</button>
      </section>
      <section className="debug-section">
        <h3>角色与资源</h3>
        <div className="debug-buttons"><button onClick={() => act('gold')}>旅币 +1000</button><button onClick={() => act('level')}>等级 +1</button><button onClick={() => act('heal')}>恢复全部状态</button><button onClick={() => act('unlock')}>解锁全部章节</button></div>
      </section>
      <section className="debug-section">
        <h3>装备与技能</h3>
        <div className="debug-fields"><label>装备<select value={base} onChange={event => setBase(event.target.value)}>{Object.entries(ITEMS).map(([key, item]) => <option key={key} value={key}>{Number.isInteger(item.chapter) ? `第 ${item.chapter + 1} 章` : '基础装备'} · {item.name}</option>)}</select></label><label>物品等级<input type="number" min="1" max="60" value={itemLevel} onChange={event => setItemLevel(Math.max(1, Math.min(60, Number(event.target.value) || 1)))} /></label></div>
        <button className="debug-primary" onClick={() => act('item', { base, itemLevel })}>添加 Lv.{itemLevel} 装备</button>
        <div className="debug-fields"><label>技能<select value={skill} onChange={event => setSkill(event.target.value)}>{CARD_KEYS.map(key => <option key={key} value={key}>{card(key).name}</option>)}</select></label><label>技能等级<input type="number" min="1" max="10" value={skillLevel} onChange={event => setSkillLevel(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} /></label></div>
        <div className="debug-buttons"><button onClick={() => act('card', { key: skill, rank: skillLevel })}>添加/提升至 Lv.{skillLevel}</button><button onClick={() => act('upgradeCards')}>全部技能 +1</button></div>
      </section>
      <p className="debug-warning">测试操作会立即写入当前存档。正式体验前请使用“放弃并重新开始”清理测试数据。</p>
    </section>
  </div>, document.body);
}

function Drawer({ state, dispatch, onClose, onRestart, initialTab = 'character' }) {
  const { show } = React.useContext(TooltipContext);
  const { workshop: workshopUnlocked, guests: guestsUnlocked } = featureUnlocks(state);
  const visibleInitialTab = (initialTab === 'workshop' && !workshopUnlocked) || (initialTab === 'guests' && !guestsUnlocked) ? 'character' : initialTab;
  const [tab, setTab] = useState(visibleInitialTab);
  const [selectedGear, setSelectedGear] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [seenTutorials, setSeenTutorials] = useState(readDrawerTutorials);
  const [tutorialTab, setTutorialTab] = useState(() => readDrawerTutorials()[initialTab] ? null : initialTab);
  const stats = equipmentStats(state);
  const openTab = (next, event) => {
    if (state.phase !== 'hub' && ['workshop', 'guests'].includes(next)) {
      show(next === 'workshop' ? '房车工坊只能在返回房车后使用。' : '客人奖励只能在返回房车后查看和领取。', event);
      return;
    }
    if (state.phase === 'hub' && ['bag', 'workshop', 'guests'].includes(next)) dispatch({ type: 'viewFeature', key: next });
    setTab(next); setSelectedSlot(null);
    if (!seenTutorials[next]) setTutorialTab(next);
  };
  const finishTutorial = () => {
    const next = { ...seenTutorials, [tutorialTab]: true };
    setSeenTutorials(next); localStorage.setItem(DRAWER_TUTORIAL_KEY, JSON.stringify(next)); setTutorialTab(null);
  };
  return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer" onClick={e => e.stopPropagation()}>
    <div className="drawer-controls"><MusicToggle compact /><button className="drawer-close" onClick={onClose}>关闭行囊</button></div><span className="eyebrow">旅行屋档案</span><h2>店主与行囊</h2>
    <div className="level-card"><button className="debug-trigger" onClick={() => setDebugOpen(true)} aria-label="打开测试面板">LV</button><strong>{state.level}</strong><div><b>{CHARACTERS[state.character].name} · {CHARACTERS[state.character].role}</b><small>{state.xp} / {state.nextXp} XP</small><Bar value={state.xp} max={state.nextXp} tone="xp" /></div></div>
    <div className="character-trait"><span className="character-avatar pixel-art" style={characterStyle(state.character, 1.8)} /><div><small>角色特性</small><strong>{CHARACTERS[state.character].trait}</strong><p>{CHARACTERS[state.character].description}</p></div></div>
    <div className="drawer-stats"><Tip text="伤害会加到所有攻击卡牌的基础伤害上。"><span><Swords />伤害 +{stats.attack}</span></Tip><Tip text="每回合开始时自动获得这些护盾。"><span><Shield />护盾 +{stats.block}</span></Tip><Tip text="每场战斗胜利后额外回复的生命。"><span><Heart />恢复 +{stats.recovery}</span></Tip><Tip text="弱点强化会增加技能发现的弱点层数，多件装备可以叠加。"><span><Target />弱点强化 +{stats.markPower}</span></Tip></div>
    <nav className="drawer-tabs" style={{ '--drawer-tab-count': 3 + Number(workshopUnlocked) + Number(guestsUnlocked) }}><button className={tab === 'character' ? 'active' : ''} onClick={event => openTab('character', event)}>装备</button><button className={tab === 'bag' ? 'active' : ''} onClick={event => openTab('bag', event)}>背包 {state.inventory.length}</button><button className={tab === 'deck' ? 'active' : ''} onClick={event => openTab('deck', event)}>卡组 {state.deck.length}</button>{workshopUnlocked && <button className={`${tab === 'workshop' ? 'active' : ''} ${state.phase !== 'hub' ? 'travel-locked' : ''}`} onClick={event => openTab('workshop', event)}>工坊</button>}{guestsUnlocked && <button className={`${tab === 'guests' ? 'active' : ''} ${state.phase !== 'hub' ? 'travel-locked' : ''}`} onClick={event => openTab('guests', event)}>客人</button>}</nav>
    {tab === 'character' && <><div className="equipment-toolbar"><strong>当前装备</strong><button disabled={state.phase !== 'hub'} onClick={() => dispatch({ type: 'equipBest' })}><Crown />一键装备最强</button></div><div className="equipment-grid">{Object.entries(SLOT_LABELS).map(([slot, label]) => { const item = itemFor(state, state.equipment[slot]); return <EquippedSlot key={slot} item={item} slot={slot} label={label} active={selectedSlot === slot} onOpen={() => setSelectedSlot(selectedSlot === slot ? null : slot)} />; })}</div>{selectedSlot && <section className="slot-replacements"><header><span><small>替换装备</small><strong>{SLOT_LABELS[selectedSlot]}</strong></span><button className="icon-button" onClick={() => setSelectedSlot(null)} aria-label="收起替换列表"><X /></button></header><p>点击装备查看详情，对比后确认替换。</p><div className="inventory-list">{state.inventory.filter(item => ITEMS[item.base].slot === selectedSlot).map(item => <GearRow key={item.id} item={item} equipped={state.equipment[selectedSlot] === item.id} isNew={state.journeyNewItems?.includes(item.id)} onOpen={() => setSelectedGear(item.id)} />)}</div>{state.phase !== 'hub' && <small className="bag-hint">只有回到房车才能更换装备。</small>}</section>}<div className="log"><h3><BookOpen />最近战报</h3>{state.log.slice(0, 6).map((item, i) => <p key={i}>{item}</p>)}</div></>}
    {tab === 'bag' && <div className="inventory-list">{state.inventory.map(item => { const slot = ITEMS[item.base].slot; return <GearRow key={item.id} item={item} equipped={state.equipment[slot] === item.id} isNew={state.journeyNewItems?.includes(item.id)} onOpen={() => setSelectedGear(item.id)} />; })}{state.phase !== 'hub' && <p className="bag-hint">旅途中只能查看装备，返回房车后才能更换。</p>}</div>}
    {tab === 'deck' && <CardLibraryPanel state={state} dispatch={dispatch} />}
    {tab === 'workshop' && <div className="workshop"><header><Wrench /><span><strong>房车工坊</strong><small>重抽属性会刷新随机词条；拆解会永久销毁装备。附带技能不会被重抽。</small></span><b><Coins />{state.gold}</b></header><FacilityUpgrades state={state} dispatch={dispatch} /><div className="workshop-items">{state.inventory.map(item => <WorkshopRow key={item.id} state={state} item={item} dispatch={dispatch} onOpen={() => setSelectedGear(item.id)} />)}</div></div>}
    {tab === 'guests' && <><CommissionBoard state={state} dispatch={dispatch} /><GuestRooms state={state} dispatch={dispatch} /></>}
    <button className="danger" onClick={onRestart}>放弃并重新开始</button>
    {selectedGear && itemFor(state, selectedGear) && <GearDetail state={state} item={itemFor(state, selectedGear)} disabled={state.phase !== 'hub'} onClose={() => setSelectedGear(null)} onEquip={() => { dispatch({ type: 'equip', key: selectedGear }); setSelectedGear(null); }} />}
    {debugOpen && <DebugPanel state={state} dispatch={dispatch} onClose={() => setDebugOpen(false)} />}
    {tutorialTab && <div className="tutorial-backdrop drawer-tutorial"><section className="tutorial-card"><span>旅行屋指南</span><h2>{DRAWER_TUTORIALS[tutorialTab].title}</h2><p>{DRAWER_TUTORIALS[tutorialTab].text}</p><button className="primary" onClick={finishTutorial}>知道了</button></section></div>}
  </aside></div>;
}

function RestartConfirm({ fromJourney, onCancel, onConfirm }) {
  return <div className="confirm-backdrop" onClick={onCancel}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="restart-confirm-title" onClick={event => event.stopPropagation()}>
      <span className="confirm-icon"><AlertTriangle /></span>
      <small>{fromJourney ? '中断旅途' : '重新开张'}</small>
      <h2 id="restart-confirm-title">{fromJourney ? '放弃当前旅途？' : '清空当前存档？'}</h2>
      <p>角色等级、装备、卡组和路线进度都会清空，之后将重新选择角色与难度。此操作无法撤销。</p>
      <div className="confirm-actions"><button className="secondary" onClick={onCancel}>取消</button><button className="confirm-danger" onClick={onConfirm}>{fromJourney ? '确认放弃' : '清空重开'}</button></div>
    </section>
  </div>;
}

function SkipCardRewardConfirm({ onCancel, onConfirm }) {
  return <div className="confirm-backdrop" onClick={onCancel}>
    <section className="confirm-dialog skip-reward-confirm" role="alertdialog" aria-modal="true" aria-labelledby="skip-card-reward-title" onClick={event => event.stopPropagation()}>
      <span className="confirm-icon"><AlertTriangle /></span><small>放弃本次选牌</small>
      <h2 id="skip-card-reward-title">不选择卡牌？</h2>
      <p>本场获得的装备已经收入背包；确认后只会放弃三选一技能牌，且不能返回重新选择。</p>
      <div className="confirm-actions"><button className="secondary" onClick={onCancel}>返回选牌</button><button className="confirm-danger" onClick={onConfirm}>确认放弃</button></div>
    </section>
  </div>;
}

function DiscardCardConfirm({ cardKey, onCancel, onConfirm }) {
  const selected = card(cardKey);
  return <div className="confirm-backdrop" onClick={onCancel}>
    <section className="confirm-dialog discard-card-confirm" role="alertdialog" aria-modal="true" aria-labelledby="discard-card-title" onClick={event => event.stopPropagation()}>
      <span className="confirm-icon"><Trash2 /></span><small>永久整理技能库</small>
      <h2 id="discard-card-title">丢弃这张卡？</h2>
      <p>将永久丢弃一张 Lv.{selected.rank}「{selected.name}」。如果没有候补副本，会同时从出战牌组移除。</p>
      <div className="confirm-actions"><button className="secondary" onClick={onCancel}>保留卡牌</button><button className="confirm-danger" onClick={onConfirm}>确认丢弃</button></div>
    </section>
  </div>;
}

function ReturnHubConfirm({ safe, atStart, unsecuredItemCount, unsecuredCardCount, onCancel, onConfirm }) {
  const unsecuredCount = unsecuredItemCount + unsecuredCardCount;
  const risky = !safe && unsecuredCount > 0;
  const rewardSummary = [unsecuredItemCount ? `${unsecuredItemCount} 件装备` : '', unsecuredCardCount ? `${unsecuredCardCount} 张卡牌` : ''].filter(Boolean).join('和');
  const message = safe
    ? atStart ? '尚未离开起点，可以安全返回并恢复全部生命；不会获得其他额外收益。' : '本段获得的装备和卡牌已在夜程路标完成存放，可以安全返回并恢复全部生命；不会获得其他额外收益。'
    : (risky ? `当前不在路标，返回将结束本次路线，并从本段尚未存放的${rewardSummary}中随机遗失 1 项。` : '当前不在路标，返回将结束本次路线。你没有尚未存放的装备或卡牌，因此不会遗失奖励。') + ' 冒险撤离后会恢复全部生命。';
  return <div className="confirm-backdrop" onClick={onCancel}>
    <section className={`confirm-dialog return-confirm ${risky ? 'risky' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby="return-confirm-title" onClick={event => event.stopPropagation()}>
      <span className="confirm-icon"><PackageOpen /></span>
      <small>{safe ? '安全返程' : '中途撤离'}</small>
      <h2 id="return-confirm-title">返回房车？</h2>
      <p>{message}</p>
      <div className="confirm-actions"><button className="secondary" onClick={onCancel}>继续探索</button><button className={risky ? 'confirm-danger' : 'primary'} onClick={onConfirm}>确认返回</button></div>
    </section>
  </div>;
}

function App() {
  const { playSfx } = React.useContext(MusicContext);
  const [saved, setSaved] = useState(() => restore(localStorage.getItem(SAVE_KEY)));
  const [state, setState] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const [settling, setSettling] = useState(null);
  const [battleSpeed, setBattleSpeed] = useState(() => {
    const savedSpeed = Number(localStorage.getItem(BATTLE_SPEED_KEY));
    return [1, 2, 3].includes(savedSpeed) ? savedSpeed : 1;
  });
  const [valueFloaters, setValueFloaters] = useState([]);
  const valueFloaterTimer = useRef(null);
  const previousState = useRef(null);
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
  useEffect(() => () => window.clearTimeout(valueFloaterTimer.current), []);
  useEffect(() => { if (state) localStorage.setItem(SAVE_KEY, serialize(state)); }, [state]);
  useEffect(() => { localStorage.setItem(BATTLE_SPEED_KEY, String(battleSpeed)); }, [battleSpeed]);
  useEffect(() => {
    const previous = previousState.current;
    previousState.current = state;
    if (!previous || !state) return;
    if (state.played > previous.played) playSfx('card');
    if (previous.phase === 'combat' && state.played > previous.played && state.block > previous.block) playSfx('guard');
    if (previous.phase === 'combat' && state.phase === 'combat') {
      if (state.enemy.hp < previous.enemy.hp) playSfx('hit');
      if (state.hp < previous.hp) playSfx('hurt');
      else if (state.hp > previous.hp) playSfx('heal');
    } else if (previous.phase === 'combat' && state.phase === 'reward') playSfx('victory');
    else if (previous.phase === 'combat' && state.phase === 'lost') playSfx('defeat');
    const changes = [];
    if (!(previous.phase === 'memory' && state.phase === 'map')) {
      const countCards = deck => deck.reduce((counts, key) => counts.set(key, (counts.get(key) || 0) + 1), new Map());
      const before = countCards(previous.cardLibrary);
      const after = countCards(state.cardLibrary);
      const removed = [];
      const added = [];
      for (const [key, count] of before) for (let index = 0; index < count - (after.get(key) || 0); index++) removed.push(key);
      for (const [key, count] of after) for (let index = 0; index < count - (before.get(key) || 0); index++) added.push(key);
      for (let index = added.length - 1; index >= 0; index--) {
        const addedKey = added[index];
        const removedIndex = removed.findIndex(key => cardBaseKey(key) === cardBaseKey(addedKey));
        if (removedIndex < 0) continue;
        const removedKey = removed.splice(removedIndex, 1)[0];
        added.splice(index, 1);
        changes.push({ text: `卡牌升级：${card(addedKey).name} Lv.${cardRank(removedKey)} → Lv.${cardRank(addedKey)}`, tone: 'gain', key: `upgraded-card-${Date.now()}-${index}` });
      }
      added.forEach((key, index) => changes.push({ text: `获得卡牌：${card(key).name} Lv.${cardRank(key)}`, tone: 'gain', key: `added-card-${Date.now()}-${index}` }));
      removed.forEach((key, index) => {
        const lost = previous.phase === 'map' && state.phase === 'hub' && (previous.unsecuredCards || []).includes(key);
        changes.push({ text: `${lost ? '遗失' : '移除'}卡牌：${card(key).name} Lv.${cardRank(key)}`, tone: 'loss', key: `removed-card-${Date.now()}-${index}` });
      });
    }
    if (previous.phase === 'map' && state.phase === 'hub') {
      const currentItems = new Set(state.inventory.map(item => item.id));
      previous.inventory
        .filter(item => !currentItems.has(item.id) && (previous.unsecuredLoot || []).includes(item.id))
        .forEach((item, index) => changes.push({
          text: `遗失装备：${itemName(item)}`,
          tone: 'loss',
          key: `lost-item-${Date.now()}-${index}`,
        }));
    }
    const add = (label, value) => { if (value) changes.push({ label, value, key: `${label}-${Date.now()}-${value}` }); };
    if (state.phase === previous.phase && state.phase !== 'combat') add('生命', state.hp - previous.hp);
    add('旅币', state.gold - previous.gold);
    add('经验', state.xp - previous.xp);
    add('等级', state.level - previous.level);
    add('生命上限', state.maxHp - previous.maxHp);
    if (changes.length) {
      window.clearTimeout(valueFloaterTimer.current);
      setValueFloaters(changes);
      valueFloaterTimer.current = window.setTimeout(() => setValueFloaters([]), 1700);
    } else if (previous.phase !== state.phase) {
      window.clearTimeout(valueFloaterTimer.current);
      setValueFloaters([]);
    }
  }, [state]);
  useEffect(() => {
    if (!state || !['reward', 'lost'].includes(state.phase)) { setSettling(null); return undefined; }
    setSettling(state.phase);
    const timer = window.setTimeout(() => setSettling(null), 1250 / battleSpeed);
    return () => window.clearTimeout(timer);
  }, [state?.phase, state?.played, battleSpeed]);
  const enemy = useMemo(() => state ? enemyFor(state) : null, [state]);
  const location = state?.phase === 'map' ? CHAPTERS[state.stage].name : state?.phase === 'mystery' ? '命运魔法屋' : state?.phase === 'camp' ? '亮灯的休息站' : state?.phase === 'memory' ? '整理回忆站' : state?.phase === 'loadout' ? '牌组整备站' : state?.phase === 'negative' ? '失序路段' : state?.phase === 'checkpoint' ? CHECKPOINTS[state.mapRow + 1]?.title || '夜程路标' : state?.phase === 'event' ? '夜路岔口' : enemy?.place;
  const clearValueFloaters = () => { window.clearTimeout(valueFloaterTimer.current); setValueFloaters([]); };
  const startNew = (mode = 'manual', difficulty = 'standard', character = 'gaigai') => { const next = newRun(Date.now() >>> 0, mode, difficulty, character); clearValueFloaters(); localStorage.setItem(SAVE_KEY, serialize(next)); setSaved(next); setDrawer(false); setState(next); };
  const resetRun = () => { clearValueFloaters(); localStorage.removeItem(SAVE_KEY); setSaved(null); setDrawer(false); setConfirmingRestart(false); setState(null); };
  const dispatch = React.useCallback(action => setState(current => transition(current, action)), []);
  const openHubFeature = (tab, key) => { dispatch({ type: 'viewFeature', key }); setDrawer(tab); };
  if (!state) return <Splash saved={saved} onContinue={() => { clearValueFloaters(); setState(saved); }} onNew={startNew} />;
  if (state.phase === 'lost' && !settling) return <><Finale won={false} state={state} onEnd={resetRun} /><ValueFloaters items={valueFloaters} /></>;
  if (state.phase === 'hub') return <><CamperHub state={state} dispatch={dispatch} onDrawer={() => openHubFeature('character', 'bag')} onWorkshop={() => openHubFeature('workshop', 'workshop')} onGuests={() => openHubFeature('guests', 'guests')} />{drawer && <Drawer initialTab={drawer} state={state} dispatch={dispatch} onClose={() => setDrawer(false)} onRestart={() => setConfirmingRestart(true)} />}{confirmingRestart && <RestartConfirm fromJourney={false} onCancel={() => setConfirmingRestart(false)} onConfirm={resetRun} />}<ValueFloaters items={valueFloaters} /></>;
  return <main className="game-shell">
    <header className="topbar"><div><Tip text={`当前为${DIFFICULTIES[state.difficulty].name}难度，${state.battleMode === 'auto' ? '系统会自动选择卡牌' : '由你手动选择卡牌'}；这两项设置会贯穿整局。`}><span>Lv.{state.level} · 第 {state.stage + 1} / {ENEMIES.length} 站 · {DIFFICULTIES[state.difficulty].name} · {state.battleMode === 'auto' ? '自动' : '手动'}</span></Tip><strong>{location}</strong></div><div className="route">{ENEMIES.map((_, i) => <i key={i} className={i <= state.stage ? 'active' : ''} />)}</div>{state.phase === 'map' ? <span className="topbar-spacer" /> : <button className="icon-button" onClick={() => setDrawer(true)} aria-label="打开角色与背包"><Menu /></button>}</header>
    {state.phase === 'map' && <MapView state={state} dispatch={dispatch} />}
    {state.phase === 'mystery' && <MysteryStation state={state} dispatch={dispatch} />}
    {(state.phase === 'combat' || settling) && <Battle state={state} dispatch={dispatch} battleSpeed={battleSpeed} onBattleSpeed={setBattleSpeed} outcome={settling === 'reward' ? 'victory' : settling === 'lost' ? 'defeat' : null} />}
    {state.phase === 'reward' && !settling && <Reward state={state} dispatch={dispatch} />}
    {state.phase === 'camp' && <Camp state={state} dispatch={dispatch} />}
    {state.phase === 'memory' && <MemoryStation state={state} dispatch={dispatch} />}
    {state.phase === 'loadout' && <LoadoutStation state={state} dispatch={dispatch} />}
    {state.phase === 'negative' && <NegativeStation state={state} dispatch={dispatch} />}
    {state.phase === 'checkpoint' && <Checkpoint state={state} dispatch={dispatch} />}
    {state.phase === 'event' && <EventView state={state} dispatch={dispatch} />}
    {drawer && state.phase !== 'map' && <Drawer initialTab={drawer === true ? 'character' : drawer} state={state} dispatch={dispatch} onClose={() => setDrawer(false)} onRestart={() => setConfirmingRestart(true)} />}
    {confirmingRestart && <RestartConfirm fromJourney onCancel={() => setConfirmingRestart(false)} onConfirm={resetRun} />}
    <ValueFloaters items={valueFloaters} />
  </main>;
}

function supportsFlexGap() {
  const flex = document.createElement('div');
  flex.style.position = 'absolute';
  flex.style.visibility = 'hidden';
  flex.style.display = 'flex';
  flex.style.flexDirection = 'column';
  flex.style.rowGap = '1px';
  flex.appendChild(document.createElement('div'));
  flex.appendChild(document.createElement('div'));
  document.body.appendChild(flex);
  const supported = flex.scrollHeight === 1;
  flex.parentNode.removeChild(flex);
  return supported;
}

document.documentElement.classList.toggle('no-flex-gap', !supportsFlexGap());
const xhsPreview = new URLSearchParams(window.location.search).has('xhs_preview');
const xhsRuntime = Boolean(window.xhs?.miniTool) || /XiaoHongShu|XHS/i.test(navigator.userAgent) || xhsPreview;
document.documentElement.classList.toggle('xhs-runtime', xhsRuntime);

createRoot(document.getElementById('root')).render(<MusicProvider><TooltipProvider><App /></TooltipProvider></MusicProvider>);
