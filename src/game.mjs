export const VERSION = 21;
export const SAVE_KEY = 'goodnight-next-stop.run.v7';
export const DIFFICULTIES = {
  relaxed: { name: '舒缓', hint: '适合体验剧情，治疗与护盾保持完整效果。', hp: 1, damage: 1, hpDepth: .018, damageDepth: .012, turnDamage: 0, healing: 1, guardPierce: 0, recovery: 1, levelHeal: 6, reward: 1 },
  standard: { name: '标准', hint: '敌人会逐回合增强，10% 伤害穿透护盾。', hp: 1.6, damage: 1.65, hpDepth: .032, damageDepth: .03, turnDamage: .1, healing: .65, guardPierce: .1, recovery: .5, levelHeal: 2, reward: 1.2 },
  challenge: { name: '挑战', hint: '需要手动出牌与装备成长，22% 伤害穿透护盾。', hp: 2.05, damage: 2.08, hpDepth: .045, damageDepth: .043, turnDamage: .18, healing: .45, guardPierce: .22, recovery: 0, levelHeal: 0, reward: 1.45 },
};
export const CARDS = {
  slash: { name: '轻声问候', school: '倾听', type: 'attack', cost: 1, damage: 7, icon: 'heart', flavor: '一句问候，是故事愿意开始的地方。' },
  guard: { name: '深呼吸', school: '陪伴', type: 'skill', cost: 1, block: 6, icon: 'wind', flavor: '先让呼吸慢下来。' },
  mark: { name: '认真倾听', school: '倾听', type: 'spell', cost: 1, mark: 2, icon: 'target', flavor: '没有被听见的话，会留在梦里。' },
  heavy: { name: '说出真心话', school: '倾听', type: 'attack', cost: 2, damage: 17, icon: 'sparkles', flavor: '真话很重，也足以推开一扇门。' },
  focus: { name: '整理思绪', school: '清醒梦', type: 'skill', cost: 0, energy: 1, exhaust: true, icon: 'sparkles', flavor: '把纷乱的念头一件件放好。' },
  riposte: { name: '我在这里', school: '陪伴', type: 'attack', cost: 1, damage: 5, block: 5, icon: 'heart', flavor: '回应本身，就能让梦安静一点。' },
  leech: { name: '热可可', school: '料理', type: 'attack', cost: 1, damage: 6, heal: 3, icon: 'heart', flavor: '杯沿的热气替你说了没关系。' },
  quick: { name: '沿途来信', school: '书信', type: 'attack', cost: 1, damage: 5, draw: 1, icon: 'wind', flavor: '邮戳来自一个还没抵达的地方。' },
  nova: { name: '再次确认', school: '倾听', type: 'attack', cost: 2, damage: 10, hits: 2, icon: 'target', flavor: '重要的话，值得再问一次。' },
  fortify: { name: '安静陪伴', school: '陪伴', type: 'skill', cost: 1, block: 10, icon: 'shield', flavor: '不急着回答，也是一种回答。' },
  echo: { name: '旧日回声', school: '回忆', type: 'spell', cost: 1, mark: 2, draw: 1, icon: 'moon', flavor: '记忆会沿着熟悉的声音回来。' },
  mend: { name: '蜂蜜牛奶', school: '料理', type: 'skill', cost: 1, heal: 9, exhaust: true, icon: 'heart', flavor: '甜度刚好，不需要坚强。' },
  risk: { name: '清醒梦', school: '清醒梦', type: 'spell', cost: 0, draw: 2, self: 3, exhaust: true, icon: 'moon', flavor: '知道自己在梦里，也不代表不会害怕。' },
  tea: { name: '晚安花茶', school: '料理', type: 'skill', cost: 1, block: 8, heal: 2, icon: 'heart', flavor: '花瓣沉底以后，夜也轻了一点。' },
  listen: { name: '慢慢说', school: '倾听', type: 'spell', cost: 1, mark: 3, draw: 1, icon: 'target', flavor: '今晚没有人催你。' },
  postcard: { name: '未寄明信片', school: '书信', type: 'attack', cost: 1, damage: 8, draw: 1, icon: 'wind', flavor: '背面写着一句迟到很久的话。' },
  blanket: { name: '留灯的房间', school: '陪伴', type: 'skill', cost: 2, block: 14, retain: true, icon: 'shield', flavor: '这张房卡不会在天亮前失效。' },
  nightRide: { name: '夜路电台', school: '回忆', type: 'attack', cost: 2, damage: 6, hits: 2, draw: 1, icon: 'moon', flavor: '同一首歌，在两段人生里响起。' },
  kitchenLight: { name: '厨房还亮着', school: '料理', type: 'skill', cost: 1, block: 5, energy: 1, icon: 'flame', flavor: '总有人为晚归的人留一盏灯。' },
  unsent: { name: '没有寄出的信', school: '书信', type: 'attack', cost: 2, damage: 15, retain: true, icon: 'wind', flavor: '它一直留在手里，等待合适的时刻。' },
  photoAlbum: { name: '旧相册', school: '回忆', type: 'spell', cost: 1, mark: 2, draw: 2, exhaust: true, icon: 'moon', flavor: '翻到最后一页时，照片里多了一个人。' },
  morningCall: { name: '明早叫醒我', school: '清醒梦', type: 'attack', cost: 3, damage: 24, exhaust: true, icon: 'sparkles', flavor: '愿意醒来，就是梦最好的结局。' },
  stayAwhile: { name: '再坐一会儿', school: '陪伴', type: 'skill', cost: 2, block: 12, heal: 5, retain: true, icon: 'shield', flavor: '路还很长，我们不必现在出发。' },
  lucidDoor: { name: '推开梦门', school: '清醒梦', type: 'spell', cost: 0, energy: 2, self: 4, exhaust: true, icon: 'sparkles', flavor: '门后未必安全，但一定通向更深处。' },
  goodnight: { name: '好好睡一觉', school: '料理', type: 'attack', cost: 2, damage: 10, heal: 6, exhaust: true, icon: 'heart', flavor: '剩下的事，可以交给明天。' },
};
export const ENEMIES = [
  { name: '不肯告别的园丁', title: '花田梦境 · 未完成的告别', place: '花田终点站', art: 1, hp: 34, pattern: [{ kind: 'attack', value: 6 }, { kind: 'guard', value: 7 }, { kind: 'attack', value: 9 }] },
  { name: '等雨停的人', title: '雨城梦境 · 漫长等待', place: '终年下雨的城', art: 2, hp: 43, pattern: [{ kind: 'attack', value: 5, hits: 2 }, { kind: 'attack', value: 8 }, { kind: 'guard', value: 9 }] },
  { name: '忘记结局的读者', title: '书街梦境 · 遗失的一页', place: '云端旧书街', art: 3, hp: 52, pattern: [{ kind: 'curse', value: 7 }, { kind: 'attack', value: 11 }, { kind: 'guard', value: 10 }] },
  { name: '没有影子的旅客', title: '海岸梦境 · 消失的倒影', place: '没有影子的海岸', art: 4, hp: 64, pattern: [{ kind: 'attack', value: 10 }, { kind: 'guard', value: 12 }, { kind: 'attack', value: 7, hits: 2 }] },
  { name: '收走愿望的摊主', title: '集市梦境 · 交换的代价', place: '午夜星光集市', art: 2, hp: 76, pattern: [{ kind: 'curse', value: 10 }, { kind: 'attack', value: 9, hits: 2 }, { kind: 'guard', value: 15 }] },
  { name: '最后一站的乘客', title: '终点梦境 · 无人认领的行李', place: '被遗忘的终点站', art: 4, hp: 92, pattern: [{ kind: 'attack', value: 14 }, { kind: 'guard', value: 18 }, { kind: 'curse', value: 13 }, { kind: 'attack', value: 10, hits: 2 }] },
];
export const ENCOUNTERS = [
  [
    { name: '催眠发条钟', title: '花田浅梦 · 错过清晨', art: 0, hp: 23, pattern: [{ kind: 'attack', value: 5 }, { kind: 'guard', value: 5 }] },
    { name: '迷路的旧行李', title: '花田浅梦 · 去处不明', art: 1, hp: 25, pattern: [{ kind: 'guard', value: 5 }, { kind: 'attack', value: 6 }] },
    { name: '折纸候鸟群', title: '花田浅梦 · 逆风迁徙', art: 2, hp: 26, pattern: [{ kind: 'attack', value: 3, hits: 2 }, { kind: 'curse', value: 4 }] },
    { name: '被遗忘的雨伞', title: '花田回声 · 等待认领', art: 3, hp: 28, pattern: [{ kind: 'guard', value: 7 }, { kind: 'attack', value: 7 }] },
    { name: '走失的花盆', title: '花田回声 · 自己远行', art: 4, hp: 30, pattern: [{ kind: 'attack', value: 7 }, { kind: 'guard', value: 8 }] },
    { name: '提灯夜蛾', title: '花田深梦 · 扑向微光', art: 5, hp: 32, pattern: [{ kind: 'curse', value: 5 }, { kind: 'attack', value: 4, hits: 2 }] },
    { name: '余温茶杯', title: '花田深梦 · 茶还未凉', art: 6, hp: 34, pattern: [{ kind: 'guard', value: 9 }, { kind: 'attack', value: 8 }] },
    { name: '缠结线团', title: '花田深梦 · 解不开的结', art: 7, hp: 37, pattern: [{ kind: 'attack', value: 6, hits: 2 }, { kind: 'curse', value: 6 }] },
  ],
  [
    { name: '漏雨的旧伞', title: '雨城浅梦 · 无人来取', art: 3, hp: 30, pattern: [{ kind: 'attack', value: 6 }, { kind: 'guard', value: 7 }] },
    { name: '倒流的水洼', title: '雨城浅梦 · 时间回潮', art: 9, hp: 32, pattern: [{ kind: 'curse', value: 6 }, { kind: 'attack', value: 7 }] },
    { name: '雨灯夜蛾', title: '雨城浅梦 · 借光避雨', art: 5, hp: 34, pattern: [{ kind: 'attack', value: 4, hits: 2 }, { kind: 'guard', value: 8 }] },
    { name: '踩水闹钟', title: '雨城回声 · 准点迟到', art: 0, hp: 36, pattern: [{ kind: 'attack', value: 8 }, { kind: 'curse', value: 6 }] },
    { name: '湿透的线团', title: '雨城回声 · 越理越乱', art: 7, hp: 38, pattern: [{ kind: 'guard', value: 10 }, { kind: 'attack', value: 8 }] },
    { name: '逆风纸鸟', title: '雨城深梦 · 飞不出云', art: 2, hp: 40, pattern: [{ kind: 'attack', value: 5, hits: 2 }, { kind: 'curse', value: 7 }] },
    { name: '雨夜灯塔', title: '雨城深梦 · 错误航向', art: 11, hp: 43, pattern: [{ kind: 'guard', value: 11 }, { kind: 'attack', value: 10 }] },
    { name: '收潮浪影', title: '雨城深梦 · 漫过门槛', art: 10, hp: 46, pattern: [{ kind: 'curse', value: 8 }, { kind: 'attack', value: 6, hits: 2 }] },
  ],
  [
    { name: '咬字旧书', title: '书街浅梦 · 吞掉结尾', art: 8, hp: 36, pattern: [{ kind: 'attack', value: 7 }, { kind: 'curse', value: 6 }] },
    { name: '折页纸鸟', title: '书街浅梦 · 逃离结局', art: 2, hp: 38, pattern: [{ kind: 'attack', value: 5, hits: 2 }, { kind: 'guard', value: 9 }] },
    { name: '墨水水洼', title: '书街浅梦 · 字迹融化', art: 9, hp: 40, pattern: [{ kind: 'curse', value: 7 }, { kind: 'attack', value: 8 }] },
    { name: '夹页花盆', title: '书街回声 · 纸上生根', art: 4, hp: 43, pattern: [{ kind: 'guard', value: 10 }, { kind: 'attack', value: 9 }] },
    { name: '书签线团', title: '书街回声 · 章节缠绕', art: 7, hp: 45, pattern: [{ kind: 'attack', value: 6, hits: 2 }, { kind: 'guard', value: 10 }] },
    { name: '失眠闹钟', title: '书街深梦 · 通宵阅读', art: 0, hp: 47, pattern: [{ kind: 'curse', value: 8 }, { kind: 'attack', value: 10 }] },
    { name: '月纹句号', title: '书街深梦 · 强行终止', art: 13, hp: 50, pattern: [{ kind: 'guard', value: 12 }, { kind: 'attack', value: 11 }] },
    { name: '禁书打孔机', title: '书街深梦 · 禁止翻页', art: 15, hp: 54, pattern: [{ kind: 'attack', value: 7, hits: 2 }, { kind: 'curse', value: 9 }] },
  ],
  [
    { name: '退潮浪影', title: '海岸浅梦 · 不曾抵达', art: 10, hp: 42, pattern: [{ kind: 'attack', value: 8 }, { kind: 'guard', value: 9 }] },
    { name: '灯塔倒影', title: '海岸浅梦 · 两个方向', art: 11, hp: 44, pattern: [{ kind: 'guard', value: 10 }, { kind: 'attack', value: 9 }] },
    { name: '无底水洼', title: '海岸浅梦 · 倒映深海', art: 9, hp: 46, pattern: [{ kind: 'curse', value: 8 }, { kind: 'attack', value: 9 }] },
    { name: '盐风纸鸟', title: '海岸回声 · 飞向旧岸', art: 2, hp: 49, pattern: [{ kind: 'attack', value: 6, hits: 2 }, { kind: 'guard', value: 11 }] },
    { name: '漂流行李箱', title: '海岸回声 · 无人认领', art: 1, hp: 51, pattern: [{ kind: 'guard', value: 12 }, { kind: 'attack', value: 10 }] },
    { name: '翻折旧雨伞', title: '海岸深梦 · 顶风而行', art: 3, hp: 54, pattern: [{ kind: 'attack', value: 11 }, { kind: 'curse', value: 9 }] },
    { name: '月潮硬币', title: '海岸深梦 · 正反潮汐', art: 13, hp: 57, pattern: [{ kind: 'guard', value: 13 }, { kind: 'attack', value: 7, hits: 2 }] },
    { name: '逆转航海钟', title: '海岸深梦 · 回到原点', art: 14, hp: 61, pattern: [{ kind: 'curse', value: 10 }, { kind: 'attack', value: 12 }] },
  ],
  [
    { name: '空愿望盒', title: '集市浅梦 · 等待交换', art: 12, hp: 48, pattern: [{ kind: 'attack', value: 9 }, { kind: 'guard', value: 11 }] },
    { name: '找零月光', title: '集市浅梦 · 代价不明', art: 13, hp: 51, pattern: [{ kind: 'curse', value: 9 }, { kind: 'attack', value: 10 }] },
    { name: '星票打孔机', title: '集市浅梦 · 只售单程', art: 15, hp: 53, pattern: [{ kind: 'attack', value: 6, hits: 2 }, { kind: 'guard', value: 12 }] },
    { name: '会走的茶杯', title: '集市回声 · 余温标价', art: 6, hp: 56, pattern: [{ kind: 'guard', value: 13 }, { kind: 'attack', value: 11 }] },
    { name: '旧货行李箱', title: '集市回声 · 售出远方', art: 1, hp: 59, pattern: [{ kind: 'attack', value: 12 }, { kind: 'curse', value: 10 }] },
    { name: '讨价旧书', title: '集市深梦 · 每页不同价', art: 8, hp: 62, pattern: [{ kind: 'curse', value: 10 }, { kind: 'guard', value: 14 }] },
    { name: '纽扣线团', title: '集市深梦 · 缝补愿望', art: 7, hp: 66, pattern: [{ kind: 'attack', value: 8, hits: 2 }, { kind: 'guard', value: 15 }] },
    { name: '闭灯夜蛾', title: '集市深梦 · 最后一盏灯', art: 5, hp: 70, pattern: [{ kind: 'curse', value: 11 }, { kind: 'attack', value: 13 }] },
  ],
  [
    { name: '无人认领的行李', title: '终点浅梦 · 标签脱落', art: 1, hp: 56, pattern: [{ kind: 'attack', value: 11 }, { kind: 'guard', value: 12 }] },
    { name: '逆行站台钟', title: '终点浅梦 · 永远差一分钟', art: 14, hp: 59, pattern: [{ kind: 'curse', value: 11 }, { kind: 'attack', value: 12 }] },
    { name: '熄灯检票机', title: '终点浅梦 · 单程车票', art: 15, hp: 62, pattern: [{ kind: 'guard', value: 14 }, { kind: 'attack', value: 8, hits: 2 }] },
    { name: '末班愿望盒', title: '终点回声 · 没有收件人', art: 12, hp: 66, pattern: [{ kind: 'attack', value: 13 }, { kind: 'curse', value: 11 }] },
    { name: '月台灯塔', title: '终点回声 · 照错轨道', art: 11, hp: 70, pattern: [{ kind: 'guard', value: 16 }, { kind: 'attack', value: 13 }] },
    { name: '催站发条钟', title: '终点深梦 · 不再等待', art: 0, hp: 74, pattern: [{ kind: 'attack', value: 9, hits: 2 }, { kind: 'curse', value: 12 }] },
    { name: '末页旧书', title: '终点深梦 · 写满站名', art: 8, hp: 78, pattern: [{ kind: 'curse', value: 12 }, { kind: 'guard', value: 17 }] },
    { name: '离站纸鸟群', title: '终点深梦 · 飞越时刻表', art: 2, hp: 83, pattern: [{ kind: 'attack', value: 10, hits: 2 }, { kind: 'guard', value: 18 }] },
  ],
];
export const CHAPTERS = [
  { name: '花田终点站', subtitle: '料理与疗愈装备', art: 1, weather: '晴 · 18℃', color: '#b8cf7a' },
  { name: '终年下雨的城', subtitle: '护盾与持续效果', art: 2, weather: '雨 · 12℃', color: '#83b8c6' },
  { name: '云端旧书街', subtitle: '书信与抽牌装备', art: 3, weather: '多云 · 15℃', color: '#d6a868' },
  { name: '没有影子的海岸', subtitle: '行动与清醒梦装备', art: 4, weather: '风 · 21℃', color: '#72b7a4' },
  { name: '午夜星光集市', subtitle: '高品质随机词条', art: 2, weather: '夜 · 9℃', color: '#c58ba8' },
  { name: '被遗忘的终点站', subtitle: '传奇与套装底材', art: 4, weather: '未知', color: '#a7a0ca' },
];
export const GUESTS = [
  { name: '小满', room: '01号客房', title: '不肯告别的园丁', wish: '想把花田里最后一束花送出去。', chapters: ['她每天都在重复修剪同一片花田。', '她终于记起，那束花原本要送给谁。', '清晨，她把花留在窗边，第一次离开了花田。'], gift: '会写字的钢笔' },
  { name: '林夏', room: '02号客房', title: '等雨停的人', wish: '相信雨停以后，错过的人还会回来。', chapters: ['她把每一次雨声都当成敲门声。', '房间里那把伞，从来不是为自己准备的。', '雨没有停，但她决定撑伞出门。'], gift: '守夜风衣' },
  { name: '阿纸', room: '03号客房', title: '忘记结局的读者', wish: '寻找一本被自己撕掉结局的旧书。', chapters: ['书街上的每本书都少了最后一页。', '他承认自己害怕看到故事结束。', '他写下新的结尾，把书留在旅店书架上。'], gift: '没有日期的房卡' },
  { name: '遥遥', room: '04号客房', title: '没有影子的旅客', wish: '想在海岸找回曾经舍弃的那部分自己。', chapters: ['她的脚印旁边从来没有影子。', '海面倒映出一个被她遗忘的选择。', '日出时，两道影子重新重叠。'], gift: '星光披肩' },
  { name: '七月', room: '05号客房', title: '收走愿望的摊主', wish: '替别人保管太多愿望，忘了自己的那个。', chapters: ['每件商品都写着陌生人的愿望。', '最旧的盒子上，落款却是她自己。', '她关掉摊位，带着唯一没有出售的愿望上车。'], gift: '黄昏留声机' },
  { name: '无名旅客', room: '阁楼客房', title: '最后一站的乘客', wish: '希望有人记得，自己曾经来过这里。', chapters: ['行李牌上的名字被雨水洗掉了。', '六座城市都留有属于这位旅客的物件。', '登记簿上出现名字时，终点站重新亮起灯。'], gift: '无名旅客的钥匙' },
];
export const MAP_STEPS = 50;
export const CHECKPOINT_STEPS = [10, 20, 30, 40];
export const CHECKPOINTS = {
  10: {
    title: '暖灯休息站',
    text: '第一段夜路走完了。先稳住状态，再决定如何继续。',
    choices: [
      { key: 'rest', icon: 'heart', title: '靠窗睡一会儿', text: '回复 35% 生命' },
      { key: 'upgrade', icon: 'sparkles', title: '整理卡牌', text: '强化 1 张未强化卡牌' },
      { key: 'supplies', icon: 'backpack', title: '补充沿途物资', text: '获得 30 枚旅币' },
    ],
  },
  20: {
    title: '夜路杂货铺',
    text: '车窗外亮着一间只在深夜营业的小店，可以为后半程换些筹码。',
    choices: [
      { key: 'shopCard', icon: 'book', title: '买一张旧明信片', text: '获得 1 张随机卡牌' },
      { key: 'bargain', icon: 'coins', title: '交换一段旧回忆', text: '失去 8 生命，获得 45 旅币' },
      { key: 'shortRest', icon: 'heart', title: '借用店后的躺椅', text: '回复 20% 生命' },
    ],
  },
  30: {
    title: '记忆放映室',
    text: '银幕会重放已经走过的选择，也允许你剪掉一段多余的镜头。',
    choices: [
      { key: 'doubleUpgrade', icon: 'sparkles', title: '重新剪辑', text: '强化最多 2 张卡牌' },
      { key: 'trimDeck', icon: 'book', title: '剪掉重复片段', text: '移除 1 张基础问候卡' },
      { key: 'rememberCard', icon: 'moon', title: '带走一帧回忆', text: '获得 1 张随机卡牌' },
    ],
  },
  40: {
    title: '终夜整备站',
    text: '终点之前的最后一次停靠。把最需要的东西留在手边。',
    choices: [
      { key: 'deepRest', icon: 'heart', title: '睡到月亮西沉', text: '回复 50% 生命' },
      { key: 'tripleUpgrade', icon: 'sparkles', title: '终夜整理', text: '强化最多 3 张卡牌' },
      { key: 'finalSupplies', icon: 'backpack', title: '装满最后一格行囊', text: '获得 60 枚旅币' },
    ],
  },
};
export const SEGMENT_NAMES = ['入梦浅滩', '回声小径', '失序深处', '梦核外环', '终夜核心'];
export const STARTER = ['slash', 'slash', 'slash', 'slash', 'guard', 'guard', 'guard', 'mark', 'heavy', 'focus'];
export const REWARDS = ['riposte', 'leech', 'quick', 'nova', 'fortify', 'echo', 'mend', 'risk', 'tea', 'listen', 'postcard', 'blanket', 'nightRide', 'kitchenLight', 'unsent', 'photoAlbum', 'morningCall', 'stayAwhile', 'lucidDoor', 'goodnight'];
export const CHARACTERS = {
  uncle: {
    name: '大叔', role: '夜班店长', trait: '认真听你说',
    description: '每回合第一次使用能强化后续攻击的牌时，额外抽 1 张牌。',
    schools: ['倾听', '书信'], style: '先强化伤害，再连续出牌',
    starter: ['slash', 'slash', 'slash', 'guard', 'guard', 'mark', 'mark', 'heavy', 'quick', 'focus'],
  },
  gaigai: {
    name: '该该', role: '随车料理师', trait: '还有一杯热的',
    description: '生命已满时，多出的治疗会让下一张攻击牌增加同等伤害。',
    schools: ['料理', '陪伴'], style: '边恢复，边强化下一次攻击', recommended: true,
    starter: ['slash', 'slash', 'slash', 'guard', 'guard', 'leech', 'mend', 'tea', 'riposte', 'focus'],
  },
  xiaoshuai: {
    name: '小帅', role: '梦境修补师', trait: '缝好裂缝',
    description: '回合结束后保留 20% 护盾，护盾抵挡伤害时反击 35%。',
    schools: ['陪伴', '清醒梦'], style: '叠加护盾，稳步反击',
    starter: ['slash', 'slash', 'slash', 'guard', 'guard', 'guard', 'riposte', 'riposte', 'fortify', 'focus'],
  },
};
export const ITEMS = {
  wornBlade: { name: '旧钢笔', slot: 'weapon', rarity: '普通', attack: 1, flavor: '写过许多入住登记，也听过许多故事。' },
  silverBlade: { name: '银边笔记本', slot: 'bag', rarity: '精良', attack: 3, flavor: '每一页都留着不同城市的气味。' },
  crownBlade: { name: '会写字的钢笔', slot: 'weapon', rarity: '史诗', attack: 5, flavor: '有些话，它会替不敢开口的人写下来。' },
  travelCoat: { name: '旅人外套', slot: 'armor', rarity: '普通', block: 1, flavor: '口袋里总能找到一张旧车票。' },
  mossPlate: { name: '苔绿雨衣', slot: 'armor', rarity: '精良', block: 3, flavor: '下再久的雨，也不会让肩膀湿透。' },
  oathPlate: { name: '守夜风衣', slot: 'armor', rarity: '史诗', block: 5, flavor: '适合漫长的夜路，也适合等待。' },
  emberCharm: { name: '温热纽扣', slot: 'charm', rarity: '普通', recovery: 2, flavor: '握在手心时，像刚晒过太阳。' },
  moonCharm: { name: '月相车票', slot: 'charm', rarity: '精良', recovery: 4, flavor: '目的地会随月亮的形状改变。' },
  mistCrown: { name: '没有日期的房卡', slot: 'charm', rarity: '史诗', recovery: 6, flavor: '它能打开一间不存在于白天的客房。' },
  duskBlade: { name: '黄昏留声机', slot: 'decor', rarity: '传说', attack: 7, flavor: '唱针落下时，沿途的晚霞都会回来。' },
  starMantle: { name: '星光披肩', slot: 'scarf', rarity: '传说', block: 7, flavor: '细碎星光藏在每一道针脚里。' },
  namelessSigil: { name: '无名旅客的钥匙', slot: 'charm', rarity: '传说', recovery: 8, flavor: '没有房号，却总能找到该去的门。' },
  morningShears: { name: '晨光花剪', slot: 'weapon', attack: 2, trait: '首次攻击额外造成 2 点伤害', firstStrike: 2, chapter: 0, flavor: '剪去枯枝，也剪开清晨。' },
  gardenLedger: { name: '花田账本', slot: 'bag', attack: 1, recovery: 1, chapter: 0, flavor: '每笔收入旁都画着一朵花。' },
  greenhouseApron: { name: '温室围裙', slot: 'armor', block: 2, chapter: 0, flavor: '沾着泥土，却一直很暖。' },
  dewScarf: { name: '露水围巾', slot: 'scarf', recovery: 2, chapter: 0, flavor: '清晨披上时会闻到青草香。' },
  flowerPostcard: { name: '压花明信片', slot: 'charm', recovery: 2, skill: 'postcard', chapter: 0, flavor: '背面写着一句迟到的问候。' },
  dawnButton: { name: '黎明纽扣', slot: 'decor', block: 1, recovery: 1, chapter: 0, flavor: '比闹钟更早醒来。' },
  rainRadio: { name: '雨声收音机', slot: 'decor', attack: 2, skill: 'nightRide', chapter: 1, flavor: '杂音里藏着远方车站。' },
  puddleCompass: { name: '水洼罗盘', slot: 'weapon', attack: 2, chapter: 1, flavor: '指针总偏向没有伞的人。' },
  blueUmbrella: { name: '深蓝长伞', slot: 'scarf', block: 3, chapter: 1, flavor: '足够为两个人挡雨。' },
  windowCoat: { name: '车窗雨衣', slot: 'armor', block: 2, recovery: 1, chapter: 1, flavor: '雨滴会在衣角变成小灯。' },
  rainTicket: { name: '雨夜车票', slot: 'charm', recovery: 3, chapter: 1, flavor: '字迹被雨洇开，却仍能检票。' },
  thunderPin: { name: '雷云别针', slot: 'decor', attack: 1, block: 1, chapter: 1, flavor: '偶尔发出很轻的雷声。' },
  bookmarkKnife: { name: '书签裁纸刀', slot: 'weapon', attack: 3, chapter: 2, flavor: '只裁开尚未读过的章节。' },
  marginPencil: { name: '页边铅笔', slot: 'bag', attack: 2, skill: 'echo', chapter: 2, flavor: '写下的话会在下一页回应。' },
  readerCardigan: { name: '读者针织衫', slot: 'armor', block: 3, chapter: 2, flavor: '袖口藏着借书卡。' },
  cloudCape: { name: '云页披风', slot: 'scarf', block: 2, recovery: 2, chapter: 2, flavor: '翻动时像一册很轻的书。' },
  lastPage: { name: '最后一页', slot: 'charm', recovery: 3, skill: 'photoAlbum', chapter: 2, flavor: '故事结束后仍留有余温。' },
  libraryKey: { name: '闭馆后的钥匙', slot: 'decor', attack: 2, chapter: 2, flavor: '能打开只在夜里出现的书架。' },
  tideRecorder: { name: '潮汐录音笔', slot: 'decor', attack: 4, chapter: 3, flavor: '播放时，房间会有海风。' },
  shellPen: { name: '贝壳笔', slot: 'weapon', attack: 3, chapter: 3, flavor: '写出的字带一点盐味。' },
  saltWindbreaker: { name: '盐风外套', slot: 'armor', block: 4, chapter: 3, flavor: '经得住很远的海路。' },
  reflectionShawl: { name: '倒影披肩', slot: 'scarf', block: 3, recovery: 1, chapter: 3, flavor: '水面平静时才会显出花纹。' },
  moonShell: { name: '月光海螺', slot: 'charm', recovery: 4, chapter: 3, flavor: '贴近耳边能听见归航声。' },
  lighthouseBadge: { name: '灯塔徽章', slot: 'bag', block: 2, chapter: 3, flavor: '黑夜里总有一角发亮。' },
  wishScale: { name: '愿望刻度尺', slot: 'weapon', attack: 5, chapter: 4, flavor: '衡量愿望，不衡量价钱。' },
  starCoupon: { name: '星光兑换券', slot: 'bag', attack: 4, chapter: 4, flavor: '仅在午夜市场有效。' },
  velvetMarketCoat: { name: '天鹅绒夜市大衣', slot: 'armor', block: 5, chapter: 4, flavor: '口袋多得像一条街。' },
  lanternVest: { name: '灯笼马甲', slot: 'scarf', block: 4, recovery: 2, chapter: 4, flavor: '系好扣子就亮起一盏灯。' },
  wishBox: { name: '未拆封愿望盒', slot: 'decor', recovery: 5, chapter: 4, flavor: '摇一摇，会听到微弱回声。' },
  luckyCoin: { name: '双面幸运币', slot: 'charm', attack: 2, recovery: 2, chapter: 4, flavor: '两面都刻着好运。' },
  platformWhistle: { name: '站台银哨', slot: 'weapon', attack: 6, chapter: 5, flavor: '吹响时，远处会有灯回应。' },
  timetablePen: { name: '时刻表钢笔', slot: 'bag', attack: 5, skill: 'morningCall', chapter: 5, flavor: '永远能写下下一班车。' },
  midnightUniform: { name: '午夜站务服', slot: 'armor', block: 6, chapter: 5, flavor: '在最后一班车后依然整洁。' },
  lastTrainCoat: { name: '末班车大衣', slot: 'armor', block: 5, recovery: 3, chapter: 5, flavor: '衣领里留着旅途的温度。' },
  blankTicket: { name: '空白终点票', slot: 'charm', recovery: 6, chapter: 5, flavor: '目的地由持票人填写。' },
  stationKey: { name: '终点站钥匙', slot: 'decor', attack: 3, block: 3, chapter: 5, flavor: '打开门后就是清晨。' },
};
export const SLOT_LABELS = { weapon: '随身工具', armor: '旅行衣装', bag: '随行收纳', scarf: '保暖配饰', charm: '纪念物', decor: '房车摆件' };
export const AFFIX_LABELS = { attack: '伤害', block: '护盾', recovery: '战后恢复' };
const AFFIXES = [
  { key: 'attack', prefix: '敏锐的', min: 1, max: 3 },
  { key: 'block', prefix: '安稳的', min: 1, max: 3 },
  { key: 'recovery', prefix: '温热的', min: 1, max: 4 },
];
const RARITIES = [
  { name: '普通', affixes: 0 },
  { name: '精良', affixes: 2 },
  { name: '稀有', affixes: 3 },
  { name: '传奇', affixes: 4 },
];
export const CHAPTER_LOOT = [
  ['wornBlade', 'emberCharm', 'morningShears', 'gardenLedger', 'greenhouseApron', 'dewScarf', 'flowerPostcard', 'dawnButton'],
  ['silverBlade', 'travelCoat', 'rainRadio', 'puddleCompass', 'blueUmbrella', 'windowCoat', 'rainTicket', 'thunderPin'],
  ['crownBlade', 'mossPlate', 'bookmarkKnife', 'marginPencil', 'readerCardigan', 'cloudCape', 'lastPage', 'libraryKey'],
  ['oathPlate', 'moonCharm', 'tideRecorder', 'shellPen', 'saltWindbreaker', 'reflectionShawl', 'moonShell', 'lighthouseBadge'],
  ['mistCrown', 'duskBlade', 'wishScale', 'starCoupon', 'velvetMarketCoat', 'lanternVest', 'wishBox', 'luckyCoin'],
  ['starMantle', 'namelessSigil', 'platformWhistle', 'timetablePen', 'midnightUniform', 'lastTrainCoat', 'blankTicket', 'stationKey'],
];
export function itemFor(state, id) {
  return state?.inventory?.find(item => item.id === id) || null;
}
export function itemName(item) {
  if (!item) return '未知物品';
  const prefix = item.skill ? '会做梦的' : item.affixes?.[0]?.prefix;
  return `${prefix ? `${prefix} ` : ''}${ITEMS[item.base].name}`;
}
export function itemLines(item) {
  if (!item) return [];
  const base = ITEMS[item.base];
  const totals = { attack: base.attack || 0, block: base.block || 0, recovery: base.recovery || 0 };
  for (const affix of item.affixes || []) totals[affix.key] += affix.value;
  const lines = Object.entries(totals).filter(([, value]) => value > 0).map(([key, value]) => `${AFFIX_LABELS[key]} +${value}`);
  if (base.trait) lines.push(base.trait);
  if (item.skill) lines.push(`附带技能：${CARDS[item.skill].name}`);
  return lines;
}
export function itemScore(item) {
  if (!item) return 0;
  const base = ITEMS[item.base];
  const totals = { attack: base.attack || 0, block: base.block || 0, recovery: base.recovery || 0 };
  for (const affix of item.affixes || []) totals[affix.key] += affix.value;
  return totals.attack * 3 + totals.block * 2 + totals.recovery * 2 + (base.firstStrike || 0) * 3 + (item.skill ? 12 : 0);
}
export function salvageValue(item) {
  return [6, 12, 24, 48][Math.max(0, RARITIES.findIndex(rarity => rarity.name === item?.rarity))];
}
export function rerollCost(item, workshopLevel = 0) {
  const base = [12, 24, 42, 72][Math.max(0, RARITIES.findIndex(rarity => rarity.name === item?.rarity))];
  return Math.max(6, Math.ceil(base * (1 - Math.min(3, workshopLevel) * .12)));
}
export function facilityCost(level) { return [80, 160, 280][level] ?? null; }
export function commissionStatus(s, key) {
  const claim = s.commissionClaims?.[key] || 0;
  const definitions = {
    battles: { value: s.victories, target: (claim + 1) * 12, reward: 100 + claim * 20 },
    steps: { value: s.stepsTraveled, target: (claim + 1) * 50, reward: 120 + claim * 20 },
    stories: { value: s.clears.reduce((sum, count) => sum + count, 0), target: (claim + 1) * 3, reward: 160 + claim * 30 },
  };
  return definitions[key] || null;
}
function rollAffixes(s, count) {
  const affixes = [];
  for (let i = 0; i < count; i++) {
    const definition = AFFIXES[Math.floor(random(s) * AFFIXES.length)];
    const tier = Math.floor(s.stage / 2);
    const value = definition.min + Math.floor(random(s) * (definition.max - definition.min + 1)) + tier;
    affixes.push({ key: definition.key, value, prefix: definition.prefix });
  }
  return affixes;
}
function rollItem(s, base, boosted = false) {
  const qualityRoll = random(s) + (boosted ? .2 : 0);
  const rarityIndex = qualityRoll > 1.06 ? 3 : qualityRoll > .78 ? 2 : qualityRoll > .42 ? 1 : 0;
  const rarity = RARITIES[rarityIndex];
  const affixes = rollAffixes(s, rarity.affixes);
  const skillChance = rarityIndex === 3 ? 1 : rarityIndex === 2 ? .35 : 0;
  const preferred = REWARDS.filter(key => CHARACTERS[s.character]?.schools.includes(CARDS[key].school));
  const skillPool = preferred.length && random(s) < .7 ? preferred : REWARDS;
  const skill = ITEMS[base].skill || (random(s) < skillChance ? skillPool[Math.floor(random(s) * skillPool.length)] : null);
  return { id: `gear-${s.nextItemId++}`, base, rarity: rarity.name, affixes, skill };
}
function storyItem(s, stage) {
  const base = CHAPTER_LOOT[stage][7];
  return { id: `gear-${s.nextItemId++}`, base, rarity: '传奇', affixes: rollAffixes(s, 4), skill: REWARDS[(stage * 3 + s.clears[stage]) % REWARDS.length] };
}
export function buildChapterMap(chapter = 0, mapSeed = chapter + 1) {
  const nodes = [];
  let routeSeed = (mapSeed ^ ((chapter + 1) * 0x9e3779b9)) >>> 0;
  const routeRandom = () => {
    routeSeed = (routeSeed + 0x6d2b79f5) >>> 0;
    let value = routeSeed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const types = ['battle', 'battle', 'event', 'camp', 'elite'];
  for (let row = 0; row < MAP_STEPS - 1; row++) {
    if (CHECKPOINT_STEPS.includes(row + 1)) {
      nodes.push({ id: `c${chapter}r${row}checkpoint`, row, x: 50, type: 'checkpoint', links: [] });
      continue;
    }
    const count = row === 0 ? 3 : routeRandom() < .42 ? 2 : 3;
    const anchors = count === 2 ? [31, 69] : [20, 50, 80];
    for (let index = 0; index < count; index++) {
      const jitter = Math.round((routeRandom() - .5) * (count === 2 ? 18 : 12));
      const type = row === 0 ? 'battle' : types[Math.floor(routeRandom() * types.length)];
      nodes.push({ id: `c${chapter}r${row}n${index}`, row, x: Math.max(12, Math.min(88, anchors[index] + jitter)), type, links: [] });
    }
  }
  nodes.push({ id: `c${chapter}boss`, row: MAP_STEPS - 1, x: 50, type: 'boss', links: [] });
  for (let row = 0; row < MAP_STEPS - 1; row++) {
    const current = nodes.filter(item => item.row === row);
    const next = nodes.filter(item => item.row === row + 1);
    for (const node of current) {
      const ranked = next.map(item => ({ id: item.id, distance: Math.abs(item.x - node.x) + routeRandom() * 22 })).sort((a, b) => a.distance - b.distance);
      const linkCount = row === MAP_STEPS - 2 ? 1 : Math.min(next.length, routeRandom() < .48 ? 1 : 2);
      node.links = ranked.slice(0, linkCount).map(item => item.id);
    }
    for (const target of next) {
      if (current.some(node => node.links.includes(target.id))) continue;
      const nearest = [...current].sort((a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x))[0];
      nearest.links.push(target.id);
    }
  }
  return nodes;
}
export const MAP_NODES = buildChapterMap(0);
export function chapterMap(chapter, mapSeed) { return buildChapterMap(chapter, mapSeed); }
export function card(key) {
  const equipmentGranted = key.endsWith('~gear');
  const normalized = equipmentGranted ? key.slice(0, -5) : key;
  const upgraded = normalized.endsWith('+');
  const baseKey = normalized.replace('+', '');
  const base = CARDS[baseKey];
  if (!base) throw new Error('Unknown card');
  const c = { ...base, key, baseKey, upgraded, equipmentGranted };
  if (equipmentGranted) c.cost = 0;
  if (upgraded) {
    c.name += ' +';
    if (c.damage) c.damage += 3;
    if (c.block) c.block += 3;
    if (c.heal) c.heal += 3;
    if (c.mark) c.mark += 1;
    if (c.energy) c.energy += 1;
    if (c.self) c.self = 1;
  }
  return c;
}
export function description(key) {
  const c = card(key), parts = [];
  if (c.damage) parts.push(`造成 ${c.damage}${c.hits ? ` × ${c.hits}` : ''} 点伤害`);
  if (c.block) parts.push(`获得 ${c.block} 点护盾`);
  if (c.mark) parts.push(`发现 ${c.mark} 层弱点`);
  if (c.heal) parts.push(`回复 ${c.heal} 点生命`);
  if (c.energy) parts.push(`获得 ${c.energy} 点能量`);
  if (c.self) parts.push(`消耗 ${c.self} 点生命`);
  if (c.draw) parts.push(`抽 ${c.draw} 张牌`);
  if (c.retain) parts.push('保留到下一回合');
  return parts;
}
function random(s) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function shuffle(s, items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function log(s, text) {
  s.log = [text, ...s.log].slice(0, 24);
  if (Array.isArray(s.battleLog) && ['combat', 'reward', 'won', 'lost'].includes(s.phase)) {
    s.battleLog = [...s.battleLog, text].slice(-160);
  }
}
function logBattleStatus(s) {
  const foe = enemyFor(s);
  const playerGuard = s.block > 0 ? ` · 护盾 ${s.block}` : '';
  const warmth = s.character === 'gaigai' && s.warmth > 0 ? ` · 暖意 ${s.warmth}` : '';
  const enemyGuard = s.enemy.block > 0 ? ` · 护盾 ${s.enemy.block}` : '';
  log(s, `状态：你 ${s.hp}/${s.maxHp} 生命${playerGuard}${warmth}｜${foe.name} ${s.enemy.hp}/${s.enemy.maxHp} 生命${enemyGuard}`);
}
function draw(s, count) {
  for (let i = 0; i < count && s.hand.length < 9; i++) {
    if (!s.draw.length && s.discard.length) {
      s.draw = shuffle(s, s.discard); s.discard = [];
      log(s, '弃牌洗回抽牌堆。');
    }
    if (!s.draw.length) break;
    s.hand.push(s.draw.pop());
  }
}
export function intent(s) {
  const enemy = enemyFor(s);
  const base = enemy.pattern[(s.turn - 1) % enemy.pattern.length];
  const depth = Math.max(0, s.mapRow || 0);
  const difficulty = DIFFICULTIES[s.difficulty] || DIFFICULTIES.standard;
  const multiplier = (1 + s.stage * .08 + depth * difficulty.damageDepth + Math.max(0, s.turn - 1) * difficulty.turnDamage + (s.elite ? .12 : 0) + (s.bossFight ? .22 : 0)) * difficulty.damage;
  return { ...base, value: Math.max(1, Math.round(base.value * multiplier)) };
}
export function enemyFor(s) {
  if (!s) return ENEMIES[0];
  if (s.bossFight) return ENEMIES[s.stage];
  const encounter = ENCOUNTERS[s.stage]?.[s.foe] || ENCOUNTERS[s.stage]?.[0];
  return { ...encounter, place: ENEMIES[s.stage].place };
}
export function attackPreview(s, key) {
  const c = card(key);
  if (!c.damage) return 0;
  const stats = equipmentStats(s);
  const baseDamage = c.damage + stats.attack + (s.played === 0 ? stats.firstStrike : 0);
  const base = s.weak > 0 ? Math.floor(baseDamage * .75) : baseDamage;
  return base * (c.hits || 1) + s.enemy.mark * 3 + (s.character === 'gaigai' ? s.warmth || 0 : 0);
}
export function equipmentStats(s) {
  const equipped = s?.equipment || {};
  return Object.values(equipped).reduce((total, id) => {
    const instance = itemFor(s, id);
    const item = instance && ITEMS[instance.base];
    if (!item) return total;
    total.attack += item.attack || 0;
    total.block += item.block || 0;
    total.recovery += item.recovery || 0;
    for (const affix of instance.affixes || []) total[affix.key] += affix.value;
    total.firstStrike += item.firstStrike || 0;
    return total;
  }, { attack: 0, block: 0, recovery: 0, firstStrike: 0 });
}
function beginBattle(s) {
  s.phase = 'combat'; s.turn = 1; s.energy = 3; s.weak = 0;
  s.warmth = 0; s.traitUsed = false;
  s.battleLog = [];
  s.block = (s.relic ? 2 : 0) + equipmentStats(s).block;
  const difficulty = DIFFICULTIES[s.difficulty] || DIFFICULTIES.standard;
  const depthScale = 1 + Math.max(0, s.mapRow) * difficulty.hpDepth;
  const rankScale = s.bossFight ? 1.65 : s.elite ? 1.3 : 1;
  const foe = enemyFor(s);
  const maxHp = Math.round(foe.hp * depthScale * rankScale * difficulty.hp);
  s.enemy = { hp: maxHp, maxHp, block: 0, mark: 0 };
  const grantedCards = Object.values(s.equipment).map(id => itemFor(s, id)?.skill).filter(Boolean).map(skill => `${skill}~gear`);
  s.draw = shuffle(s, [...s.deck, ...grantedCards]); s.hand = []; s.discard = []; s.exhaust = [];
  s.choices = [];
  draw(s, 5);
  log(s, `抵达${foe.place}，遭遇${foe.name}。`);
  log(s, '第 1 回合开始，能量恢复至 3。');
  logBattleStatus(s);
}
export function newRun(seed = Date.now() >>> 0, battleMode = 'manual', difficulty = 'standard', character = 'uncle') {
  const inventory = [
    { id: 'gear-1', base: 'wornBlade', rarity: '普通', affixes: [], skill: null },
    { id: 'gear-2', base: 'travelCoat', rarity: '普通', affixes: [], skill: null },
  ];
  const selectedDifficulty = DIFFICULTIES[difficulty] ? difficulty : 'standard';
  const selectedCharacter = CHARACTERS[character] ? character : 'uncle';
  const s = { version: VERSION, seed: seed >>> 0, mapSeed: seed >>> 0, character: selectedCharacter, warmth: 0, traitUsed: false, difficulty: selectedDifficulty, battleMode: battleMode === 'manual' ? 'manual' : 'auto', tutorialDone: false, phase: 'hub', stage: 0, unlocked: 0, clears: [0, 0, 0, 0, 0, 0], guestRewards: [false, false, false, false, false, false], level: 1, xp: 0, nextXp: 45, hp: 70, maxHp: 70, gold: 0, facilities: { kitchen: 0, workshop: 0, rooms: 0 }, commissionClaims: { battles: 0, steps: 0, stories: 0 }, stepsTraveled: 0, relic: false, elite: false, bossFight: false, foe: 0, checkpointRow: -1, inventory, equipment: { weapon: 'gear-1', armor: 'gear-2', bag: null, scarf: null, charm: null, decor: null }, nextItemId: 3, lastLoot: null, deck: [...CHARACTERS[selectedCharacter].starter], log: [], battleLog: [], played: 0, totalTurns: 0, victories: 0, mapRow: -1, currentNode: null, visited: [] };
  s.turn = 1; s.energy = 3; s.block = 0; s.weak = 0; s.enemy = { hp: 0, maxHp: 0, block: 0, mark: 0 };
  s.draw = []; s.hand = []; s.discard = []; s.exhaust = []; s.choices = [];
  log(s, '房车在花田边停稳，第一盏夜灯已经亮起。');
  return s;
}

export function chooseAutoCard(s) {
  if (!s || s.phase !== 'combat') return -1;
  const affordable = s.hand.map((key, index) => ({ index, card: card(key) })).filter(item => item.card.cost <= s.energy);
  return affordable.find(item => item.card.cost === 0)?.index
    ?? affordable.find(item => item.card.damage)?.index
    ?? affordable[0]?.index
    ?? -1;
}
function victory(s) {
  const foe = enemyFor(s);
  const difficulty = DIFFICULTIES[s.difficulty] || DIFFICULTIES.standard;
  const rewardScale = difficulty.reward;
  s.victories++; s.gold += Math.round((24 + s.stage * 8 + (s.elite ? 16 : 0)) * rewardScale);
  const xpGain = Math.round((30 + s.stage * 14 + (s.elite ? 18 : 0)) * rewardScale);
  s.xp += xpGain;
  let levels = 0;
  while (s.xp >= s.nextXp) {
    s.xp -= s.nextXp; s.level++; levels++; s.nextXp = 45 + (s.level - 1) * 20;
    s.maxHp += 6; s.hp += difficulty.levelHeal;
  }
  const recovery = Math.round((3 + equipmentStats(s).recovery + s.facilities.kitchen * 2) * difficulty.recovery);
  s.hp = Math.min(s.maxHp, s.hp + recovery);
  const lootPool = CHAPTER_LOOT[s.stage];
  const dropWindow = s.bossFight ? 5 : s.elite ? 4 : 3;
  const dropOffset = (s.foe * 3 + s.mapRow + Math.floor(random(s) * dropWindow)) % lootPool.length;
  const itemKey = lootPool[dropOffset];
  const dropped = rollItem(s, itemKey, s.elite || s.bossFight);
  s.inventory.unshift(dropped);
  s.lastLoot = dropped.id;
  s.phase = 'reward';
  const preferred = REWARDS.filter(key => CHARACTERS[s.character].schools.includes(CARDS[key].school));
  const others = REWARDS.filter(key => !preferred.includes(key));
  s.choices = [...shuffle(s, preferred).slice(0, 2), ...shuffle(s, others).slice(0, 1)];
  log(s, `击败${foe.name}，获得 ${xpGain} 点经验。`);
  if (levels) log(s, `店主升至 ${s.level} 级，生命上限提高。`);
  log(s, `获得${dropped.rarity}装备「${itemName(dropped)}」。`);
  log(s, `战斗结束后回复 ${recovery} 点生命。`);
}
// All game transitions are pure and serializable, so tests and saved runs use the same rules.
export function transition(state, action) {
  if (!state || !action) return state;
  const s = structuredClone(state);
  if (action.type === 'tutorialDone' && s.phase === 'combat') { s.tutorialDone = true; return s; }
  if (action.type === 'depart' && s.phase === 'hub') {
    if (!Number.isInteger(action.stage) || action.stage < 0 || action.stage > s.unlocked) return state;
    s.stage = action.stage; s.phase = 'map'; s.mapSeed = Math.floor(random(s) * 4294967296) >>> 0; s.mapRow = -1; s.currentNode = null; s.visited = []; s.checkpointRow = -1;
    s.hp = s.maxHp; s.elite = false; s.bossFight = false;
    log(s, `日落前抵达「${CHAPTERS[s.stage].name}」，今晚的梦境路线已经出现。`);
    return s;
  }
  if (action.type === 'returnHub' && s.phase === 'map') {
    s.phase = 'hub'; s.mapRow = -1; s.currentNode = null; s.visited = []; s.checkpointRow = -1;
    s.hp = s.maxHp; s.elite = false; s.bossFight = false;
    log(s, '收起梦境地图，回到亮着灯的房车。');
    return s;
  }
  if (action.type === 'auto' && s.phase === 'combat' && s.battleMode === 'auto') {
    const index = chooseAutoCard(s);
    return transition(s, index >= 0 ? { type: 'play', index } : { type: 'end' });
  }
  if (action.type === 'node' && s.phase === 'map') {
    const nodes = chapterMap(s.stage, s.mapSeed);
    const node = nodes.find(item => item.id === action.id);
    const previous = nodes.find(item => item.id === s.currentNode);
    const available = s.mapRow < 0 ? nodes.filter(item => item.row === 0).map(item => item.id) : (previous?.links || []);
    if (!node || !available.includes(node.id) || s.visited.includes(node.id)) return state;
    s.currentNode = node.id; s.mapRow = node.row; s.visited.push(node.id); s.stepsTraveled++; s.elite = node.type === 'elite'; s.bossFight = node.type === 'boss';
    const encounterCount = ENCOUNTERS[s.stage]?.length || 1;
    const encounterSeed = (s.mapSeed ^ Math.imul(node.row + 1, 2654435761) ^ Math.imul(Math.round(node.x), 2246822519)) >>> 0;
    s.foe = s.bossFight ? 0 : encounterSeed % encounterCount;
    if (['battle', 'elite', 'boss'].includes(node.type)) { beginBattle(s); return s; }
    if (node.type === 'camp') { s.phase = 'camp'; log(s, '路边的休息站还亮着一盏小灯。'); return s; }
    if (node.type === 'checkpoint') { s.phase = 'checkpoint'; log(s, `抵达第 ${node.row + 1} 步夜程路标，房车在梦境边缘停靠。`); return s; }
    s.phase = 'event'; log(s, '岔路深处传来杯碟与旅币碰撞的声音。'); return s;
  }
  if (action.type === 'equip' && s.phase !== 'combat') {
    const instance = itemFor(s, action.key);
    const item = instance && ITEMS[instance.base];
    if (!item) return state;
    s.equipment[item.slot] = instance.id;
    log(s, `已装备「${itemName(instance)}」。`);
    return s;
  }
  if (action.type === 'reroll' && s.phase === 'hub') {
    const instance = itemFor(s, action.key);
    if (!instance) return state;
    const cost = rerollCost(instance, s.facilities.workshop);
    if (s.gold < cost) return state;
    const affixCount = RARITIES.find(rarity => rarity.name === instance.rarity)?.affixes || 0;
    if (!affixCount) return state;
    s.gold -= cost;
    instance.affixes = rollAffixes(s, affixCount);
    log(s, `花费 ${cost} 枚旅币，为「${itemName(instance)}」重抽了属性。`);
    return s;
  }
  if (action.type === 'salvage' && s.phase === 'hub') {
    const instance = itemFor(s, action.key);
    if (!instance || Object.values(s.equipment).includes(instance.id)) return state;
    const value = salvageValue(instance);
    s.inventory = s.inventory.filter(item => item.id !== instance.id);
    if (s.lastLoot === instance.id) s.lastLoot = null;
    s.gold += value;
    log(s, `拆解「${itemName(instance)}」，回收 ${value} 枚旅币。`);
    return s;
  }
  if (action.type === 'claimGuestReward' && s.phase === 'hub') {
    const stage = action.stage;
    if (!Number.isInteger(stage) || stage < 0 || stage >= GUESTS.length || s.clears[stage] < 3 || s.guestRewards[stage]) return state;
    const gift = storyItem(s, stage);
    s.inventory.unshift(gift); s.lastLoot = gift.id; s.guestRewards[stage] = true;
    log(s, `${GUESTS[stage].name}完成入住故事，留下传奇纪念品「${itemName(gift)}」。`);
    return s;
  }
  if (action.type === 'upgradeFacility' && s.phase === 'hub') {
    if (!['kitchen', 'workshop', 'rooms'].includes(action.key)) return state;
    const level = s.facilities[action.key], cost = facilityCost(level);
    if (cost === null || s.gold < cost) return state;
    s.gold -= cost; s.facilities[action.key]++;
    if (action.key === 'rooms') { s.maxHp += 6; s.hp += 6; }
    const names = { kitchen: '暖灯厨房', workshop: '随车工坊', rooms: '旅客房间' };
    log(s, `${names[action.key]}升至 ${s.facilities[action.key]} 级。`);
    return s;
  }
  if (action.type === 'claimCommission' && s.phase === 'hub') {
    if (!['battles', 'steps', 'stories'].includes(action.key)) return state;
    const commission = commissionStatus(s, action.key);
    if (!commission || commission.value < commission.target) return state;
    s.gold += commission.reward; s.commissionClaims[action.key]++;
    log(s, `完成旅程委托，领取 ${commission.reward} 枚旅币。`);
    return s;
  }
  if (action.type === 'play' && s.phase === 'combat') {
    if (!Number.isInteger(action.index) || action.index < 0 || action.index >= s.hand.length) return state;
    const key = s.hand[action.index], c = card(key);
    if (c.cost > s.energy) return state;
    s.hand.splice(action.index, 1); s.energy -= c.cost; s.played++;
    if (c.block) s.block += c.block;
    let traitTriggered = false;
    if (c.mark) {
      s.enemy.mark += c.mark;
      if (s.character === 'uncle' && !s.traitUsed) {
        s.traitUsed = true;
        traitTriggered = true;
        draw(s, 1);
      }
    }
    if (c.energy) s.energy += c.energy;
    const missingHp = s.maxHp - s.hp;
    const effectiveHealing = c.heal ? Math.max(1, Math.round(c.heal * (DIFFICULTIES[s.difficulty]?.healing || 1))) : 0;
    const healed = c.heal ? Math.min(effectiveHealing, missingHp) : 0;
    const overheal = c.heal ? Math.max(0, effectiveHealing - healed) : 0;
    if (c.heal) {
      s.hp += healed;
      if (s.character === 'gaigai' && overheal) s.warmth = Math.min(12, s.warmth + overheal);
    }
    if (c.self) s.hp = Math.max(0, s.hp - c.self);
    let damage = 0;
    const warmthBonus = c.damage && s.character === 'gaigai' ? s.warmth : 0;
    if (c.damage) {
      for (let i = 0; i < (c.hits || 1); i++) {
        const stats = equipmentStats(s);
        const equippedDamage = c.damage + stats.attack + (s.played === 1 ? stats.firstStrike : 0);
        const amount = (s.weak > 0 ? Math.floor(equippedDamage * .75) : equippedDamage) + s.enemy.mark * 3 + (i === 0 ? warmthBonus : 0);
        s.enemy.mark = 0;
        const absorbed = Math.min(s.enemy.block, amount);
        s.enemy.block -= absorbed;
        damage += amount - absorbed;
        s.enemy.hp = Math.max(0, s.enemy.hp - (amount - absorbed));
      }
    }
    const effects = [];
    if (c.damage) effects.push(`造成 ${damage} 点伤害`);
    if (c.block) effects.push(`获得 ${c.block} 点护盾`);
    if (c.mark) effects.push(`发现 ${c.mark} 层弱点${traitTriggered ? '，触发特性抽 1 张牌' : ''}`);
    if (c.heal) effects.push(`回复 ${healed} 点生命`);
    if (overheal && s.character === 'gaigai') effects.push(`积攒 ${overheal} 点暖意`);
    if (warmthBonus) { effects.push(`消耗暖意追加 ${warmthBonus} 点伤害`); s.warmth = 0; }
    if (c.energy) effects.push(`恢复 ${c.energy} 点能量`);
    if (c.draw) effects.push(`抽取 ${c.draw} 张牌`);
    if (c.self) effects.push(`消耗 ${c.self} 点生命`);
    log(s, `你打出「${c.name}」：${effects.join('，') || '效果发动'}。`);
    logBattleStatus(s);
    // Draw before discarding the played card to prevent a zero-cost card drawing itself.
    if (c.draw) draw(s, c.draw);
    (c.exhaust ? s.exhaust : s.discard).push(key);
    if (s.hp <= 0) { s.phase = 'lost'; log(s, '旅途暂止于此。'); }
    else if (s.enemy.hp <= 0) victory(s);
    return s;
  }
  if (action.type === 'end' && s.phase === 'combat') {
    const move = intent(s);
    const foe = enemyFor(s);
    const retained = s.hand.filter(key => card(key).retain);
    s.discard.push(...s.hand.filter(key => !card(key).retain)); s.hand = retained;
    s.enemy.block = 0;
    s.weak = Math.max(0, s.weak - 1);
    if (move.kind === 'guard') {
      s.enemy.block = move.value;
      log(s, `${foe.name}获得 ${move.value} 点护盾。`);
    } else {
      let damage = 0;
      let absorbedTotal = 0;
      for (let i = 0; i < (move.hits || 1); i++) {
        const guardPierce = DIFFICULTIES[s.difficulty]?.guardPierce || 0;
        const blockableDamage = Math.max(0, move.value - Math.ceil(move.value * guardPierce));
        const absorbed = Math.min(s.block, blockableDamage);
        s.block -= absorbed; damage += move.value - absorbed; absorbedTotal += absorbed;
      }
      s.hp = Math.max(0, s.hp - damage);
      log(s, `${foe.name}造成 ${damage} 点伤害。`);
      if (s.character === 'xiaoshuai' && absorbedTotal > 0) {
        const reflected = Math.ceil(absorbedTotal * .35);
        s.enemy.hp = Math.max(0, s.enemy.hp - reflected);
        log(s, `小帅用护盾反击，造成 ${reflected} 点伤害。`);
      }
      if (move.kind === 'curse') { s.weak = 1; log(s, '你陷入动摇，下回合共鸣效果降低 25%。'); }
    }
    logBattleStatus(s);
    s.totalTurns++;
    if (s.hp <= 0) { s.phase = 'lost'; log(s, '旅途暂止于此。'); return s; }
    if (s.enemy.hp <= 0) { victory(s); return s; }
    const retainedBlock = s.character === 'xiaoshuai' ? Math.floor(s.block * .2) : 0;
    s.turn++; s.energy = 3; s.traitUsed = false; s.block = retainedBlock + (s.relic ? 2 : 0) + equipmentStats(s).block;
    draw(s, Math.max(0, 5 - s.hand.length)); log(s, `第 ${s.turn} 回合开始，能量恢复至 3。`);
    return s;
  }
  if (action.type === 'reward' && s.phase === 'reward') {
    if (action.key !== null && !s.choices.includes(action.key)) return state;
    if (action.key) { s.deck.push(action.key); log(s, `${card(action.key).name}加入卡组。`); }
    s.choices = [];
    if (s.bossFight) {
      s.clears[s.stage]++;
      s.unlocked = Math.min(ENEMIES.length - 1, Math.max(s.unlocked, s.stage + 1));
      s.mapRow = -1; s.currentNode = null; s.visited = [];
      s.checkpointRow = -1;
      s.phase = 'hub'; s.elite = false; s.bossFight = false;
      log(s, `房车平安返回。${CHAPTERS[s.stage].name}探索次数：${s.clears[s.stage]}。`);
      return s;
    }
    s.phase = 'map'; s.elite = false; s.bossFight = false; return s;
  }
  if (action.type === 'camp' && s.phase === 'camp') {
    if (action.choice === 'rest') {
      const gain = Math.min(18, s.maxHp - s.hp); s.hp += gain; log(s, `在房车里小睡，回复 ${gain} 点生命。`);
    } else if (action.choice === 'upgrade') {
      const index = s.deck.findIndex(key => !key.endsWith('+') && card(key).type === 'attack');
      if (index < 0) return state;
      s.deck[index] += '+'; log(s, `${card(s.deck[index]).name}获得强化。`);
    } else if (action.choice === 'relic') {
      if (s.gold < 30 || s.relic) return state;
      s.gold -= 30; s.relic = true; log(s, '购入柔软靠枕：每回合开始获得 2 点护盾。');
    } else return state;
    s.phase = 'map'; return s;
  }
  if (action.type === 'event' && s.phase === 'event') {
    if (action.choice === 'spring') {
      const gain = Math.min(12, s.maxHp - s.hp); s.hp += gain; log(s, `喝下花茶，回复 ${gain} 点生命。`);
    } else if (action.choice === 'bargain') {
      s.hp = Math.max(1, s.hp - 5); s.gold += 22; log(s, '你卖掉一张旧照片，获得 22 枚旅币。');
    } else return state;
    s.phase = 'map'; return s;
  }
  if (action.type === 'checkpoint' && s.phase === 'checkpoint') {
    const step = s.mapRow + 1;
    const available = CHECKPOINTS[step]?.choices.map(choice => choice.key) || [];
    if (!available.includes(action.choice)) return state;
    const upgradeCards = amount => {
      let upgraded = 0;
      for (let index = 0; index < s.deck.length && upgraded < amount; index++) {
        if (!s.deck[index].endsWith('+')) { s.deck[index] += '+'; upgraded++; }
      }
      return upgraded;
    };
    const addRandomCard = () => {
      const key = REWARDS[Math.floor(random(s) * REWARDS.length)];
      s.deck.push(key);
      return card(key).name;
    };
    if (action.choice === 'rest') {
      const gain = Math.min(Math.ceil(s.maxHp * .35), s.maxHp - s.hp); s.hp += gain;
      log(s, `在夜程路标旁睡了一会儿，回复 ${gain} 点生命。`);
    } else if (action.choice === 'upgrade') {
      const index = s.deck.findIndex(key => !key.endsWith('+'));
      if (index >= 0) { const name = card(s.deck[index]).name; s.deck[index] += '+'; log(s, `在路灯下整理卡组，「${name}」得到强化。`); }
      else { s.gold += 20; log(s, '所有卡牌都已强化，整理出的旧物换得 20 枚旅币。'); }
    } else if (action.choice === 'supplies') {
      s.gold += 30; log(s, '补充沿途物资，获得 30 枚旅币。');
    } else if (action.choice === 'shopCard') {
      log(s, `从杂货铺买下「${addRandomCard()}」，加入卡组。`);
    } else if (action.choice === 'bargain') {
      const cost = Math.min(8, Math.max(0, s.hp - 1)); s.hp -= cost; s.gold += 45;
      log(s, `用 ${cost} 点生命交换旧回忆，获得 45 枚旅币。`);
    } else if (action.choice === 'shortRest') {
      const gain = Math.min(Math.ceil(s.maxHp * .2), s.maxHp - s.hp); s.hp += gain;
      log(s, `在杂货铺后休息片刻，回复 ${gain} 点生命。`);
    } else if (action.choice === 'doubleUpgrade') {
      const count = upgradeCards(2); log(s, count ? `重新剪辑记忆，强化了 ${count} 张卡牌。` : '所有卡牌都已强化。');
    } else if (action.choice === 'trimDeck') {
      const index = s.deck.findIndex(key => key === 'slash');
      if (index >= 0 && s.deck.length > 10) { s.deck.splice(index, 1); log(s, '剪掉一张重复的「轻声问候」，卡组变得更精炼。'); }
      else { s.gold += 25; log(s, '没有可剪掉的片段，放映室补偿了 25 枚旅币。'); }
    } else if (action.choice === 'rememberCard') {
      log(s, `从银幕带走「${addRandomCard()}」，加入卡组。`);
    } else if (action.choice === 'deepRest') {
      const gain = Math.min(Math.ceil(s.maxHp * .5), s.maxHp - s.hp); s.hp += gain;
      log(s, `在终夜整备站睡到月沉，回复 ${gain} 点生命。`);
    } else if (action.choice === 'tripleUpgrade') {
      const count = upgradeCards(3); log(s, count ? `完成终夜整理，强化了 ${count} 张卡牌。` : '所有卡牌都已强化。');
    } else if (action.choice === 'finalSupplies') {
      s.gold += 60; log(s, '装满最后一格行囊，获得 60 枚旅币。');
    }
    s.checkpointRow = s.mapRow;
    s.phase = 'map'; return s;
  }
  return state;
}
export function serialize(s) { return JSON.stringify(s); }
export function restore(raw) {
  try {
    const s = JSON.parse(raw);
    if (s?.version === 7 && Array.isArray(s.inventory) && s.inventory.every(item => typeof item === 'string')) {
      const migrated = s.inventory.map((base, index) => {
        const oldRarity = ITEMS[base]?.rarity || '普通';
        const rarity = oldRarity === '史诗' ? '稀有' : oldRarity === '传说' ? '传奇' : oldRarity;
        return { id: `gear-${index + 1}`, base, rarity, affixes: [], skill: null };
      });
      const idForBase = base => migrated.find(item => item.base === base)?.id || null;
      s.inventory = migrated;
      s.equipment = Object.fromEntries(Object.entries(s.equipment || {}).map(([slot, base]) => [slot, idForBase(base)]));
      s.lastLoot = idForBase(s.lastLoot);
      s.nextItemId = migrated.length + 1;
      s.guestRewards = [false, false, false, false, false, false];
      s.foe = 0;
      s.checkpointRow = -1;
      s.facilities = { kitchen: 0, workshop: 0, rooms: 0 };
      s.commissionClaims = { battles: 0, steps: 0, stories: 0 }; s.stepsTraveled = 0;
      s.version = 14;
    }
    if (s?.version === 8) { s.guestRewards = [false, false, false, false, false, false]; s.version = 9; }
    if (s?.version === 9) {
      const remapCheckpoint = id => {
        if (typeof id !== 'string') return id;
        const match = id.match(/^(c\d+r)(9|19|29|39)n\d$/);
        return match ? `${match[1]}${match[2]}checkpoint` : id;
      };
      s.currentNode = remapCheckpoint(s.currentNode);
      if (Array.isArray(s.visited)) s.visited = [...new Set(s.visited.map(remapCheckpoint))];
      s.foe = 0;
      s.checkpointRow = -1;
      s.facilities = { kitchen: 0, workshop: 0, rooms: 0 };
      s.commissionClaims = { battles: 0, steps: 0, stories: 0 }; s.stepsTraveled = 0;
      s.version = 14;
    }
    if (s?.version === 10) { s.foe = 0; s.version = 11; }
    if (s?.version === 11) { s.checkpointRow = -1; s.version = 12; }
    if (s?.version === 12) { s.facilities = { kitchen: 0, workshop: 0, rooms: 0 }; s.version = 13; }
    if (s?.version === 13) { s.commissionClaims = { battles: 0, steps: 0, stories: 0 }; s.stepsTraveled = 0; s.version = 14; }
    if (s?.version === 14) { s.difficulty = 'standard'; s.mapSeed = s.seed >>> 0; s.version = 15; }
    if (s?.version === 15) { if (Array.isArray(s.battleLog)) s.battleLog.reverse(); s.version = 16; }
    if (s?.version === 16) { s.foe = Math.min(s.foe || 0, (ENCOUNTERS[s.stage]?.length || 1) - 1); s.version = 17; }
    if (s?.version === 17) { s.tutorialDone = true; s.version = 18; }
    if (s?.version === 18) {
      const migrated = Object.fromEntries(Object.keys(SLOT_LABELS).map(slot => [slot, null]));
      for (const id of Object.values(s.equipment || {})) {
        const instance = itemFor(s, id);
        const slot = instance && ITEMS[instance.base]?.slot;
        if (slot && migrated[slot] === null) migrated[slot] = id;
      }
      s.equipment = migrated;
      s.version = 19;
    }
    if (s?.version === 19) {
      if (s.phase === 'combat') {
        const battlePiles = [s.hand, s.draw, s.discard, s.exhaust];
        const equippedSkills = Object.values(s.equipment || {}).map(id => itemFor(s, id)?.skill).filter(Boolean);
        for (const skill of equippedSkills) {
          const pile = battlePiles.find(cards => cards?.includes(skill));
          if (pile) pile[pile.indexOf(skill)] = `${skill}~gear`;
        }
      }
      s.version = 20;
    }
    if (s?.version === 20) {
      s.character = 'uncle';
      s.warmth = 0;
      s.traitUsed = false;
      s.version = VERSION;
    }
    const int = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
    const validCards = a => Array.isArray(a) && a.length <= 300 && a.every(k => typeof k === 'string' && /^[a-zA-Z]+\+?(?:~gear)?$/.test(k) && CARDS[k.replace('~gear', '').replace('+', '')]);
    if (!s || s.version !== VERSION || typeof s.tutorialDone !== 'boolean' || !CHARACTERS[s.character] || !int(s.warmth, 0, 12) || typeof s.traitUsed !== 'boolean' || !DIFFICULTIES[s.difficulty] || !['auto', 'manual'].includes(s.battleMode) || !['hub', 'map', 'combat', 'reward', 'camp', 'checkpoint', 'event', 'lost'].includes(s.phase)) return null;
    if (!int(s.stage, 0, ENEMIES.length - 1) || !int(s.level, 1, 100) || !int(s.xp, 0, 10000) || !int(s.nextXp, 1, 10000)) return null;
    if (!int(s.unlocked, 0, ENEMIES.length - 1) || !Array.isArray(s.clears) || s.clears.length !== ENEMIES.length || !s.clears.every(n => int(n, 0, 10000))) return null;
    if (!s.facilities || !['kitchen', 'workshop', 'rooms'].every(key => int(s.facilities[key], 0, 3))) return null;
    if (!s.commissionClaims || !['battles', 'steps', 'stories'].every(key => int(s.commissionClaims[key], 0, 10000)) || !int(s.stepsTraveled, 0, 1000000)) return null;
    if (!Array.isArray(s.guestRewards) || s.guestRewards.length !== GUESTS.length || !s.guestRewards.every(value => typeof value === 'boolean')) return null;
    if (!int(s.maxHp, 70, 700) || !int(s.hp, 0, s.maxHp) || !int(s.gold, 0, 100000)) return null;
    if (!int(s.seed, 0, 4294967295) || !int(s.mapSeed, 0, 4294967295) || !int(s.turn, 1, 10000) || !int(s.energy, 0, 100) || !int(s.block, 0, 10000) || !int(s.weak, 0, 1)) return null;
    if (![s.deck, s.hand, s.draw, s.discard, s.exhaust].every(validCards) || s.deck.length < 10 || s.hand.length > 9) return null;
    const enemyLimit = 1000;
    if (!s.enemy || !int(s.enemy.hp, 0, enemyLimit) || !int(s.enemy.maxHp, 0, enemyLimit) || !int(s.enemy.block, 0, 1000) || !int(s.enemy.mark, 0, 1000)) return null;
    if (!Array.isArray(s.log) || s.log.length > 24 || !s.log.every(x => typeof x === 'string' && x.length < 300) || typeof s.relic !== 'boolean') return null;
    if (!Array.isArray(s.battleLog) || s.battleLog.length > 160 || !s.battleLog.every(x => typeof x === 'string' && x.length < 300)) return null;
    const validAffix = affix => affix && AFFIXES.some(definition => definition.key === affix.key) && int(affix.value, 1, 20) && typeof affix.prefix === 'string';
    const validItem = item => item && typeof item.id === 'string' && /^gear-\d+$/.test(item.id) && ITEMS[item.base] && RARITIES.some(rarity => rarity.name === item.rarity) && Array.isArray(item.affixes) && item.affixes.length <= 4 && item.affixes.every(validAffix) && (item.skill === null || REWARDS.includes(item.skill));
    if (!Array.isArray(s.inventory) || s.inventory.length > 200 || !s.inventory.every(validItem) || new Set(s.inventory.map(item => item.id)).size !== s.inventory.length) return null;
    if (!int(s.nextItemId, 1, 1000000)) return null;
    if (!s.equipment || !Object.keys(SLOT_LABELS).every(slot => s.equipment[slot] === null || (itemFor(s, s.equipment[slot]) && ITEMS[itemFor(s, s.equipment[slot]).base].slot === slot))) return null;
    if (s.lastLoot !== null && !itemFor(s, s.lastLoot)) return null;
    if (![s.played, s.totalTurns, s.victories].every(n => int(n, 0, 100000)) || !int(s.foe, 0, 15) || !int(s.checkpointRow, -1, MAP_STEPS - 1) || typeof s.elite !== 'boolean' || typeof s.bossFight !== 'boolean') return null;
    const nodes = chapterMap(s.stage, s.mapSeed);
    if (!int(s.mapRow, -1, MAP_STEPS - 1) || (s.currentNode !== null && !nodes.some(n => n.id === s.currentNode))) return null;
    if (!Array.isArray(s.visited) || s.visited.length > MAP_STEPS || !s.visited.every(id => nodes.some(n => n.id === id))) return null;
    if (!Array.isArray(s.choices) || s.choices.length > 3 || !s.choices.every(k => REWARDS.includes(k))) return null;
    if (s.phase === 'combat' && (!s.hp || !s.enemy.hp || !s.enemy.maxHp)) return null;
    if (s.phase === 'lost' && s.hp !== 0) return null;
    if (s.phase === 'reward' && s.enemy.hp !== 0) return null;
    if (s.phase === 'reward' && (s.choices.length !== 3 || new Set(s.choices).size !== 3)) return null;
    return s;
  } catch { return null; }
}
