import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CARDS,
  CRITICAL_SIDE_QUESTS,
  REWARDS,
  SIDE_STORIES,
  SKILL_UNLOCKS,
  card,
  description,
} from '../src/game.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'Configs');

const CARD_TYPE_LABELS = {
  attack: '攻击',
  spell: '法术',
  skill: '技能',
};

const VALUE_FIELDS = [
  'damage',
  'hits',
  'block',
  'nextBlock',
  'heal',
  'mark',
  'draw',
  'energy',
  'self',
  'recycle',
  'blockDamage',
  'markBurst',
  'consumeMark',
  'execute',
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(value) {
  const display = value === true ? '是' : value === false || value == null ? '' : value;
  const type = typeof display === 'number' ? 'Number' : 'String';
  return `<td style="mso-number-format:'\\@';" x:str="${escapeHtml(display)}" ss:Type="${type}">${escapeHtml(display)}</td>`;
}

function skillRows() {
  const rewardOrder = new Map(REWARDS.map((key, index) => [key, index + 1]));
  const orderedKeys = [
    ...REWARDS,
    ...Object.keys(CARDS).filter(key => !rewardOrder.has(key)).sort((a, b) => a.localeCompare(b)),
  ];

  return orderedKeys.map(key => {
    const raw = CARDS[key];
    const preview = card(key);
    const values = Object.fromEntries(VALUE_FIELDS.map(field => [field, raw[field] ?? '']));

    return {
      key,
      name: raw.name,
      rewardOrder: rewardOrder.get(key) || '',
      unlockChapter: SKILL_UNLOCKS[key] == null ? '' : SKILL_UNLOCKS[key] + 1,
      school: raw.school,
      type: CARD_TYPE_LABELS[raw.type] || raw.type,
      cost: raw.cost ?? '',
      ...values,
      retain: !!raw.retain,
      exhaust: !!raw.exhaust,
      cleanse: !!raw.cleanse,
      icon: raw.icon ?? '',
      art: raw.art ?? '',
      effect: description(key).join('；'),
      flavor: raw.flavor ?? '',
      rawJson: JSON.stringify(raw),
      level10Preview: description(`${key}+10`).join('；'),
      level10Cost: preview.cost ?? '',
    };
  });
}

const SKILL_COLUMNS = [
    ['key', '配置Key', ''],
    ['name', '名称', 'name'],
    ['rewardOrder', '奖励池顺序', ''],
    ['unlockChapter', '解锁章节', ''],
    ['school', '流派', 'school'],
    ['type', '类型', 'type'],
    ['cost', '费用', 'cost'],
    ['damage', '伤害', 'damage'],
    ['hits', '段数', 'hits'],
    ['block', '护盾', 'block'],
    ['nextBlock', '下回合护盾', 'nextBlock'],
    ['heal', '治疗', 'heal'],
    ['mark', '弱点', 'mark'],
    ['draw', '抽牌', 'draw'],
    ['energy', '行动力', 'energy'],
    ['self', '自伤', 'self'],
    ['recycle', '回收', 'recycle'],
    ['blockDamage', '护盾转伤倍率', 'blockDamage'],
    ['markBurst', '弱点爆发', 'markBurst'],
    ['consumeMark', '消耗弱点', 'consumeMark'],
    ['execute', '斩杀倍率', 'execute'],
    ['retain', '保留', 'retain'],
    ['exhaust', '消耗', 'exhaust'],
    ['cleanse', '净化', 'cleanse'],
    ['icon', '图标', 'icon'],
    ['art', '美术引用', 'art'],
    ['effect', 'Lv.1效果文本', ''],
    ['level10Preview', 'Lv.10效果预览', ''],
    ['level10Cost', 'Lv.10费用', ''],
    ['flavor', '风味文本', 'flavor'],
    ['rawJson', '原始配置', ''],
];

const SIDE_STORY_COLUMNS = [
  ['storyKey', '支线Key', ''],
  ['name', '支线名称', 'name'],
  ['chapters', '出现章节', 'chapters'],
  ['minRow', '最早行进格', 'minRow'],
  ['critical', '关键支线', 'critical'],
  ['priority', '优先级', 'priority'],
  ['introEyebrow', '开场分类', 'intro.eyebrow'],
  ['introTitle', '开场标题', 'intro.title'],
  ['introText', '开场文本', 'intro.text'],
  ['branchKey', '分支Key', 'intro.choices[].key'],
  ['choiceTitle', '选项文本', 'intro.choices[].title'],
  ['branchLog', '选择后日志', 'branches.*.log'],
  ['actionSource', '结果方式', ''],
  ['actionType', '结果类型', 'branches.*.(effect|promise).type'],
  ['afterSteps', '等待步数', 'branches.*.promise.afterSteps'],
  ['afterBattles', '等待战斗数', 'branches.*.promise.afterBattles'],
  ['due', '兑现节点', 'branches.*.promise.due'],
  ['value', '数值', 'branches.*.(effect|promise).value'],
  ['heal', '治疗', 'branches.*.(effect|promise).heal'],
  ['gold', '旅币', 'branches.*.(effect|promise).gold'],
  ['count', '需求数量', 'branches.*.promise.count'],
  ['school', '需求流派', 'branches.*.promise.school'],
  ['key', '卡牌/效果Key', 'branches.*.(effect|promise).key'],
  ['rankBonus', '卡牌等级加成', 'branches.*.(effect|promise).rankBonus'],
  ['shop', '商店池', 'branches.*.promise.shop'],
  ['bases', '装备池', 'branches.*.promise.bases'],
  ['clue', '线索Key', 'branches.*.(effect|promise).clue'],
  ['buffKey', '祝福Key', 'branches.*.promise.buff.key'],
  ['buffBattles', '祝福持续战斗', 'branches.*.promise.buff.battles'],
  ['buffBlock', '祝福护盾', 'branches.*.promise.buff.block'],
  ['buffEnergy', '祝福行动力', 'branches.*.promise.buff.energy'],
  ['buffFirstStrike', '祝福首击伤害', 'branches.*.promise.buff.firstStrike'],
  ['resolveTitle', '兑现标题', 'resolve.title'],
  ['resolveText', '兑现文本', 'resolve.text'],
  ['miss', '未满足提示', 'miss'],
  ['rawBranch', '原始分支配置', ''],
];

const CRITICAL_QUEST_COLUMNS = [
  ['questKey', '委托Key', ''],
  ['storyId', '关联支线', 'storyId'],
  ['family', '目标类别', 'family'],
  ['target', '目标数量', 'target'],
  ['requires', '前置委托', 'requires'],
  ['title', '完成标题', 'title'],
  ['text', '完成文本', 'text'],
  ['claimLabel', '领取按钮文本', 'claimLabel'],
  ['rewardType', '奖励类型', 'reward.type'],
  ['rewardKey', '奖励卡牌Key', 'reward.key'],
  ['rewardRankBonus', '奖励等级加成', 'reward.rankBonus'],
  ['rewardClue', '奖励线索Key', 'reward.clue'],
  ['rawJson', '原始配置', ''],
];

function sideStoryRows() {
  return Object.entries(SIDE_STORIES).flatMap(([storyKey, story]) => {
    const choices = new Map((story.intro?.choices || []).map(choice => [choice.key, choice.title]));

    return Object.entries(story.branches || {}).map(([branchKey, branch]) => {
      const actionSource = branch.promise ? '承诺' : branch.effect ? '立即效果' : '';
      const action = branch.promise || branch.effect || {};
      const buff = action.buff || {};

      return {
        storyKey,
        name: story.name,
        chapters: (story.chapters || []).map(chapter => chapter + 1).join('、'),
        minRow: story.minRow ?? '',
        critical: !!story.critical,
        priority: story.priority ?? '',
        introEyebrow: story.intro?.eyebrow ?? '',
        introTitle: story.intro?.title ?? '',
        introText: story.intro?.text ?? '',
        branchKey,
        choiceTitle: choices.get(branchKey) || '',
        branchLog: branch.log ?? '',
        actionSource,
        actionType: action.type ?? '',
        afterSteps: action.afterSteps ?? '',
        afterBattles: action.afterBattles ?? '',
        due: action.due ?? '',
        value: action.value ?? '',
        heal: action.heal ?? '',
        gold: action.gold ?? '',
        count: action.count ?? '',
        school: action.school ?? '',
        key: action.key ?? '',
        rankBonus: action.rankBonus ?? '',
        shop: action.shop ?? '',
        bases: Array.isArray(action.bases) ? action.bases.join('、') : '',
        clue: action.clue ?? '',
        buffKey: buff.key ?? '',
        buffBattles: buff.battles ?? '',
        buffBlock: buff.block ?? '',
        buffEnergy: buff.energy ?? '',
        buffFirstStrike: buff.firstStrike ?? '',
        resolveTitle: story.resolve?.title ?? '',
        resolveText: story.resolve?.text ?? '',
        miss: story.miss ?? '',
        rawBranch: JSON.stringify(branch),
      };
    });
  });
}

function criticalQuestRows() {
  return Object.entries(CRITICAL_SIDE_QUESTS).map(([questKey, quest]) => ({
    questKey,
    storyId: quest.storyId,
    family: quest.family,
    target: quest.target,
    requires: quest.requires ?? '',
    title: quest.title,
    text: quest.text,
    claimLabel: quest.claimLabel,
    rewardType: quest.reward?.type ?? '',
    rewardKey: quest.reward?.key ?? '',
    rewardRankBonus: quest.reward?.rankBonus ?? '',
    rewardClue: quest.reward?.clue ?? '',
    rawJson: JSON.stringify(quest),
  }));
}

function tableHtml({ title, columns, rows }) {

  const header = columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join('');
  const fieldHeader = columns.map(([, , fieldName]) => `<th class="field-name">${escapeHtml(fieldName)}</th>`).join('');
  const body = rows.map(row => `<tr>${columns.map(([key]) => cell(row[key])).join('')}</tr>`).join('\n');

  return `<table>
    <caption>${escapeHtml(title)}</caption>
    <thead><tr>${header}</tr><tr>${fieldHeader}</tr></thead>
    <tbody>
${body}
    </tbody>
  </table>`;
}

function workbookHtml({ title, tables }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="ProgId" content="Excel.Sheet">
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; }
    h1 { color: #23362d; font-size: 16pt; margin: 0 0 12px; }
    table { border-collapse: collapse; font-size: 11pt; margin-bottom: 24px; }
    caption { color: #23362d; font-size: 13pt; font-weight: 700; padding: 6px; text-align: left; }
    th { background: #23362d; color: #ffffff; font-weight: 700; text-align: center; }
    th.field-name { background: #e3ebe6; color: #24342d; font-family: Consolas, "Microsoft YaHei", Arial, sans-serif; font-weight: 400; }
    td, th { border: 1px solid #95a49c; padding: 4px 6px; vertical-align: top; }
    td { background: #ffffff; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${tables.map(tableHtml).join('\n')}
</body>
</html>`;
}

async function writeWorkbook(outputPath, html, successMessage) {
  try {
    await writeFile(outputPath, '\ufeff' + html, 'utf8');
    console.log(successMessage);
    return true;
  } catch (error) {
    if (error?.code !== 'EBUSY') throw error;
    console.error(`跳过被占用的文件，请关闭后重试：${outputPath}`);
    return false;
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const skills = skillRows();
  const sideStories = sideStoryRows();
  const criticalQuests = criticalQuestRows();
  const skillPath = path.join(outputDir, 'Skills.xls');
  const sideStoryPath = path.join(outputDir, 'SideStories.xls');

  const sideStoryWritten = await writeWorkbook(sideStoryPath, workbookHtml({
    title: 'Mistbound 支线配置',
    tables: [
      { title: '支线分支', columns: SIDE_STORY_COLUMNS, rows: sideStories },
      { title: '长期委托', columns: CRITICAL_QUEST_COLUMNS, rows: criticalQuests },
    ],
  }), `已导出 ${sideStories.length} 条支线分支、${criticalQuests.length} 条长期委托：${sideStoryPath}`);
  const skillsWritten = await writeWorkbook(skillPath, workbookHtml({
    title: 'Mistbound 技能配置',
    tables: [{ title: '技能配置', columns: SKILL_COLUMNS, rows: skills }],
  }), `已导出 ${skills.length} 条技能配置：${skillPath}`);

  const writtenCount = Number(sideStoryWritten) + Number(skillsWritten);
  if (writtenCount < 2) process.exitCode = writtenCount === 0 ? 1 : 2;
}

main().catch(error => {
  console.error('导出配置失败：');
  console.error(error);
  process.exitCode = 1;
});
