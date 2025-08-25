import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type CreateGameInput } from '../schema';
import { createGame } from '../handlers/create_game';
import { eq } from 'drizzle-orm';

// Simple test input (empty object as no fields are required)
const testInput: CreateGameInput = {};

describe('createGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a game with default state', async () => {
    const result = await createGame(testInput);

    // Verify initial game state
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.board).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(result.current_player).toBe('X');
    expect(result.status).toBe('in_progress');
    expect(result.winner).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save game to database correctly', async () => {
    const result = await createGame(testInput);

    // Query the database to verify the game was saved
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, result.id))
      .execute();

    expect(games).toHaveLength(1);
    const savedGame = games[0];
    
    expect(savedGame.id).toBe(result.id);
    expect(savedGame.board).toEqual([null, null, null, null, null, null, null, null, null]);
    expect(savedGame.current_player).toBe('X');
    expect(savedGame.status).toBe('in_progress');
    expect(savedGame.winner).toBeNull();
    expect(savedGame.created_at).toBeInstanceOf(Date);
    expect(savedGame.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple games with unique IDs', async () => {
    const game1 = await createGame(testInput);
    const game2 = await createGame(testInput);
    const game3 = await createGame(testInput);

    // All games should have unique IDs
    expect(game1.id).not.toBe(game2.id);
    expect(game1.id).not.toBe(game3.id);
    expect(game2.id).not.toBe(game3.id);

    // All games should have the same initial state
    const expectedBoard = [null, null, null, null, null, null, null, null, null];
    
    expect(game1.board).toEqual(expectedBoard);
    expect(game2.board).toEqual(expectedBoard);
    expect(game3.board).toEqual(expectedBoard);
    
    expect(game1.current_player).toBe('X');
    expect(game2.current_player).toBe('X');
    expect(game3.current_player).toBe('X');
    
    expect(game1.status).toBe('in_progress');
    expect(game2.status).toBe('in_progress');
    expect(game3.status).toBe('in_progress');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createGame(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // For a new game, created_at and updated_at should be very close or equal
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should handle board state as proper JSON array', async () => {
    const result = await createGame(testInput);

    // Verify board is an array with correct structure
    expect(Array.isArray(result.board)).toBe(true);
    expect(result.board).toHaveLength(9);
    
    // Each cell should be null initially
    result.board.forEach((cell, index) => {
      expect(cell).toBeNull();
    });

    // Verify database storage preserves JSON structure
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, result.id))
      .execute();

    const savedGame = games[0];
    expect(Array.isArray(savedGame.board)).toBe(true);
    expect(savedGame.board).toHaveLength(9);
  });
});