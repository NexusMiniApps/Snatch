export interface Player {
  id: string;
  score: number;
}

export interface Socket {
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  id?: string;
} 