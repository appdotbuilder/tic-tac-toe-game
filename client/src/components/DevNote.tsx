import { Alert, AlertDescription } from '@/components/ui/alert';

export function DevNote() {
  return (
    <Alert className="mb-6 border-yellow-200 bg-yellow-50">
      <AlertDescription className="text-yellow-800">
        <strong>🚧 Development Note:</strong> This frontend demonstrates the complete Tic-Tac-Toe game interface. 
        The backend handlers are currently placeholder implementations that return mock data. 
        In a production environment, these would be connected to a real database and contain the actual game logic 
        for move validation, win detection, and state persistence.
      </AlertDescription>
    </Alert>
  );
}