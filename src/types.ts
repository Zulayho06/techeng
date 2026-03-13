export interface Word {
  english: string;
  uzbek: string;
  definition: string;
  example: string;
  visualPrompt: string;
  imageUrl?: string;
}

export interface GameState {
  score: number;
  currentWordIndex: number;
  words: Word[];
  status: 'loading' | 'playing' | 'finished';
  level: 'beginner' | 'intermediate' | 'advanced';
}
