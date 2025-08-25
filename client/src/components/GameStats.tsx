import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Game } from '../../../server/src/schema';

interface GameStatsProps {
  games: Game[];
}

export function GameStats({ games }: GameStatsProps) {
  // Calculate statistics
  const totalGames = games.length;
  const xWins = games.filter(game => game.status === 'won' && game.winner === 'X').length;
  const oWins = games.filter(game => game.status === 'won' && game.winner === 'O').length;
  const draws = games.filter(game => game.status === 'draw').length;
  const inProgress = games.filter(game => game.status === 'in_progress').length;

  if (totalGames === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Game Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{totalGames}</div>
            <div className="text-sm text-gray-500">Total Games</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{xWins}</div>
            <div className="text-sm text-gray-500">X Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{oWins}</div>
            <div className="text-sm text-gray-500">O Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{draws}</div>
            <div className="text-sm text-gray-500">Draws</div>
          </div>
        </div>
        
        {inProgress > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">{inProgress}</Badge>
              <span className="text-sm text-blue-700">
                game{inProgress > 1 ? 's' : ''} in progress
              </span>
            </div>
          </div>
        )}

        {totalGames > 0 && (xWins > 0 || oWins > 0) && (
          <div className="mt-4 text-center text-sm text-gray-600">
            {xWins === oWins ? (
              "🤝 Perfectly balanced!"
            ) : xWins > oWins ? (
              `🏆 Player X is leading ${xWins}-${oWins}!`
            ) : (
              `🏆 Player O is leading ${oWins}-${xWins}!`
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}