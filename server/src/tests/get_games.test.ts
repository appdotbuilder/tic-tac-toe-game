import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { getGames } from '../handlers/get_games';

// Helper function to create a test game
const createTestGame = async (board?: ("X" | "O" | null)[], status?: string, winner?: string | null) => {
  const defaultBoard = [null, null, null, null, null, null, null, null, null];
  const gameBoard = board || defaultBoard;
  
  const result = await db.insert(gamesTable)
    .values({
      board: gameBoard as unknown,
      current_player: 'X',
      status: (status as any) || 'in_progress',
      winner: (winner as any) || null,
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('getGames', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no games exist', async () => {
    const result = await getGames();

    expect(result).toEqual([]);
  });

  it('should return all games', async () => {
    // Create test games
    await createTestGame();
    await createTestGame(['X', null, null, null, null, null, null, null, null]);
    await createTestGame(['X', 'O', null, null, null, null, null, null, null]);

    const result = await getGames();

    expect(result).toHaveLength(3);
    
    // Verify structure of returned games
    result.forEach(game => {
      expect(game.id).toBeDefined();
      expect(game.board).toHaveLength(9);
      expect(Array.isArray(game.board)).toBe(true);
      expect(['X', 'O']).toContain(game.current_player);
      expect(['in_progress', 'won', 'draw']).toContain(game.status);
      expect(game.created_at).toBeInstanceOf(Date);
      expect(game.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return games ordered by most recent first', async () => {
    // Create games with small delays to ensure different timestamps
    const game1 = await createTestGame();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    const game2 = await createTestGame(['X', null, null, null, null, null, null, null, null]);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    const game3 = await createTestGame(['X', 'O', null, null, null, null, null, null, null]);

    const result = await getGames();

    expect(result).toHaveLength(3);
    
    // Most recent game should be first
    expect(result[0].id).toBe(game3.id);
    expect(result[1].id).toBe(game2.id);
    expect(result[2].id).toBe(game1.id);
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return games with different statuses correctly', async () => {
    // Create games with different statuses
    await createTestGame(['X', 'O', 'X', 'O', 'X', 'O', 'X', null, null], 'won', 'X');
    await createTestGame(['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'], 'draw', null);
    await createTestGame(['X', 'O', null, null, null, null, null, null, null], 'in_progress', null);

    const result = await getGames();

    expect(result).toHaveLength(3);
    
    // Find each game by status
    const wonGame = result.find(g => g.status === 'won');
    const drawGame = result.find(g => g.status === 'draw');
    const inProgressGame = result.find(g => g.status === 'in_progress');

    // Verify won game
    expect(wonGame).toBeDefined();
    expect(wonGame!.winner).toBe('X');
    expect(wonGame!.board[0]).toBe('X');

    // Verify draw game
    expect(drawGame).toBeDefined();
    expect(drawGame!.winner).toBeNull();
    expect(drawGame!.board).toHaveLength(9);

    // Verify in-progress game
    expect(inProgressGame).toBeDefined();
    expect(inProgressGame!.winner).toBeNull();
    expect(inProgressGame!.status).toBe('in_progress');
  });

  it('should handle board state correctly', async () => {
    const testBoard: ("X" | "O" | null)[] = ['X', 'O', 'X', null, 'O', null, null, null, 'X'];
    await createTestGame(testBoard);

    const result = await getGames();

    expect(result).toHaveLength(1);
    expect(result[0].board).toEqual(testBoard);
    
    // Verify board contains expected values
    expect(result[0].board[0]).toBe('X');
    expect(result[0].board[1]).toBe('O');
    expect(result[0].board[3]).toBeNull();
    expect(result[0].board[8]).toBe('X');
  });
});