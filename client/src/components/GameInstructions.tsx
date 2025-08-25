import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GameInstructions() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📋 How to Play Tic-Tac-Toe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="font-semibold text-blue-600 min-w-[20px]">1.</span>
            <p>Two players take turns placing their marks (<span className="font-bold text-blue-600">X</span> and <span className="font-bold text-red-600">O</span>) on a 3×3 grid.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-semibold text-blue-600 min-w-[20px]">2.</span>
            <p><span className="font-bold text-blue-600">Player X</span> always goes first.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-semibold text-blue-600 min-w-[20px]">3.</span>
            <p>The first player to get <strong>three marks in a row</strong> (horizontally, vertically, or diagonally) wins!</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-semibold text-blue-600 min-w-[20px]">4.</span>
            <p>If all 9 squares are filled and no player has three in a row, the game is a <strong>draw</strong>.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-semibold text-blue-600 min-w-[20px]">5.</span>
            <p>Click on any empty cell to place your mark. You can reset the game or start a new one anytime!</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tips:</h4>
          <ul className="text-xs space-y-1 text-blue-700">
            <li>• Try to control the center square - it gives you more winning opportunities</li>
            <li>• Always block your opponent if they have two in a row</li>
            <li>• Look for ways to create two winning threats at once (a "fork")</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}