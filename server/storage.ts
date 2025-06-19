import { TrainingSession } from "@shared/schema";

export interface IStorage {
  addTrainingSession(session: Omit<TrainingSession, 'id'>): Promise<TrainingSession>;
  getTrainingSessions(): Promise<TrainingSession[]>;
  getSessionsByDifficulty(difficultyLevel: string): Promise<TrainingSession[]>;
}

export class MemStorage implements IStorage {
  private sessions: Map<number, TrainingSession>;
  private currentId: number;

  constructor() {
    this.sessions = new Map();
    this.currentId = 1;
  }

  async addTrainingSession(sessionData: Omit<TrainingSession, 'id'>): Promise<TrainingSession> {
    const id = this.currentId++;
    const session: TrainingSession = {
      ...sessionData,
      id,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getTrainingSessions(): Promise<TrainingSession[]> {
    return Array.from(this.sessions.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getSessionsByDifficulty(difficultyLevel: string): Promise<TrainingSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.difficultyLevel === difficultyLevel)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();