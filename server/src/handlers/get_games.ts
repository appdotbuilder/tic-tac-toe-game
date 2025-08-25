import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type Game } from '../schema';
import { desc } from 'drizzle-orm';

export const getGames = async (): Promise<Game[]> => {
  try {
    // Fetch all games from the database, ordered by most recent first
    const results = await db.select()
      .from(gamesTable)
      .orderBy(desc(gamesTable.created_at))
      .execute();

    // Return the games with proper type structure
    return results.map(game => ({
      id: game.id,
      board: game.board as ("X" | "O" | null)[], // JSON field needs type assertion
      current_player: game.current_player,
      status: game.status,
      winner: game.winner,
      created_at: game.created_at!,
      updated_at: game.updated_at!
    }));
  } catch (error) {
    console.error('Failed to fetch games:', error);
    throw error;
  }
};