import { z } from 'zod';

// Player enum schema
export const playerSchema = z.enum(['X', 'O']);
export type Player = z.infer<typeof playerSchema>;

// Game status enum schema
export const gameStatusSchema = z.enum(['in_progress', 'won', 'draw']);
export type GameStatus = z.infer<typeof gameStatusSchema>;

// Cell position schema (0-8 for 3x3 grid)
export const cellPositionSchema = z.number().int().min(0).max(8);
export type CellPosition = z.infer<typeof cellPositionSchema>;

// Board state schema - array of 9 cells, each can be null or a player
export const boardStateSchema = z.array(playerSchema.nullable()).length(9);
export type BoardState = z.infer<typeof boardStateSchema>;

// Game schema
export const gameSchema = z.object({
  id: z.number(),
  board: boardStateSchema,
  current_player: playerSchema,
  status: gameStatusSchema,
  winner: playerSchema.nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Game = z.infer<typeof gameSchema>;

// Input schema for creating a new game
export const createGameInputSchema = z.object({
  // No required inputs - games start with default state
});
export type CreateGameInput = z.infer<typeof createGameInputSchema>;

// Input schema for making a move
export const makeMoveInputSchema = z.object({
  game_id: z.number(),
  position: cellPositionSchema
});
export type MakeMoveInput = z.infer<typeof makeMoveInputSchema>;

// Input schema for getting a game by ID
export const getGameInputSchema = z.object({
  game_id: z.number()
});
export type GetGameInput = z.infer<typeof getGameInputSchema>;

// Input schema for resetting a game
export const resetGameInputSchema = z.object({
  game_id: z.number()
});
export type ResetGameInput = z.infer<typeof resetGameInputSchema>;