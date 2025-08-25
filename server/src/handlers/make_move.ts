import { db } from '../db';
import { gamesTable } from '../db/schema';
import { type MakeMoveInput, type Game, type Player, type BoardState } from '../schema';
import { eq } from 'drizzle-orm';

// Define winning combinations for 3x3 tic-tac-toe grid
const WINNING_COMBINATIONS = [
  // Rows
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  // Columns
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  // Diagonals
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(board: BoardState): Player | null {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

function isBoardFull(board: BoardState): boolean {
  return board.every(cell => cell !== null);
}

export const makeMove = async (input: MakeMoveInput): Promise<Game> => {
  try {
    // 1. Get the current game state
    const games = await db.select()
      .from(gamesTable)
      .where(eq(gamesTable.id, input.game_id))
      .execute();

    if (games.length === 0) {
      throw new Error(`Game with ID ${input.game_id} not found`);
    }

    const currentGame = games[0];
    
    // 2. Validate that the game is in progress
    if (currentGame.status !== 'in_progress') {
      throw new Error('Cannot make move on a completed game');
    }

    // 3. Parse and validate the current board state
    const board = currentGame.board as BoardState;
    if (!Array.isArray(board) || board.length !== 9) {
      throw new Error('Invalid board state');
    }

    // 4. Validate that the specified position is empty
    if (board[input.position] !== null) {
      throw new Error(`Position ${input.position} is already occupied`);
    }

    // 5. Create new board with the move
    const newBoard = [...board];
    newBoard[input.position] = currentGame.current_player;

    // 6. Check for win conditions
    const winner = checkWinner(newBoard);
    const isFull = isBoardFull(newBoard);
    
    let newStatus: 'in_progress' | 'won' | 'draw';
    let newWinner: Player | null = null;
    let nextPlayer: Player;

    if (winner) {
      newStatus = 'won';
      newWinner = winner;
      nextPlayer = currentGame.current_player; // Keep current player when game ends
    } else if (isFull) {
      newStatus = 'draw';
      nextPlayer = currentGame.current_player; // Keep current player when game ends
    } else {
      newStatus = 'in_progress';
      nextPlayer = currentGame.current_player === 'X' ? 'O' : 'X'; // Switch player
    }

    // 7. Update the game in the database
    const result = await db.update(gamesTable)
      .set({
        board: newBoard,
        current_player: nextPlayer,
        status: newStatus,
        winner: newWinner,
        updated_at: new Date()
      })
      .where(eq(gamesTable.id, input.game_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Failed to update game state');
    }

    // 8. Return the updated game state
    const updatedGame = result[0];
    return {
      ...updatedGame,
      board: updatedGame.board as BoardState
    };
  } catch (error) {
    console.error('Make move failed:', error);
    throw error;
  }
};