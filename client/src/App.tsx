import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { GameInstructions } from '@/components/GameInstructions';
import { GameStats } from '@/components/GameStats';
import { DevNote } from '@/components/DevNote';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Game, Player } from '../../server/src/schema';

function App() {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGameResult, setShowGameResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  // Load all games
  const loadGames = useCallback(async () => {
    try {
      const result = await trpc.getGames.query();
      setGames(result);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // Create a new game
  const handleNewGame = async () => {
    setIsLoading(true);
    try {
      const newGame = await trpc.createGame.mutate({});
      setCurrentGame(newGame);
      setShowGameResult(false);
      // Refresh games list
      await loadGames();
    } catch (error) {
      console.error('Failed to create new game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load an existing game
  const handleLoadGame = async (gameId: number) => {
    setIsLoading(true);
    try {
      const game = await trpc.getGame.query({ game_id: gameId });
      setCurrentGame(game);
      setShowGameResult(false);
      
      // Check if game is finished and show result
      if (game.status === 'won' && game.winner) {
        setResultMessage(`🎉 Player ${game.winner} wins!`);
        setShowGameResult(true);
      } else if (game.status === 'draw') {
        setResultMessage("🤝 It's a draw!");
        setShowGameResult(true);
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Make a move
  const handleCellClick = async (position: number) => {
    if (!currentGame || isLoading || currentGame.status !== 'in_progress') return;
    if (currentGame.board[position] !== null) return; // Cell already occupied

    setIsLoading(true);
    try {
      const updatedGame = await trpc.makeMove.mutate({
        game_id: currentGame.id,
        position: position
      });
      setCurrentGame(updatedGame);
      
      // Check if game is finished and show result
      if (updatedGame.status === 'won' && updatedGame.winner) {
        setResultMessage(`🎉 Player ${updatedGame.winner} wins!`);
        setShowGameResult(true);
      } else if (updatedGame.status === 'draw') {
        setResultMessage("🤝 It's a draw!");
        setShowGameResult(true);
      }
      
      // Refresh games list
      await loadGames();
    } catch (error) {
      console.error('Failed to make move:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset current game
  const handleResetGame = async () => {
    if (!currentGame) return;
    
    setIsLoading(true);
    try {
      const resetGame = await trpc.resetGame.mutate({ game_id: currentGame.id });
      setCurrentGame(resetGame);
      setShowGameResult(false);
      
      // Refresh games list
      await loadGames();
    } catch (error) {
      console.error('Failed to reset game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render a single cell
  const renderCell = (index: number) => {
    const cellValue = currentGame?.board[index];
    const isEmpty = cellValue === null;
    
    // Add visual symbols instead of plain X and O
    const displayValue = cellValue === 'X' ? '❌' : cellValue === 'O' ? '⭕' : '';
    
    return (
      <button
        key={index}
        onClick={() => handleCellClick(index)}
        disabled={!isEmpty || isLoading || currentGame?.status !== 'in_progress'}
        className={`
          game-cell game-element
          ${cellValue === 'X' ? 'game-cell-x' : ''}
          ${cellValue === 'O' ? 'game-cell-o' : ''}
          ${!isEmpty ? 'game-cell-filled' : ''}
        `}
      >
        {displayValue}
      </button>
    );
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'status-in-progress';
      case 'won':
        return 'status-won';
      case 'draw':
        return 'status-draw';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🎮 Tic-Tac-Toe</h1>
        <p className="text-gray-600">Challenge a friend to a classic game!</p>
      </div>

      <DevNote />

      <div className="grid md:grid-cols-2 gap-8">
        {/* Game Board */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Game Board</span>
              {currentGame && (
                <Badge className={getStatusColor(currentGame.status)}>
                  {currentGame.status.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </CardTitle>
            {currentGame && currentGame.status === 'in_progress' && (
              <p className="text-lg">
                Current Player: 
                <span className={`ml-2 font-bold current-player-pulse ${currentGame.current_player === 'X' ? 'text-blue-600' : 'text-red-600'}`}>
                  {currentGame.current_player === 'X' ? '❌' : '⭕'} {currentGame.current_player}
                </span>
              </p>
            )}
            {currentGame && currentGame.status === 'won' && currentGame.winner && (
              <p className="text-lg font-bold text-green-600">
                🏆 Player {currentGame.winner === 'X' ? '❌' : '⭕'} {currentGame.winner} Wins!
              </p>
            )}
            {currentGame && currentGame.status === 'draw' && (
              <p className="text-lg font-bold text-yellow-600">
                🤝 It's a Draw!
              </p>
            )}
          </CardHeader>
          <CardContent>
            {currentGame ? (
              <div className="space-y-4">
                {/* Game Board Grid */}
                <div className="game-board">
                  {Array.from({ length: 9 }, (_, index) => renderCell(index))}
                </div>
                
                {/* Game Controls */}
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleResetGame} 
                    disabled={isLoading}
                    variant="outline"
                  >
                    🔄 Reset Game
                  </Button>
                  <Button 
                    onClick={handleNewGame} 
                    disabled={isLoading}
                  >
                    ➕ New Game
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No active game</p>
                <Button onClick={handleNewGame} disabled={isLoading}>
                  {isLoading ? 'Creating...' : '🎯 Start New Game'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Games List */}
        <Card>
          <CardHeader>
            <CardTitle>Game History</CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No games yet. Start your first game!</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {games.map((game: Game) => (
                  <div
                    key={game.id}
                    onClick={() => handleLoadGame(game.id)}
                    className={`
                      game-card
                      ${currentGame?.id === game.id ? 'game-card-active' : 'bg-white'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Game #{game.id}</p>
                        <p className="text-sm text-gray-600">
                          {game.created_at.toLocaleDateString()} at {game.created_at.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(game.status)}>
                          {game.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {game.winner && (
                          <p className="text-sm mt-1 font-bold">
                            Winner: {game.winner}
                          </p>
                        )}
                        {game.status === 'in_progress' && (
                          <p className="text-sm mt-1">
                            Turn: {game.current_player}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game Statistics */}
      <GameStats games={games} />

      {/* Game Instructions */}
      <GameInstructions />

      {/* Game Result Dialog */}
      <AlertDialog open={showGameResult} onOpenChange={setShowGameResult}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Game Over!</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              {resultMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowGameResult(false)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;