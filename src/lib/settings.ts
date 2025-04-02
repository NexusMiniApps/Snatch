/**
 * Application settings and configuration values
 */

// Event IDs
export const EVENT_IDS = {
  HUATZARD_EVENT: "eb5946d8-4b98-479e-83a9-c4c8093c83a1",
} as const;

// Game Settings
export const GAME_SETTINGS = {
  SNATCH_TIME_BUFFER: 30000, // 30 seconds in milliseconds
} as const; 

export const EVENT_TYPE = {
  GAME: "game",
  CHOSEN: "chosen",
  RANDOM: "random",
}
