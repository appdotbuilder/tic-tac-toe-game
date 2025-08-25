import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createGameInputSchema,
  makeMoveInputSchema,
  getGameInputSchema,
  resetGameInputSchema
} from './schema';

// Import handlers
import { createGame } from './handlers/create_game';
import { makeMove } from './handlers/make_move';
import { getGame } from './handlers/get_game';
import { resetGame } from './handlers/reset_game';
import { getGames } from './handlers/get_games';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new Tic-Tac-Toe game
  createGame: publicProcedure
    .input(createGameInputSchema)
    .mutation(({ input }) => createGame(input)),
  
  // Make a move in an existing game
  makeMove: publicProcedure
    .input(makeMoveInputSchema)
    .mutation(({ input }) => makeMove(input)),
  
  // Get a specific game by ID
  getGame: publicProcedure
    .input(getGameInputSchema)
    .query(({ input }) => getGame(input)),
  
  // Reset a game to its initial state
  resetGame: publicProcedure
    .input(resetGameInputSchema)
    .mutation(({ input }) => resetGame(input)),
  
  // Get all games
  getGames: publicProcedure
    .query(() => getGames()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();