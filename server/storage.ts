// 最小限のストレージモック
export class Storage {
  // ダミー実装
  async getTrainingSessions(userId: string): Promise<any[]> {
    return [];
  }

  async getUserGoals(userId: string): Promise<any[]> {
    return [];
  }

  async updateUserGoals(userId: string, data: any): Promise<any> {
    return {};
  }

  async getStreakCount(userId: string): Promise<number> {
    return 0;
  }

  async getDifficultyStats(userId: string): Promise<any> {
    return {};
  }

  async getMonthlyStats(
    userId: string,
    year: string,
    month: string,
  ): Promise<any> {
    return {};
  }

  async getSessionsForReview(
    userId: string,
    threshold: string,
  ): Promise<any[]> {
    return [];
  }

  async getRecentSessions(userId: string, daysBack: string): Promise<any[]> {
    return [];
  }

  async getBookmarkedSessions(userId: string): Promise<any[]> {
    return [];
  }

  async updateBookmark(
    sessionId: string,
    isBookmarked: boolean,
  ): Promise<void> {
    // ダミー実装
  }

  async updateReviewCount(sessionId: string): Promise<void> {
    // ダミー実装
  }

  async getCustomScenarios(userId: string): Promise<any[]> {
    return [];
  }

  async updateCustomScenario(id: string, data: any): Promise<any> {
    return {};
  }

  async deleteCustomScenario(id: string): Promise<void> {
    // ダミー実装
  }

  async getCustomScenario(id: string): Promise<any> {
    return {};
  }

  async getTodaysProblemCount(userId: string): Promise<number> {
    return 0;
  }

  async incrementDailyCount(): Promise<boolean> {
    // ダミー実装：常に許可
    return true;
  }
}

// デフォルトエクスポート
const storage = new Storage();
export default storage;
