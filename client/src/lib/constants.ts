export const THEMES = {
  'self-understanding': {
    name: '自己理解',
    description: '強み・弱み、価値観の発見',
    icon: 'user',
    color: 'blue',
  },
  'skill-development': {
    name: 'スキル開発', 
    description: '必要なスキルの習得方法',
    icon: 'zap',
    color: 'green',
  },
  'work-techniques': {
    name: '仕事術',
    description: '効率的な働き方のコツ',
    icon: 'lightbulb',
    color: 'purple',
  },
  'career-strategy': {
    name: 'キャリア戦略',
    description: '長期的なキャリアプランニング',
    icon: 'trending-up',
    color: 'red',
  },
  'personal-growth': {
    name: 'パーソナル成長',
    description: '個人的な成長と自己啓発',
    icon: 'heart',
    color: 'yellow',
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

export const AFFILIATE_LINKS = {
  recruit: {
    name: 'リクルートエージェント',
    description: '転職支援実績No.1',
    url: 'https://www.r-agent.com/',
    color: 'blue',
  },
  studysapuri: {
    name: 'スタディサプリENGLISH',
    description: 'ビジネス英語学習',
    url: 'https://eigosapuri.jp/',
    color: 'green',
  },
} as const;
