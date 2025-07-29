"use strict";
// client/src/lib/constants.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.THEMES = exports.AFFILIATE_LINKS = exports.DIFFICULTY_LEVELS = void 0;
exports.DIFFICULTY_LEVELS = {
    toeic: {
        name: "TOEIC",
        description: "ビジネス英語・資格対策",
        color: "purple",
        icon: "briefcase",
    },
    "middle-school": {
        name: "中学英語",
        description: "基本的な文法と語彙",
        color: "blue",
        icon: "book-open",
    },
    "high-school": {
        name: "高校英語",
        description: "応用文法と表現",
        color: "green",
        icon: "graduation-cap",
    },
    "basic-verbs": {
        name: "基本動詞",
        description: "日常動詞の使い分け",
        color: "orange",
        icon: "zap",
    },
    "business-email": {
        name: "ビジネスメール",
        description: "実務メール作成",
        color: "red",
        icon: "mail",
    },
};
exports.AFFILIATE_LINKS = {
    chat: {
        url: "https://example.com/chat",
        name: "Chat Service",
        description: "A description of the chat service.",
    },
    pro: {
        url: "https://example.com/pro",
        name: "Pro Plan",
        description: "A description of the pro plan.",
    },
    recruit: {
        url: "https://example.com/recruit",
        name: "Recruit",
        description: "Recruit service for career.",
    },
    studysapuri: {
        url: "https://example.com/studysapuri",
        name: "スタディサプリ",
        description: "オンライン学習サービス。",
    },
};
exports.THEMES = {
    light: {
        name: "Light",
        description: "明るいテーマ",
        color: "blue",
        icon: "Sun",
    },
    dark: {
        name: "Dark",
        description: "暗いテーマ",
        color: "gray",
        icon: "Moon",
    },
};
