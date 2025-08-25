import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetGameInput } from '../schema';
import { getGame } from '../handlers/get_game';

describe('getGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing game', async () => {
    // Create a test game first
    const gameData = {
      board: [null, 'X', null, 'O', 'X', null, null, null, 'O'],
      current_player: 'X' as const,
      status: 'in_progress' as const,
      winner: null
    };

    const insertResult = await db.insert(gamesTable)
      .values(gameData)
      .returning()
      .execute();

    const createdGame = insertResult[0];
    const input: GetGameInput = { game_id: createdGame.id };

    // Get the game
    const result = await getGame(input);

    // Verify all fields are returned correctly
    expect(result.id).toEqual(createdGame.id);
    expect(result.board).toEqual([null, 'X', null, 'O', 'X', null, null, null, 'O']);
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve a completed game with winner', async () => {
    // Create a completed game
    const gameData = {
      board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
      current_player: 'O' as const,
      status: 'won' as const,
      winner: 'X' as const
    };

    const insertResult = await db.insert(gamesTable)
      .values(gameData)
      .returning()
      .execute();

    const createdGame = insertResult[0];
    const input: GetGameInput = { game_id: createdGame.id };

    // Get the game
    const result = await getGame(input);

    // Verify completed game state
    expect(result.id).toEqual(createdGame.id);
    expect(result.board).toEqual(['X', 'X', 'X', 'O', 'O', null, null, null, null]);
    expect(result.current_player).toEqual('O');
    expect(result.status).toEqual('won');
    expect(result.winner).toEqual('X');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve a draw game', async () => {
    // Create a draw game
    const gameData = {
      board: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'],
      current_player: 'X' as const,
      status: 'draw' as const,
      winner: null
    };

    const insertResult = await db.insert(gamesTable)
      .values(gameData)
      .returning()
      .execute();

    const createdGame = insertResult[0];
    const input: GetGameInput = { game_id: createdGame.id };

    // Get the game
    const result = await getGame(input);

    // Verify draw game state
    expect(result.id).toEqual(createdGame.id);
    expect(result.board).toEqual(['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O']);
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('draw');
    expect(result.winner).toBeNull();
  });

  it('should throw error for non-existent game', async () => {
    const input: GetGameInput = { game_id: 999 };

    // Should throw an error for non-existent game
    expect(getGame(input)).rejects.toThrow(/Game with ID 999 not found/i);
  });

  it('should handle empty board correctly', async () => {
    // Create a fresh game with empty board
    const gameData = {
      board: [null, null, null, null, null, null, null, null, null],
      current_player: 'X' as const,
      status: 'in_progress' as const,
      winner: null
    };

    const insertResult = await db.insert(gamesTable)
      .values(gameData)
      .returning()
      .execute();

    const createdGame = insertResult[0];
    const input: GetGameInput = { game_id: createdGame.id };

    // Get the game
    const result = await getGame(input);

    // Verify empty board
    expect(result.board).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(result.board).toHaveLength(9);
    expect(result.current_player).toEqual('X');
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
  });

  it('should verify game exists in database after retrieval', async () => {
    // Create a test game
    const gameData = {
      board: ['X', null, 'O', null, null, null, null, null, null],
      current_player: 'O' as const,
      status: 'in_progress' as const,
      winner: null
    };

    const insertResult = await db.insert(gamesTable)
      .values(gameData)
      .returning()
      .execute();

    const createdGame = insertResult[0];
    const input: GetGameInput = { game_id: createdGame.id };

    // Get the game through handler
    const result = await getGame(input);

    // Verify the game still exists in database with correct data
    const dbGames = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, createdGame.id))
      .execute();

    expect(dbGames).toHaveLength(1);
    expect(dbGames[0].id).toEqual(result.id);
    expect(dbGames[0].board).toEqual(['X', null, 'O', null, null, null, null, null, null]);
    expect(dbGames[0].current_player).toEqual('O');
    expect(dbGames[0].status).toEqual('in_progress');
  });
});