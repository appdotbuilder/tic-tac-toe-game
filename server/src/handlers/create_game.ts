import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type CreateGameInput, type Game } from '../schema';

export const createGame = async (input: CreateGameInput): Promise<Game> => {
  try {
    // Create a new game with default state
    const result = await db.insert(gamesTable)
      .values({
        board: [null, null, null, null, null, null, null, null, null], // Empty 3x3 board
        current_player: 'X', // X always starts first
        status: 'in_progress', // Game starts in progress
        winner: null, // No winner at start
        // created_at and updated_at will be set automatically by database defaults
      })
      .returning()
      .execute();

    const game = result[0];
    
    // Return the game with proper typing
    return {
      id: game.id,
      board: game.board as (null | 'X' | 'O')[], // Type assertion for JSON board
      current_player: game.current_player,
      status: game.status,
      winner: game.winner,
      created_at: game.created_at,
      updated_at: game.updated_at
    };
  } catch (error) {
    console.error('Game creation failed:', error);
    throw error;
  }
};