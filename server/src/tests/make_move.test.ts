import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type MakeMoveInput, type Game, type BoardState } from '../schema';
import { makeMove } from '../handlers/make_move';
import { eq } from 'drizzle-orm';

// Helper function to create a test game
async function createTestGame(
  board: BoardState = [null, null, null, null, null, null, null, null, null],
  currentPlayer: 'X' | 'O' = 'X',
  status: 'in_progress' | 'won' | 'draw' = 'in_progress'
): Promise<Game> {
  const result = await db.insert(gamesTable)
    .values({
      board,
      current_player: currentPlayer,
      status,
      winner: null
    })
    .returning()
    .execute();

  return {
    ...result[0],
    board: result[0].board as BoardState
  };
}

describe('makeMove', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should make a valid move on empty position', async () => {
    const game = await createTestGame();
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 4 // Center position
    };

    const result = await makeMove(input);

    expect(result.id).toEqual(game.id);
    expect(result.board[4]).toEqual('X');
    expect(result.current_player).toEqual('O'); // Should switch to next player
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > game.updated_at).toBe(true);
  });

  it('should alternate players correctly', async () => {
    const game = await createTestGame(['X', null, null, null, null, null, null, null, null], 'O');
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 1
    };

    const result = await makeMove(input);

    expect(result.board[1]).toEqual('O');
    expect(result.current_player).toEqual('X'); // Should switch back to X
  });

  it('should detect horizontal win', async () => {
    const board: BoardState = ['X', 'X', null, null, null, null, null, null, null];
    const game = await createTestGame(board, 'X');
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 2 // Complete top row
    };

    const result = await makeMove(input);

    expect(result.board[2]).toEqual('X');
    expect(result.status).toEqual('won');
    expect(result.winner).toEqual('X');
    expect(result.current_player).toEqual('X'); // Stay with winning player
  });

  it('should detect vertical win', async () => {
    const board: BoardState = ['O', null, null, 'O', null, null, null, null, null];
    const game = await createTestGame(board, 'O');
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 6 // Complete left column
    };

    const result = await makeMove(input);

    expect(result.board[6]).toEqual('O');
    expect(result.status).toEqual('won');
    expect(result.winner).toEqual('O');
  });

  it('should detect diagonal win', async () => {
    const board: BoardState = ['X', null, null, null, 'X', null, null, null, null];
    const game = await createTestGame(board, 'X');
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 8 // Complete main diagonal
    };

    const result = await makeMove(input);

    expect(result.board[8]).toEqual('X');
    expect(result.status).toEqual('won');
    expect(result.winner).toEqual('X');
  });

  it('should detect anti-diagonal win', async () => {
    const board: BoardState = [null, null, 'O', null, 'O', null, null, null, null];
    const game = await createTestGame(board, 'O');
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 6 // Complete anti-diagonal
    };

    const result = await makeMove(input);

    expect(result.board[6]).toEqual('O');
    expect(result.status).toEqual('won');
    expect(result.winner).toEqual('O');
  });

  it('should detect draw when board is full with no winner', async () => {
    const board: BoardState = ['X', 'O', 'X', 'O', 'O', 'X', 'O', 'X', null];
    const game = await createTestGame(board, 'O');
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 8 // Fill last position
    };

    const result = await makeMove(input);

    expect(result.board[8]).toEqual('O');
    expect(result.status).toEqual('draw');
    expect(result.winner).toBeNull();
    expect(result.current_player).toEqual('O'); // Stay with current player on draw
  });

  it('should persist move to database', async () => {
    const game = await createTestGame();
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 0
    };

    await makeMove(input);

    // Query database to verify persistence
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, game.id))
      .execute();

    expect(games).toHaveLength(1);
    const persistedGame = games[0];
    const board = persistedGame.board as BoardState;
    expect(board[0]).toEqual('X');
    expect(persistedGame.current_player).toEqual('O');
    expect(persistedGame.status).toEqual('in_progress');
    expect(persistedGame.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent game', async () => {
    const input: MakeMoveInput = {
      game_id: 999,
      position: 4
    };

    await expect(makeMove(input)).rejects.toThrow(/Game with ID 999 not found/i);
  });

  it('should throw error for occupied position', async () => {
    const board: BoardState = ['X', null, null, null, null, null, null, null, null];
    const game = await createTestGame(board);
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 0 // Already occupied by X
    };

    await expect(makeMove(input)).rejects.toThrow(/Position 0 is already occupied/i);
  });

  it('should throw error for completed game', async () => {
    const board: BoardState = ['X', 'X', 'X', null, null, null, null, null, null];
    const game = await createTestGame(board, 'X', 'won');
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 3
    };

    await expect(makeMove(input)).rejects.toThrow(/Cannot make move on a completed game/i);
  });

  it('should handle all winning combinations correctly', async () => {
    const winningCombinations = [
      // Rows
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      // Columns  
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      // Diagonals
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of winningCombinations) {
      const board: BoardState = [null, null, null, null, null, null, null, null, null];
      board[a] = 'X';
      board[b] = 'X';
      
      const game = await createTestGame(board, 'X');
      const input: MakeMoveInput = {
        game_id: game.id,
        position: c
      };

      const result = await makeMove(input);
      
      expect(result.status).toEqual('won');
      expect(result.winner).toEqual('X');
      
      // Clean up for next iteration
      await db.delete(gamesTable).where(eq(gamesTable.id, game.id)).execute();
    }
  });

  it('should continue game when no win or draw occurs', async () => {
    const board: BoardState = ['X', 'O', null, null, null, null, null, null, null];
    const game = await createTestGame(board, 'X');
    const input: MakeMoveInput = {
      game_id: game.id,
      position: 4 // Center, doesn't create win
    };

    const result = await makeMove(input);

    expect(result.board[4]).toEqual('X');
    expect(result.status).toEqual('in_progress');
    expect(result.winner).toBeNull();
    expect(result.current_player).toEqual('O');
  });
});