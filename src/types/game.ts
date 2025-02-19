export interface Player {
  id: string;
  score: number;
}

export interface Socket {
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  id?: string;
}
