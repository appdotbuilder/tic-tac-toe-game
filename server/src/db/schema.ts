import { serial, text, pgTable, timestamp, pgEnum, json } from 'drizzle-orm/pg-core';

// Player enum
export const playerEnum = pgEnum('player', ['X', 'O']);

// Game status enum
export const gameStatusEnum = pgEnum('game_status', ['in_progress', 'won', 'draw']);

export const gamesTable = pgTable('games', {
  id: serial('id').primaryKey(),
  board: json('board').notNull(), // JSON array of 9 cells (null | 'X' | 'O')
  current_player: playerEnum('current_player').notNull(),
  status: gameStatusEnum('status').notNull(),
  winner: playerEnum('winner'), // Nullable - only set when game is won
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Game = typeof gamesTable.$inferSelect; // For SELECT operations
export type NewGame = typeof gamesTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { games: gamesTable };