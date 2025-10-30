// 拼音练习题库数据
export interface PinyinQuestion {
  id: number;
  character: string;
  pinyin: string;
  tone: number; // 1-4声调，0表示轻声
}

// 拼音组件练习数据
export interface PinyinComponent {
  id: number;
  component: string; // 拼音组件（声母或韵母）
  type: 'initial' | 'final'; // 声母或韵母
  examples: string[]; // 示例字符
}

// 声母数据
export const initials: PinyinComponent[] = [
  { id: 1, component: 'b', type: 'initial', examples: ['爸', '白', '百'] },
  { id: 2, component: 'p', type: 'initial', examples: ['怕', '拍', '跑'] },
  { id: 3, component: 'm', type: 'initial', examples: ['妈', '买', '猫'] },
  { id: 4, component: 'f', type: 'initial', examples: ['发', '飞', '风'] },
  { id: 5, component: 'd', type: 'initial', examples: ['大', '打', '地'] },
  { id: 6, component: 't', type: 'initial', examples: ['他', '天', '头'] },
  { id: 7, component: 'n', type: 'initial', examples: ['你', '年', '女'] },
  { id: 8, component: 'l', type: 'initial', examples: ['来', '老', '了'] },
  { id: 9, component: 'g', type: 'initial', examples: ['个', '高', '狗'] },
  { id: 10, component: 'k', type: 'initial', examples: ['看', '开', '快'] },
  { id: 11, component: 'h', type: 'initial', examples: ['好', '和', '红'] },
  { id: 12, component: 'j', type: 'initial', examples: ['家', '叫', '九'] },
  { id: 13, component: 'q', type: 'initial', examples: ['去', '七', '前'] },
  { id: 14, component: 'x', type: 'initial', examples: ['小', '学', '心'] },
  { id: 15, component: 'zh', type: 'initial', examples: ['中', '知', '住'] },
  { id: 16, component: 'ch', type: 'initial', examples: ['吃', '车', '出'] },
  { id: 17, component: 'sh', type: 'initial', examples: ['是', '十', '上'] },
  { id: 18, component: 'r', type: 'initial', examples: ['人', '让', '日'] },
  { id: 19, component: 'z', type: 'initial', examples: ['在', '走', '字'] },
  { id: 20, component: 'c', type: 'initial', examples: ['从', '草', '菜'] },
  { id: 21, component: 's', type: 'initial', examples: ['三', '说', '谁'] },
  { id: 22, component: 'y', type: 'initial', examples: ['一', '有', '用'] },
  { id: 23, component: 'w', type: 'initial', examples: ['我', '为', '五'] },
];

// 韵母数据
export const finals: PinyinComponent[] = [
  { id: 1, component: 'a', type: 'final', examples: ['啊', '八', '马'] },
  { id: 2, component: 'o', type: 'final', examples: ['哦', '波', '多'] },
  { id: 3, component: 'e', type: 'final', examples: ['鹅', '的', '了'] },
  { id: 4, component: 'i', type: 'final', examples: ['衣', '你', '地'] },
  { id: 5, component: 'u', type: 'final', examples: ['乌', '不', '书'] },
  { id: 6, component: 'ü', type: 'final', examples: ['鱼', '女', '去'] },
  { id: 7, component: 'ai', type: 'final', examples: ['爱', '白', '来'] },
  { id: 8, component: 'ei', type: 'final', examples: ['诶', '北', '给'] },
  { id: 9, component: 'ui', type: 'final', examples: ['威', '水', '会'] },
  { id: 10, component: 'ao', type: 'final', examples: ['奥', '好', '老'] },
  { id: 11, component: 'ou', type: 'final', examples: ['欧', '头', '走'] },
  { id: 12, component: 'iu', type: 'final', examples: ['优', '六', '九'] },
  { id: 13, component: 'ie', type: 'final', examples: ['耶', '写', '学'] },
  { id: 14, component: 'üe', type: 'final', examples: ['约', '月', '雪'] },
  { id: 15, component: 'er', type: 'final', examples: ['儿', '二', '耳'] },
  { id: 16, component: 'an', type: 'final', examples: ['安', '看', '三'] },
  { id: 17, component: 'en', type: 'final', examples: ['恩', '人', '门'] },
  { id: 18, component: 'in', type: 'final', examples: ['因', '心', '金'] },
  { id: 19, component: 'un', type: 'final', examples: ['温', '春', '群'] },
  { id: 20, component: 'ün', type: 'final', examples: ['晕', '军', '云'] },
  { id: 21, component: 'ang', type: 'final', examples: ['昂', '长', '房'] },
  { id: 22, component: 'eng', type: 'final', examples: ['鞥', '风', '能'] },
  { id: 23, component: 'ing', type: 'final', examples: ['英', '听', '明'] },
  { id: 24, component: 'ong', type: 'final', examples: ['翁', '中', '红'] },
];

// 拼音组件练习模式
export type PracticeMode = 'character' | 'initial' | 'final';

