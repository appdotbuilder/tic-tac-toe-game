import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type ResetGameInput, type Game } from '../schema';
import { resetGame } from '../handlers/reset_game';
import { eq } from 'drizzle-orm';

describe('resetGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should reset a game to initial state', async () => {
    // First create a game with some moves
    const createResult = await db.insert(gamesTable)
      .values({
        board: ['X', 'O', 'X', null, null, null, null, null, null], // Partially played game
        current_player: 'O',
        status: 'in_progress',
        winner: null,
      })
      .returning()
      .execute();

    const gameId = createResult[0].id;
    const originalCreatedAt = createResult[0].created_at;

    const input: ResetGameInput = {
      game_id: gameId
    };

    const result = await resetGame(input);

    // Verify the game is reset to initial state
    expect(result.id).toEqual(gameId);
    expect(result.board).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
    expect(result.created_at).toEqual(originalCreatedAt); // Should preserve original created_at
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalCreatedAt).toBe(true); // updated_at should be newer
  });

  it('should reset a completed game', async () => {
    // Create a completed game (won by X)
    const createResult = await db.insert(gamesTable)
      .values({
        board: ['X', 'X', 'X', 'O', 'O', null, null, null, null], // X wins
        current_player: 'O',
        status: 'won',
        winner: 'X',
      })
      .returning()
      .execute();

    const gameId = createResult[0].id;

    const input: ResetGameInput = {
      game_id: gameId
    };

    const result = await resetGame(input);

    // Verify the completed game is reset
    expect(result.board).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
  });

  it('should reset a draw game', async () => {
    // Create a draw game
    const createResult = await db.insert(gamesTable)
      .values({
        board: ['X', 'O', 'X', 'O', 'O', 'X', 'O', 'X', 'O'], // Draw
        current_player: 'X',
        status: 'draw',
        winner: null,
      })
      .returning()
      .execute();

    const gameId = createResult[0].id;

    const input: ResetGameInput = {
      game_id: gameId
    };

    const result = await resetGame(input);

    // Verify the draw game is reset
    expect(result.board).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
  });

  it('should update the database correctly', async () => {
    // Create a game to reset
    const createResult = await db.insert(gamesTable)
      .values({
        board: ['X', 'O', null, null, null, null, null, null, null],
        current_player: 'X',
        status: 'in_progress',
        winner: null,
      })
      .returning()
      .execute();

    const gameId = createResult[0].id;

    const input: ResetGameInput = {
      game_id: gameId
    };

    await resetGame(input);

    // Verify the database was updated
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, gameId))
      .execute();

    expect(games).toHaveLength(1);
    const savedGame = games[0];
    expect(savedGame.board).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(savedGame.current_player).toEqual('X');
    expect(savedGame.status).toEqual('in_progress');
    expect(savedGame.winner).toBeNull();
    expect(savedGame.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent game', async () => {
    const input: ResetGameInput = {
      game_id: 999 // Non-existent game ID
    };

    await expect(resetGame(input)).rejects.toThrow(/Game with ID 999 not found/i);
  });

  it('should preserve created_at timestamp', async () => {
    // Create a game with a specific created_at time
    const specificDate = new Date('2024-01-01T12:00:00Z');
    
    const createResult = await db.insert(gamesTable)
      .values({
        board: ['X', 'O', null, null, null, null, null, null, null],
        current_player: 'O',
        status: 'in_progress',
        winner: null,
        created_at: specificDate,
        updated_at: specificDate,
      })
      .returning()
      .execute();

    const gameId = createResult[0].id;

    const input: ResetGameInput = {
      game_id: gameId
    };

    const result = await resetGame(input);

    // Verify created_at is preserved but updated_at is changed
    expect(result.created_at.getTime()).toEqual(specificDate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThan(specificDate.getTime());
  });
});