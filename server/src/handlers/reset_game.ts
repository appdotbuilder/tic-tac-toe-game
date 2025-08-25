import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type ResetGameInput, type Game } from '../schema';
import { eq } from 'drizzle-orm';

export async function resetGame(input: ResetGameInput): Promise<Game> {
  try {
    // Find the existing game by ID
    const existingGames = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, input.game_id))
      .execute();

    if (existingGames.length === 0) {
      throw new Error(`Game with ID ${input.game_id} not found`);
    }

    // Reset the game to initial state
    const result = await db.update(gamesTable)
      .set({
        board: [null, null, null, null, null, null, null, null, null], // Clear the board
        current_player: 'X', // X always starts
        status: 'in_progress',
        winner: null, // Clear the winner
        updated_at: new Date() // Update the timestamp
        // Keep the original created_at unchanged
      })
      .where(eq(gamesTable.id, input.game_id))
      .returning()
      .execute();

    // Cast the board from unknown (JSON) to the proper BoardState type
    const resetGame = result[0];
    return {
      ...resetGame,
      board: resetGame.board as ('X' | 'O' | null)[]
    };
  } catch (error) {
    console.error('Game reset failed:', error);
    throw error;
  }
}