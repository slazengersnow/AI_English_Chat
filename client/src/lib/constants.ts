export const DIFFICULTY_LEVELS = {
  'toeic': {
    name: 'TOEIC',
    description: 'ビジネス英語・資格対策',
    color: 'purple',
    icon: 'briefcase',
  },
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
  'basic-verbs': {
    name: '基本動詞',
    description: '日常動詞の使い分け',
    color: 'orange',
    icon: 'zap',
  },
  'business-email': {
    name: 'ビジネスメール',
    description: '実務メール作成',
    color: 'red',
    icon: 'mail',
  },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY_LEVELS;