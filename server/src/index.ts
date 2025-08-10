import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  uploadFileInputSchema, 
  getFileInputSchema, 
  incrementDownloadInputSchema 
} from './schema';

// Import handlers
import { uploadFile } from './handlers/upload_file';
import { getFile } from './handlers/get_file';
import { getFileStats } from './handlers/get_file_stats';
import { incrementDownloadCount } from './handlers/increment_download_count';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Upload a new file
  uploadFile: publicProcedure
    .input(uploadFileInputSchema)
    .mutation(({ input }) => uploadFile(input)),
  
  // Get file metadata by ID (for serving files)
  getFile: publicProcedure
    .input(getFileInputSchema)
    .query(({ input }) => getFile(input)),
  
  // Get file statistics for homepage display
  getFileStats: publicProcedure
    .query(() => getFileStats()),
  
  // Increment download count when file is accessed
  incrementDownloadCount: publicProcedure
    .input(incrementDownloadInputSchema)
    .mutation(({ input }) => incrementDownloadCount(input))
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
  console.log(`Earl Box TRPC server listening at port: ${port}`);
}

start();