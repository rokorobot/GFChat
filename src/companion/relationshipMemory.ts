export interface UserFact {
  id?: string;
  category: 'location' | 'interests' | 'preferences' | 'personal' | string;
  key: string;
  value: string;
  confidenceScore?: number;
}

export interface RelationshipMemoryState {
  userId: string;
  affectionScore: number;
  facts: UserFact[];
}

export interface RelationshipMemoryProvider {
  getMemory: (userId: string) => Promise<RelationshipMemoryState>;
  saveFact: (userId: string, fact: UserFact) => Promise<void>;
  updateAffection: (userId: string, delta: number) => Promise<number>;
  clearMemory: (userId: string) => Promise<void>;
}

// Local storage fallback implementation
export class LocalRelationshipMemoryProvider implements RelationshipMemoryProvider {
  private getStorageKey(userId: string): string {
    return `gfchat_memory_${userId}`;
  }

  async getMemory(userId: string): Promise<RelationshipMemoryState> {
    const data = localStorage.getItem(this.getStorageKey(userId));
    if (!data) {
      return {
        userId,
        affectionScore: 50,
        facts: []
      };
    }
    try {
      return JSON.parse(data);
    } catch {
      return {
        userId,
        affectionScore: 50,
        facts: []
      };
    }
  }

  async saveFact(userId: string, fact: UserFact): Promise<void> {
    const memory = await this.getMemory(userId);
    const existingIndex = memory.facts.findIndex(
      f => f.category === fact.category && f.key === fact.key
    );

    if (existingIndex >= 0) {
      memory.facts[existingIndex] = { ...memory.facts[existingIndex], ...fact };
    } else {
      memory.facts.push(fact);
    }

    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(memory));
  }

  async updateAffection(userId: string, delta: number): Promise<number> {
    const memory = await this.getMemory(userId);
    memory.affectionScore = Math.max(0, Math.min(100, memory.affectionScore + delta));
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(memory));
    return memory.affectionScore;
  }

  async clearMemory(userId: string): Promise<void> {
    localStorage.removeItem(this.getStorageKey(userId));
  }
}