// 拼音组件练习题目
export interface ComponentQuestion {
  id: number;
  component: string;
  type: 'initial' | 'final';
  examples: string[];
}

export const pinyinQuestions: PinyinQuestion[] = [
  // 常用汉字拼音练习
  { id: 1, character: '你', pinyin: 'ni', tone: 3 },
  { id: 2, character: '好', pinyin: 'hao', tone: 3 },
  { id: 3, character: '我', pinyin: 'wo', tone: 3 },
  { id: 4, character: '是', pinyin: 'shi', tone: 4 },
  { id: 5, character: '的', pinyin: 'de', tone: 0 },
  { id: 6, character: '在', pinyin: 'zai', tone: 4 },
  { id: 7, character: '有', pinyin: 'you', tone: 3 },
  { id: 8, character: '不', pinyin: 'bu', tone: 4 },
  { id: 9, character: '了', pinyin: 'le', tone: 0 },
  { id: 10, character: '人', pinyin: 'ren', tone: 2 },
  { id: 11, character: '他', pinyin: 'ta', tone: 1 },
  { id: 12, character: '这', pinyin: 'zhe', tone: 4 },
  { id: 13, character: '个', pinyin: 'ge', tone: 4 },
  { id: 14, character: '上', pinyin: 'shang', tone: 4 },
  { id: 15, character: '来', pinyin: 'lai', tone: 2 },
  { id: 16, character: '到', pinyin: 'dao', tone: 4 },
  { id: 17, character: '时', pinyin: 'shi', tone: 2 },
  { id: 18, character: '大', pinyin: 'da', tone: 4 },
  { id: 19, character: '地', pinyin: 'di', tone: 4 },
  { id: 20, character: '为', pinyin: 'wei', tone: 4 },
  { id: 21, character: '子', pinyin: 'zi', tone: 3 },
  { id: 22, character: '中', pinyin: 'zhong', tone: 1 },
  { id: 23, character: '你', pinyin: 'ni', tone: 3 },
  { id: 24, character: '说', pinyin: 'shuo', tone: 1 },
  { id: 25, character: '生', pinyin: 'sheng', tone: 1 },
  { id: 26, character: '国', pinyin: 'guo', tone: 2 },
  { id: 27, character: '年', pinyin: 'nian', tone: 2 },
  { id: 28, character: '着', pinyin: 'zhe', tone: 0 },
  { id: 29, character: '就', pinyin: 'jiu', tone: 4 },
  { id: 30, character: '那', pinyin: 'na', tone: 4 },
  { id: 31, character: '和', pinyin: 'he', tone: 2 },
  { id: 32, character: '要', pinyin: 'yao', tone: 4 },
  { id: 33, character: '她', pinyin: 'ta', tone: 1 },
  { id: 34, character: '出', pinyin: 'chu', tone: 1 },
  { id: 35, character: '也', pinyin: 'ye', tone: 3 },
  { id: 36, character: '得', pinyin: 'de', tone: 0 },
  { id: 37, character: '里', pinyin: 'li', tone: 3 },
  { id: 38, character: '后', pinyin: 'hou', tone: 4 },
  { id: 39, character: '自', pinyin: 'zi', tone: 4 },
  { id: 40, character: '以', pinyin: 'yi', tone: 3 },
  { id: 41, character: '会', pinyin: 'hui', tone: 4 },
  { id: 42, character: '家', pinyin: 'jia', tone: 1 },
  { id: 43, character: '可', pinyin: 'ke', tone: 3 },
  { id: 44, character: '下', pinyin: 'xia', tone: 4 },
  { id: 45, character: '而', pinyin: 'er', tone: 2 },
  { id: 46, character: '过', pinyin: 'guo', tone: 4 },
  { id: 47, character: '天', pinyin: 'tian', tone: 1 },
  { id: 48, character: '去', pinyin: 'qu', tone: 4 },
  { id: 49, character: '能', pinyin: 'neng', tone: 2 },
  { id: 50, character: '对', pinyin: 'dui', tone: 4 },
];

// 随机获取指定数量的题目
export function getRandomQuestions(count: number = 20): PinyinQuestion[] {
  const shuffled = [...pinyinQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pinyinQuestions.length));
}

// 获取拼音组件练习题目
export function getComponentQuestions(type: 'initial' | 'final', count: number = 10): ComponentQuestion[] {
  const components = type === 'initial' ? initials : finals;
  const shuffled = [...components].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, components.length)).map(comp => ({
    id: comp.id,
    component: comp.component,
    type: comp.type,
    examples: comp.examples
  }));
}

// 获取所有声母（按顺序）
export function getAllInitials(): string[] {
  return initials.map(item => item.component);
}

// 获取所有韵母（按顺序）
export function getAllFinals(): string[] {
  return finals.map(item => item.component);
}

// 获取声调符号
export function getToneSymbol(tone: number): string {
  const symbols = ['', 'ˉ', 'ˊ', 'ˇ', 'ˋ'];
  return symbols[tone] || '';
}
