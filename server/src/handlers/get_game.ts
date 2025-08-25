import { db } from '../db';
import { gamesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetGameInput, type Game } from '../schema';

export const getGame = async (input: GetGameInput): Promise<Game> => {
  try {
    // Query the database for the specific game
    const results = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, input.game_id))
      .execute();

    // Check if game exists
    if (results.length === 0) {
      throw new Error(`Game with ID ${input.game_id} not found`);
    }

    const gameData = results[0];

    // Return the game data (board is already a JSON array)
    return {
      id: gameData.id,
      board: gameData.board as Game['board'], // Cast JSON to proper board type
      current_player: gameData.current_player,
      status: gameData.status,
      winner: gameData.winner,
      created_at: gameData.created_at,
      updated_at: gameData.updated_at
    };
  } catch (error) {
    console.error('Get game failed:', error);
    throw error;
  }
};