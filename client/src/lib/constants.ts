export const DIFFICULTY_LEVELS = {
  'middle-school': {
    name: '中学英語',
    description: '基本的な文法と語彙',
    color: 'blue',
    icon: 'book-open',
  },
  'high-school': {
    name: '高校英語',
    description: '応用文法と表現',
    color: 'green',
    icon: 'graduation-cap',
  },
  'toeic': {
    name: 'TOEIC',
    description: 'ビジネス英語',
    color: 'purple',
    icon: 'briefcase',
  },
  'basic-verbs': {
    name: '基本動詞',
    description: '日常動詞の使い分け',
    color: 'orange',
    icon: 'zap',
  },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY_LEVELS;